import { I, mul, scale, translate } from "../render/mat";
import type { DrawOp } from "../render/ops";
import type { OverlayItem } from "../render/overlay";
import { progress, ramp, settle } from "../story/anim";
import { HOTSPOTS, HOTSPOT_SIZE } from "../story/layout";
import { LOTUS_BASE_Y, PATH_T_LOTUS, pathCenterline, pathPoint } from "../story/path";
import { BEATS, SCENE_OVERLAP, sceneDuration } from "../story/timeline";
import type { FrameContext, FrameOutput } from "./frame";
import { ALPANA_CENTER, alpanaOps } from "./shapes/alpana";
import { lotusBounds, lotusOps } from "./shapes/lotus";
import { glowPaint } from "./shapes/util";

const B = BEATS.awakening;
const SINDOOR = "#781f2b";
const FRAME_BOX = { x: 0, y: 0, w: 1080, h: 1920 } as const;

/**
 * Width in px of the title and subtitle text, measured with the shipped fonts. The old reveal wiped across a
 * full-width box; the overlay's box fits its text, so the wipe fraction is remapped to land on the same pixels.
 */
const TEXT_WIDTH = {
  bn: { title: 784.38, subtitle: 473.13 },
  en: { title: 848.91, subtitle: 454.84 },
} as const;

/** The old reveal (clip edge at p·120 − 10 % of the 1080 px frame) as the fraction of a text box centred in the frame. */
const wipe = (p: number, width: number): number => {
  if (p >= 1) return 1;
  if (p <= 0) return 0;
  const edgePx = (1080 * (p * 120 - 10)) / 100;
  const frac = (edgePx - (540 - width / 2)) / width;
  return Math.min(1, Math.max(0, (frac * 100 + 10) / 120));
};

/** Vertical centre of a reveal line whose box top is `top` (line-height 1.3, symmetric padding). */
const lineCentre = (top: number, size: number): number => top + size * 0.65;

/**
 * Scene 1, the awakening: the alpana draws itself, a tiny light warms the lotus, the lotus blooms, the closing curve
 * becomes the garden path; then the whole scene fades (one full-frame group). `beat` is scene-local and may exceed the
 * scene's end while the garden dissolves over it. Pure; the overlay ids are the same on every call.
 */
export const awakening = (beat: number, ctx: FrameContext): FrameOutput => {
  const { reducedMotion, interactive, guided, lang, text: tx } = ctx;
  const dur = sceneDuration("awakening");
  const live = beat >= 0 && beat < dur + SCENE_OVERLAP.awakening;
  const exit = progress(beat, [dur + 8, dur + 58]);
  const sceneAlpha = live ? 1 - exit : 0;

  const titleP = wipe(progress(beat, B.namesReveal), TEXT_WIDTH[lang].title);
  const subtitleP = wipe(progress(beat, B.subtitleIn), TEXT_WIDTH[lang].subtitle);
  const bn = lang === "bn";
  const overlay: OverlayItem[] = [
    {
      kind: "text",
      id: "aw-title",
      text: tx.title,
      x: 540,
      y: lineCentre(bn ? 338 : 336, bn ? 156 : 168),
      anchor: "center",
      style: "title",
      opacity: titleP > 0 ? sceneAlpha : 0,
      reveal: titleP,
    },
    {
      kind: "text",
      id: "aw-subtitle",
      text: tx.subtitle,
      x: 540,
      y: lineCentre(bn ? 572 : 570, bn ? 50 : 56),
      anchor: "center",
      style: "subtitle",
      opacity: subtitleP > 0 ? sceneAlpha : 0,
      reveal: subtitleP,
    },
    {
      kind: "hotspot",
      id: "hotspot-awakening",
      x: HOTSPOTS.lotus.x,
      y: HOTSPOTS.lotus.y,
      size: 330,
      label: tx.hintLotus,
      ariaLabel: tx.hintLotus,
      labelPosition: "below",
      visible: live && interactive && guided.awaiting === "awakening",
      action: "awakening",
    },
    {
      kind: "hotspot",
      id: "hotspot-meeting",
      x: HOTSPOTS.path.x,
      y: HOTSPOTS.path.y,
      size: HOTSPOT_SIZE.path,
      label: tx.hintPath,
      ariaLabel: tx.hintPath,
      labelPosition: "above",
      visible: live && interactive && guided.awaiting === "meeting",
      action: "meeting",
    },
  ];
  if (!live || sceneAlpha <= 0.002) return { draw: [], overlay };

  // the tiny gold light, then the glow that warms the lotus
  const light = progress(beat, B.lightIn);
  const lightR = ramp(beat, B.lightIn, 3, 26);
  const glow = progress(beat, B.lotusBloom);

  // the lotus: in guided mode it is a closed bud from the first frame so there is something to tap
  const lotusOpacity = guided.enabled ? 1 : progress(beat, [B.lotusBloom[0] - 14, B.lotusBloom[0] + 4]);
  const bloom = reducedMotion
    ? progress(beat, [B.lotusBloom[0], B.lotusBloom[0] + 20])
    : settle((beat - B.lotusBloom[0]) / (B.lotusBloom[1] - B.lotusBloom[0]));

  // the closing alpana curve that becomes the garden path
  const pathP = progress(beat, B.pathExtend);
  const tHead = PATH_T_LOTUS + (1 - PATH_T_LOTUS) * pathP;
  const head = pathPoint(tHead);

  const ops: DrawOp[] = alpanaOps(reducedMotion ? Math.max(beat, B.alpanaDraw[1]) : beat);

  if (light > 0.001) {
    const { x, y } = ALPANA_CENTER;
    ops.push({ kind: "ellipse", cx: x, cy: y, rx: lightR * 5.5, ry: lightR * 5.5, m: I, alpha: light * (1 - glow * 0.35) * 0.9, fill: glowPaint(x, y, lightR * 5.5) });
    ops.push({ kind: "ellipse", cx: x, cy: y, rx: lightR * 0.45, ry: lightR * 0.45, m: I, alpha: light * (1 - lotusOpacity * 0.85), fill: "#fff3cf" });
  }
  if (pathP > 0.001) {
    const d = pathCenterline(PATH_T_LOTUS, tHead);
    ops.push({ kind: "path", d, m: I, alpha: 0.35, stroke: { paint: "#e7c97c", width: 14, cap: "round" } });
    ops.push({ kind: "path", d, m: I, alpha: 0.85, stroke: { paint: SINDOOR, width: 5, cap: "round" } });
    if (pathP < 0.999) ops.push({ kind: "ellipse", cx: head.x, cy: head.y, rx: 11, ry: 11, m: I, alpha: 0.95, fill: "#f3d37e" });
  }
  if (lotusOpacity > 0.002) {
    const lm = mul(translate(540, LOTUS_BASE_Y), scale(1));
    ops.push({ kind: "group", alpha: lotusOpacity, bounds: lotusBounds(lm), ops: lotusOps(lm, { bloom, glow }) });
  }

  return { draw: [{ kind: "group", alpha: sceneAlpha, bounds: FRAME_BOX, ops }], overlay };
};
