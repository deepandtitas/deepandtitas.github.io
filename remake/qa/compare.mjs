// Visual parity: renders the remake's stills (half size) and compares each with the old build's reference still.
// Usage: node remake/qa/compare.mjs <frames…> [--lang=bn|en] [--reduced] [--no-render]
// Writes out/compare/<lang>-<frame>.png (reference | remake | difference ×4) and prints the mean absolute difference
// (0-255) and the share of clearly different pixels (> 48 summed RGB) per frame.
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findChrome } from "../../scripts/chrome.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const frames = args.filter((a) => /^\d+$/.test(a));
const lang = args.find((a) => a.startsWith("--lang="))?.slice(7) ?? "bn";
const reduced = args.includes("--reduced");
const refDir = path.join(root, "remake", "SPEC", "reference", reduced ? "reduced" : "");
const outStills = path.join(root, "out", reduced ? "stills-remake-reduced" : "stills-remake");
const outCmp = path.join(root, "out", "compare");
mkdirSync(outCmp, { recursive: true });

if (!args.includes("--no-render")) {
  const extra = reduced ? ['--props={"reducedMotion":true}'] : [];
  execFileSync("node", [path.join(root, "scripts", "stills.mjs"), ...frames, "--scale=0.5", `--lang=${lang}`, `--dir=${outStills}`, ...extra], { cwd: root, stdio: "inherit" });
}

const browser = await chromium.launch({ executablePath: findChrome(root), headless: true });
const page = await browser.newPage();
const b64 = (f) => readFileSync(f).toString("base64");
console.log(`\n${lang}${reduced ? " reduced" : ""}: frame  mean-diff  changed-px%`);
for (const f of frames) {
  const name = `${lang}-${String(f).padStart(4, "0")}.png`;
  const ref = path.join(refDir, name);
  const got = path.join(outStills, name);
  if (!existsSync(ref) || !existsSync(got)) {
    console.log(`  ${f}: missing ${existsSync(ref) ? "remake still" : "reference still"}`);
    continue;
  }
  const r = await page.evaluate(async ([a, b]) => {
    const load = async (s) => {
      const i = new Image();
      i.src = `data:image/png;base64,${s}`;
      await i.decode();
      return i;
    };
    const A = await load(a);
    const B = await load(b);
    const w = A.width;
    const h = A.height;
    const c = document.createElement("canvas");
    c.width = w * 3;
    c.height = h;
    const g = c.getContext("2d");
    g.drawImage(A, 0, 0);
    g.drawImage(B, w, 0, w, h);
    const da = g.getImageData(0, 0, w, h).data;
    const db = g.getImageData(w, 0, w, h).data;
    const diff = g.createImageData(w, h);
    let sum = 0;
    let changed = 0;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
      sum += d / 3;
      if (d > 48) changed++;
      const v = Math.min(255, d * 4);
      diff.data[i] = v;
      diff.data[i + 1] = v;
      diff.data[i + 2] = v;
      diff.data[i + 3] = 255;
    }
    g.putImageData(diff, w * 2, 0);
    return { mean: sum / (w * h), changed: (100 * changed) / (w * h), png: c.toDataURL("image/png").split(",")[1] };
  }, [b64(ref), b64(got)]);
  writeFileSync(path.join(outCmp, name), Buffer.from(r.png, "base64"));
  console.log(`  ${String(f).padStart(4)}  ${r.mean.toFixed(2).padStart(8)}  ${r.changed.toFixed(2).padStart(10)}`);
}
await browser.close();
console.log(`montages: ${outCmp}`);
