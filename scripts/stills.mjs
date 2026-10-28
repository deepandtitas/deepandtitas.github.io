// Dev helper: render a set of stills to out/stills for visual review.
// Usage: node scripts/stills.mjs 0 150 239 ...   [--lang=en] [--dir=out/stills]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const frames = args.filter((a) => /^\d+$/.test(a)).map(Number);
const opt = (name, fallback) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;
const lang = opt("lang", "bn");
const dir = path.resolve(root, opt("dir", "out/stills"));
const extra = opt("props", "");
mkdirSync(dir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(root, "src/remotion/index.ts"), publicDir: path.join(root, "public") });
const inputProps = { lang, ...(extra ? JSON.parse(extra) : {}) };
const composition = await selectComposition({ serveUrl, id: "DeepAndTitasWedding", inputProps });
for (const frame of frames) {
  const output = path.join(dir, `${lang}-${String(frame).padStart(4, "0")}.png`);
  await renderStill({ composition, serveUrl, frame, output, inputProps });
  console.log("rendered", output);
}
