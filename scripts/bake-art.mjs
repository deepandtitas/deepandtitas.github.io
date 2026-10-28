// Bakes the generated SVG art (art/*.svg) into compact WebP files in public/images/.
//
// Why: SVGs with feTurbulence / feDisplacementMap are expensive for phones to decode, and browsers re-rasterise SVG
// images whenever they are moved or scaled. Pre-rendered WebP is decoded once, composited on the GPU and is far smaller.
//
// Usage: node scripts/generate-art.mjs && node scripts/bake-art.mjs
// Uses headless Chrome from Remotion's cache (installed by `npx remotion compositions …`) or CHROME_PATH.
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artDir = path.join(root, "art");
const outDir = path.join(root, "public", "images");
mkdirSync(outDir, { recursive: true });

const findChrome = () => {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = path.join(root, "node_modules", ".remotion", "chrome-headless-shell");
  const walk = (dir, depth) => {
    if (depth < 0 || !existsSync(dir)) return null;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isFile() && /^chrome-headless-shell(\.exe)?$/.test(entry.name)) return p;
      if (entry.isDirectory()) {
        const found = walk(p, depth - 1);
        if (found) return found;
      }
    }
    return null;
  };
  const found = walk(base, 4);
  if (found) return found;
  throw new Error("No Chrome found. Run `npx remotion compositions src/remotion/index.ts` once or set CHROME_PATH.");
};

// Serve art/ over http so the SVG and the canvas share an origin (file:// would taint the canvas).
const server = createServer((req, res) => {
  const file = path.join(artDir, decodeURIComponent((req.url ?? "/").split("?")[0]));
  if (req.url === "/" ) {
    res.setHeader("content-type", "text/html");
    res.end("<!doctype html><meta charset=utf-8><body></body>");
    return;
  }
  if (!file.startsWith(artDir) || !existsSync(file)) {
    res.statusCode = 404;
    res.end();
    return;
  }
  res.setHeader("content-type", file.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream");
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ executablePath: findChrome(), headless: true });
const page = await browser.newPage();
await page.goto(`${origin}/`);

/** Rasterise an SVG to WebP. `opaque` flattens onto an opaque background for smaller files. */
const bakeSvg = async (name, { scale = 1, quality = 0.82 } = {}) => {
  const svg = readFileSync(path.join(artDir, `${name}.svg`), "utf8");
  const [, w, h] = /width="(\d+)" height="(\d+)"/.exec(svg);
  const b64 = await page.evaluate(
    async ({ url, w, h, scale, quality }) => {
      const img = new Image();
      img.src = url;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = Math.round(w * scale);
      c.height = Math.round(h * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise((r) => c.toBlob(r, "image/webp", quality));
      return await new Promise((r) => {
        const fr = new FileReader();
        fr.onload = () => r(String(fr.result).split(",")[1]);
        fr.readAsDataURL(blob);
      });
    },
    { url: `${origin}/${name}.svg`, w: +w, h: +h, scale, quality },
  );
  const out = path.join(outDir, `${name}.webp`);
  writeFileSync(out, Buffer.from(b64, "base64"));
  console.log(`${name}.webp  ${(Buffer.from(b64, "base64").length / 1024).toFixed(0)} KB  (${Math.round(+w * scale)}×${Math.round(+h * scale)})`);
};

await bakeSvg("paper", { quality: 0.8 });
await bakeSvg("garden-far", { quality: 0.82 });
await bakeSvg("garden-mid", { quality: 0.84 });
await bakeSvg("garden-near", { quality: 0.84 });

// Paper grain: a small seamless tile (random noise tiles by nature), laid with CSS `background-repeat`
// instead of one full-frame image blended with mix-blend-mode (which forces expensive full-frame compositing).
{
  const b64 = await page.evaluate(async () => {
    const S = 256;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d");
    const d = ctx.createImageData(S, S);
    let a = 1234567;
    const rnd = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < S * S; i++) {
      const v = rnd();
      d.data[i * 4] = 78;
      d.data[i * 4 + 1] = 58;
      d.data[i * 4 + 2] = 40;
      d.data[i * 4 + 3] = v > 0.55 ? Math.round((v - 0.55) * 2.2 * 80) : 0;
    }
    ctx.putImageData(d, 0, 0);
    const blob = await new Promise((r) => c.toBlob(r, "image/webp", 0.8));
    return await new Promise((r) => {
      const fr = new FileReader();
      fr.onload = () => r(String(fr.result).split(",")[1]);
      fr.readAsDataURL(blob);
    });
  });
  const buf = Buffer.from(b64, "base64");
  writeFileSync(path.join(outDir, "grain-tile.webp"), buf);
  console.log(`grain-tile.webp  ${(buf.length / 1024).toFixed(0)} KB  (256×256 tile)`);
}

await browser.close();
server.close();
