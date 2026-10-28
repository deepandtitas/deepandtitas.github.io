// Compares every baked public/art/*.webp with the old build's image of the same name (decoded in headless Chrome).
// Usage: node scripts/art/compare.mjs [oldRepo]   Reports size match and mean absolute RGBA difference (0-255).
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findChrome } from "../chrome.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const old = process.argv[2] ?? "C:/Projects/deepandtitas.github.io";
const entries = (file) => {
  const m = /export const ART = (\{[\s\S]*?\n\}) as const;/.exec(readFileSync(file, "utf8"));
  return JSON.parse(m[1]);
};
const next = entries(path.join(root, "src/art/manifest.ts"));
const prev = entries(path.join(old, "src/remotion/art-manifest.ts"));
const browser = await chromium.launch({ executablePath: findChrome(root), headless: true });
const page = await browser.newPage();
const b64 = (f) => readFileSync(f).toString("base64");
let worst = 0;
let bad = 0;
const rows = [];
for (const name of Object.keys(prev)) {
  if (!next[name]) {
    console.log(`MISSING ${name}`);
    bad++;
    continue;
  }
  const a = b64(path.join(root, "public", next[name].src));
  const b = b64(path.join(old, "public", prev[name].src));
  const r = await page.evaluate(async ([a, b]) => {
    const load = async (s) => {
      const i = new Image();
      i.src = `data:image/webp;base64,${s}`;
      await i.decode();
      const c = document.createElement("canvas");
      c.width = i.width;
      c.height = i.height;
      const x = c.getContext("2d");
      x.drawImage(i, 0, 0);
      return { w: i.width, h: i.height, d: x.getImageData(0, 0, i.width, i.height).data };
    };
    const p = await load(a);
    const q = await load(b);
    if (p.w !== q.w || p.h !== q.h) return { size: false, pw: p.w, ph: p.h, qw: q.w, qh: q.h };
    let s = 0;
    for (let i = 0; i < p.d.length; i++) s += Math.abs(p.d[i] - q.d[i]);
    return { size: true, diff: s / p.d.length };
  }, [a, b]);
  const rect = ["x", "y", "w", "h"].every((k) => next[name][k] === prev[name][k]);
  const ok = r.size && rect && r.diff <= 2;
  if (!ok) bad++;
  rows.push({ name, ...r, rect, ok });
}
await browser.close();
rows.sort((x, y) => (y.diff ?? 999) - (x.diff ?? 999));
for (const r of rows) {
  worst = Math.max(worst, r.diff ?? 999);
  console.log(`${r.ok ? "ok  " : "FAIL"} ${r.name.padEnd(28)} size ${r.size ? "match" : `${r.pw}x${r.ph} vs ${r.qw}x${r.qh}`}  rect ${r.rect ? "match" : "DIFF"}  diff ${r.diff?.toFixed(3) ?? "-"}`);
}
console.log(`\n${rows.length} pieces, ${bad} failing, worst diff ${worst.toFixed(3)}`);
process.exit(bad ? 1 : 0);
