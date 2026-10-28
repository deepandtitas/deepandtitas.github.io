// Plays the built site in headless Chrome as a throttled phone and reports frame rate per scene.
// Usage: npm run profile            (builds first)
//        node scripts/profile.mjs [--throttle=4] [--no-build] [--width=390 --height=844 --dpr=3]
// Target: ≈60 fps in every scene at 2× CPU throttling, ≤ ~70 layers per scene and no layer churn. Headless Chrome may composite in software, so treat the
// numbers as a relative benchmark between changes, not as an absolute device measurement.
import { chromium } from "playwright-core";
import { execSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findChrome } from "./chrome.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name, fallback) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;
const throttle = Number(opt("throttle", "4"));
const width = Number(opt("width", "390"));
const height = Number(opt("height", "844"));
const dpr = Number(opt("dpr", "3"));

if (!args.includes("--no-build")) execSync("npm run build", { cwd: root, stdio: "inherit" });

const dist = path.join(root, "dist");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".svg": "image/svg+xml", ".jpg": "image/jpeg" };
const server = createServer((req, res) => {
  let file = path.join(dist, decodeURIComponent((req.url ?? "/").split("?")[0]));
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!file.startsWith(dist) || !existsSync(file)) {
    res.statusCode = 404;
    res.end();
    return;
  }
  const body = readFileSync(file);
  res.setHeader("content-type", TYPES[path.extname(file)] ?? "application/octet-stream");
  res.setHeader("content-length", body.length);
  res.end(body);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/?debug`;

const browser = await chromium.launch({
  executablePath: findChrome(root),
  headless: true,
  args: ["--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--autoplay-policy=no-user-gesture-required"],
});
const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await page.goto(url);
await page.waitForFunction(() => window.__weddingPlayer?.current, null, { timeout: 60000 });
await page.waitForTimeout(800);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });

// record every animation frame with the Player's current frame
await page.evaluate(() => {
  const log = [];
  window.__frameLog = log;
  const tick = (t) => {
    log.push([t, window.__weddingPlayer.current?.getCurrentFrame() ?? -1]);
    if (!window.__frameDone) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
await cdp.send("Performance.enable");
// composited layers: phones drop GPU tiles (parts of the picture blink out) when there are too many, or when layers
// are created and destroyed while playing
let layerCount = 0;
cdp.on("LayerTree.layerTreeDidChange", (e) => {
  if (e.layers) layerCount = e.layers.filter((l) => l.drawsContent && !l.invisible).length;
});
await cdp.send("LayerTree.enable");
await page.tap(".cover .btn--primary");
const started = Date.now();
// sample main-thread time (script / style / layout) every half second, attributed to the scene being played
const samples = [];
for (;;) {
  const [{ metrics }, state] = await Promise.all([
    cdp.send("Performance.getMetrics"),
    page.evaluate(() => [window.__weddingPlayer.current?.getCurrentFrame() ?? 0, window.__weddingState?.current?.phase]),
  ]);
  const m = Object.fromEntries(metrics.map((x) => [x.name, x.value]));
  samples.push({ t: Date.now(), frame: state[0], layers: layerCount, script: m.ScriptDuration, style: m.RecalcStyleDuration, layout: m.LayoutDuration, task: m.TaskDuration });
  if (state[1] === "finished" || Date.now() - started > 180000) break;
  await new Promise((r) => setTimeout(r, 500));
}
const wall = (Date.now() - started) / 1000;
const log = await page.evaluate(() => {
  window.__frameDone = true;
  return window.__frameLog;
});
await browser.close();
server.close();

// scene boundaries in frames, read from the timeline (beats × frames-per-beat) so this script never drifts from it
const timeline = readFileSync(path.join(root, "src", "config", "timeline.ts"), "utf8");
const fpb = Number(/export const FPS = (\d+)/.exec(timeline)[1]) / Number(/export const BEAT_FPS = (\d+)/.exec(timeline)[1]);
const SCENES = Object.fromEntries(
  [...timeline.matchAll(/(\w+): \{ start: (\d+), end: (\d+) \}/g)].map(([, id, a, b]) => [id, { start: +a * fpb, end: +b * fpb }]),
);

const rows = [];
for (const [id, s] of Object.entries(SCENES)) {
  const frames = log.filter(([, f]) => f >= s.start && f < s.end);
  if (frames.length < 3) continue;
  const dts = [];
  for (let i = 1; i < frames.length; i++) dts.push(frames[i][0] - frames[i - 1][0]);
  dts.sort((a, b) => a - b);
  const avg = dts.reduce((a, b) => a + b, 0) / dts.length;
  const p95 = dts[Math.floor(dts.length * 0.95)];
  const dropped = dts.filter((d) => d > 25).length;
  const advanced = frames[frames.length - 1][1] - frames[0][1];
  // main-thread share of wall time while this scene played (CPU throttling inflates these proportionally)
  const ss = samples.filter((x, i) => i > 0 && x.frame >= s.start && x.frame < s.end);
  const share = (k) => {
    let busy = 0;
    let span = 0;
    for (const x of ss) {
      const prev = samples[samples.indexOf(x) - 1];
      busy += x[k] - prev[k];
      span += (x.t - prev.t) / 1000;
    }
    return span > 0 ? `${Math.round((busy / span) * 100)}%` : "-";
  };
  // layer churn: how often the layer count changed after the scene's first second (target 0)
  const settled = ss.filter((x) => x.frame >= s.start + 60);
  const churn = settled.filter((x, i) => i > 0 && x.layers !== settled[i - 1].layers).length;
  const maxLayers = Math.max(0, ...ss.map((x) => x.layers));
  rows.push({ scene: id, fps: +(1000 / avg).toFixed(1), "p95 ms": +p95.toFixed(1), "long frames": dropped, "player frames": advanced, expected: s.end - s.start, script: share("script"), style: share("style"), layout: share("layout"), busy: share("task"), layers: maxLayers, "layer churn": churn });
}
console.log(`\n${width}×${height} @${dpr}x, CPU throttle ${throttle}×, wall ${wall.toFixed(1)} s (story is 50 s)`);
console.table(rows);
