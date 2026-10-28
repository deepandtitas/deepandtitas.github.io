// Dev helper: render a set of stills to out/stills for visual review.
// Usage: node scripts/stills.mjs 0 300 478 ...   [--lang=en] [--dir=out/stills] [--props='{"reducedMotion":true}']
// Frames are 60 FPS frames (beat × 2). Key frames: 0 300 478 840 1138 1640 1920 2098 2200 2999.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findChrome } from "./chrome.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const frames = args.filter((a) => /^\d+$/.test(a)).map(Number);
const opt = (name, fallback) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=") ?? fallback;
const lang = opt("lang", "bn");
const dir = path.resolve(root, opt("dir", "out/stills"));
const extra = opt("props", "");
const scale = Number(opt("scale", "1"));
mkdirSync(dir, { recursive: true });

let browserExecutable = null;
try {
  browserExecutable = findChrome(root);
} catch {
  // let Remotion download its own headless shell
}

const serveUrl = await bundle({ entryPoint: path.join(root, "src/remotion/index.ts"), publicDir: path.join(root, "public") });
const inputProps = { lang, ...(extra ? JSON.parse(extra) : {}) };
const composition = await selectComposition({ serveUrl, id: "DeepAndTitasWedding", inputProps, browserExecutable });
for (const frame of frames) {
  const output = path.join(dir, `${lang}-${String(frame).padStart(4, "0")}.png`);
  await renderStill({ composition, serveUrl, frame, output, inputProps, browserExecutable, scale });
  console.log("rendered", output);
}
