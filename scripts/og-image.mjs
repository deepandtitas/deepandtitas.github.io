// Generates the static Open Graph / Twitter preview image (public/og-image.jpg, 1200×630) from the real final card.
// Usage: node scripts/og-image.mjs
// It renders frame 1499 of the composition (the finished invitation) with Remotion, then lays it out next to the names and
// dates in headless Chrome using the same self-hosted fonts as the site.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const work = path.join(root, "out", "og");
mkdirSync(work, { recursive: true });

// 1. the finished card, straight from the composition
const serveUrl = await bundle({ entryPoint: path.join(root, "src/remotion/index.ts"), publicDir: path.join(root, "public") });
const inputProps = { lang: "bn" };
const composition = await selectComposition({ serveUrl, id: "DeepAndTitasWedding", inputProps });
const cardPng = path.join(work, "card.png");
await renderStill({ composition, serveUrl, frame: 1499, output: cardPng, inputProps, scale: 1 });

// 2. compose
const fonts = (p) => pathToFileURL(path.join(root, "node_modules", "@fontsource", p)).href;
const html = `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="${fonts("tiro-bangla/bengali-400.css")}">
<link rel="stylesheet" href="${fonts("galada/bengali-400.css")}">
<link rel="stylesheet" href="${fonts("hind-siliguri/bengali-600.css")}">
<link rel="stylesheet" href="${fonts("cormorant-garamond/latin-400.css")}">
<link rel="stylesheet" href="${fonts("cormorant-garamond/latin-400-italic.css")}">
<link rel="stylesheet" href="${fonts("cormorant-garamond/latin-600.css")}">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;overflow:hidden;position:relative;background:#f5ebdd;color:#30251f;font-family:"Tiro Bangla",serif}
  .paper{position:absolute;inset:0;background:url("${pathToFileURL(path.join(root, "public/images/paper.webp")).href}") center/cover}
  .frame{position:absolute;inset:22px;border:2px solid #c49a52;border-radius:6px}
  .frame::after{content:"";position:absolute;inset:8px;border:1px solid rgba(120,31,43,.55);border-radius:3px}
  .panel{position:absolute;right:0;top:0;bottom:0;width:440px;background:radial-gradient(circle at 50% 30%,#62262d 0%,#3b1b1c 60%,#26110f 100%)}
  .card{position:absolute;right:62px;top:48px;height:534px;border-radius:12px;box-shadow:0 18px 40px rgba(0,0,0,.5)}
  .text{position:absolute;left:84px;top:0;bottom:0;width:640px;display:flex;flex-direction:column;justify-content:center}
  .kicker{font-size:30px;color:#781f2b;letter-spacing:.03em}
  .rule{display:flex;align-items:center;gap:12px;margin:10px 0 26px;width:300px}
  .rule i{flex:1;height:2px;background:linear-gradient(90deg,#c49a52,transparent)}
  .rule b{width:12px;height:12px;background:#781f2b;transform:rotate(45deg)}
  .names{font-family:"Galada","Tiro Bangla",serif;font-size:118px;line-height:1.2;color:#781f2b}
  .en{font-family:"Cormorant Garamond",serif;font-style:italic;font-size:54px;color:#781f2b;margin-top:-4px}
  .dates{margin-top:26px;font-size:30px;line-height:1.55;color:#30251f}
  .dates span{color:#8f6c2a;font-family:"Hind Siliguri",sans-serif;font-weight:600;font-size:24px;margin-right:10px}
  .dates-en{margin-top:8px;font-family:"Cormorant Garamond",serif;font-size:27px;color:#665343;letter-spacing:.02em}
</style>
<div class="paper"></div><div class="frame"></div><div class="panel"></div>
<div class="text">
  <div class="kicker">সাদর আমন্ত্রণ</div>
  <div class="rule"><i></i><b></b></div>
  <div class="names">দীপ ও তিতাস</div>
  <div class="en">Deep &amp; Titas</div>
  <div class="dates"><span>শুভবিবাহ</span>২৫শে নভেম্বর ২০২৬<br><span>প্রীতিভোজ</span>২৭শে নভেম্বর ২০২৬</div>
  <div class="dates-en">Wedding 25 Nov · Reception 27 Nov 2026 · Kolkata</div>
</div>
<div class="card" style="width:${Math.round((940 * 534) / 1600)}px;overflow:hidden;background:#fbf4e6">
  <img src="${pathToFileURL(cardPng).href}" style="width:${Math.round(1080 * (534 / 1600))}px;margin-left:-${Math.round(70 * (534 / 1600))}px;margin-top:-${Math.round(160 * (534 / 1600))}px;display:block">
</div>
`;
// (the card is the 940×1600 region of the 1080×1920 frame, scaled to 534 px tall)
const doc = html;
const htmlPath = path.join(work, "og.html");
writeFileSync(htmlPath, doc);

const findChrome = () => {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = path.join(root, "node_modules", ".remotion", "chrome-headless-shell");
  const walk = (dir, depth) => {
    if (depth < 0 || !existsSync(dir)) return null;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isFile() && /^chrome-headless-shell(\.exe)?$/.test(e.name)) return p;
      if (e.isDirectory()) {
        const f = walk(p, depth - 1);
        if (f) return f;
      }
    }
    return null;
  };
  const f = walk(base, 4);
  if (!f) throw new Error("No Chrome found; set CHROME_PATH.");
  return f;
};
const browser = await chromium.launch({ executablePath: findChrome(), headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(htmlPath).href);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(root, "public", "og-image.jpg"), type: "jpeg", quality: 90 });
await browser.close();
console.log("wrote public/og-image.jpg");
