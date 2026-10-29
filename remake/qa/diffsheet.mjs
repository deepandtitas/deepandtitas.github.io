// Tiles the reference and remake panels of every montage in out/compare/<lang>-*.png into contact sheets
// (out/compare/sheet-<lang>-<n>.png), 10 frames per sheet, so a person can scan all of them quickly.
// Usage: node remake/qa/diffsheet.mjs [bn|en]
import { chromium } from "playwright-core";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findChrome } from "../../scripts/chrome.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const lang = process.argv[2] ?? "bn";
const dir = path.join(root, "out", "compare");
const files = readdirSync(dir).filter((f) => new RegExp(`^${lang}-\\d{4}\\.png$`).test(f)).sort();
const browser = await chromium.launch({ executablePath: findChrome(root), headless: true });
const page = await browser.newPage();
for (let s = 0; s * 10 < files.length; s++) {
  const batch = files.slice(s * 10, s * 10 + 10).map((f) => [f, readFileSync(path.join(dir, f)).toString("base64")]);
  const png = await page.evaluate(async (batch) => {
    const W = 216; // each panel scaled from 540×960
    const H = 384;
    const c = document.createElement("canvas");
    c.width = W * 3 * 5;
    c.height = (H + 16) * 2;
    const g = c.getContext("2d");
    g.fillStyle = "#222";
    g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < batch.length; i++) {
      const im = new Image();
      im.src = `data:image/png;base64,${batch[i][1]}`;
      await im.decode();
      const x = (i % 5) * W * 3;
      const y = Math.floor(i / 5) * (H + 16);
      g.drawImage(im, 0, 0, im.width, im.height, x, y + 16, W * 3, H);
      g.fillStyle = "#0f0";
      g.font = "13px sans-serif";
      g.fillText(batch[i][0], x + 4, y + 12);
    }
    return c.toDataURL("image/png").split(",")[1];
  }, batch);
  const out = path.join(dir, `sheet-${lang}-${s}.png`);
  writeFileSync(out, Buffer.from(png, "base64"));
  console.log(out);
}
await browser.close();
