/**
 * The garden behind and in front of the couple, as ops: far plane, sun warmth, the winding path, mid plane, the dusk
 * wash and the string lights (back); the near leaves that part before the card rises (foreground).
 * The planes are painted 1200 wide and sit at x = -60, drifting sideways by a transform only.
 */
import type { ArtName } from "../art/manifest";
import { I, mul, translate, type Mat } from "../render/mat";
import type { DrawOp } from "../render/ops";
import { gardenState } from "../story/choreography";
import { PATH_T_LOTUS, pathCenterline, pathPolygon } from "../story/path";
import { SCENE_BEATS, SCENE_OVERLAP, WIDTH, HEIGHT } from "../story/timeline";
import type { FrameContext } from "./frame";
import { MIN_ALPHA } from "./sprites";

const GOLD = "#c49a52";

/** First and last (exclusive) global beat the garden is on screen: the meeting start to the wedding's cross-fade end. */
export const GARDEN_START = SCENE_BEATS.meeting.start;
export const GARDEN_END = SCENE_BEATS.invitation.start + SCENE_OVERLAP.wedding;

/** Parallax factors of each plane (old Garden.tsx). */
const FACTOR = { far: 0.35, mid: 0.8, lights: 0.8, near: 1.5 } as const;

/** The plane at x = -60 + drift·factor; `alpha` is its opacity. */
const plane = (cam: Mat, drift: number, factor: number): Mat => mul(cam, translate(-60 + drift * factor, 0));

const image = (art: ArtName, m: Mat, alpha: number): DrawOp[] => (alpha > MIN_ALPHA ? [{ kind: "image", art, m, alpha }] : []);

const FRAME = { x: 0, y: 0, w: WIDTH, h: HEIGHT };

/** Radial paint of `circle at 76% 24%` on the frame: r is the distance to the farthest corner. */
const SUN_AT = { x: WIDTH * 0.76, y: HEIGHT * 0.24 };
const SUN_R = Math.hypot(Math.max(SUN_AT.x, WIDTH - SUN_AT.x), Math.max(SUN_AT.y, HEIGHT - SUN_AT.y));

/**
 * The winding path. While the garden fades in (`pathIn < 1`) the polygon, its inner fill, outline and dashes are ONE
 * group (SVG `<g opacity>`), and the alpana curve still shows through; afterwards they are drawn directly.
 */
const pathOps = (cam: Mat, grow: number, pathIn: number): DrawOp[] => {
  const ops: DrawOp[] = [];
  // the alpana curve still drawn for the first frames, then it becomes the path
  if (pathIn < 1) {
    ops.push({
      kind: "path",
      d: pathCenterline(PATH_T_LOTUS, 1),
      m: cam,
      alpha: (1 - pathIn) * 0.85,
      stroke: { paint: "#781f2b", width: 5, cap: "round" },
    });
  }
  if (pathIn <= MIN_ALPHA) return ops;
  const poly = pathPolygon(grow);
  const parts: DrawOp[] = [
    { kind: "path", d: poly, m: cam, alpha: 0.96, fill: "#e2cb98" },
    { kind: "path", d: pathPolygon(grow, -26), m: cam, alpha: 0.9, fill: "#efdcae" },
    { kind: "path", d: poly, m: cam, alpha: 0.75, stroke: { paint: GOLD, width: 3 } },
    {
      kind: "path",
      d: pathCenterline(0, 1),
      m: cam,
      alpha: 0.55,
      stroke: { paint: "#fff3cf", width: 10, cap: "round", dash: [2, 26] },
    },
  ];
  if (pathIn >= 0.999) ops.push(...parts);
  else ops.push({ kind: "group", alpha: pathIn, bounds: { x: 0, y: 880, w: WIDTH, h: HEIGHT - 880 }, ops: parts });
  return ops;
};

/**
 * The garden behind the couple, back to front. Empty outside GARDEN_START…GARDEN_END.
 * @param globalBeat beats since the story began
 * @param cam camera matrix (default identity)
 */
export const gardenBack = (globalBeat: number, ctx: FrameContext, cam: Mat = I): DrawOp[] => {
  if (globalBeat < GARDEN_START || globalBeat >= GARDEN_END) return [];
  const g = gardenState(globalBeat, ctx.reducedMotion);
  const ops: DrawOp[] = [];
  ops.push(...image("garden-far", plane(cam, g.drift, FACTOR.far), g.gardenIn));
  if (g.sun > MIN_ALPHA) {
    ops.push({
      kind: "rect",
      rect: FRAME,
      m: cam,
      alpha: g.sun,
      fill: {
        radial: [SUN_AT.x, SUN_AT.y, 0, SUN_AT.x, SUN_AT.y, SUN_R],
        stops: [
          [0, "rgba(255,236,170,.5)"],
          [0.52, "rgba(255,236,170,0)"],
        ],
      },
    });
  }
  ops.push(...pathOps(cam, g.grow, g.pathIn));
  const mid = plane(cam, g.drift, FACTOR.mid);
  ops.push(...image("garden-mid-l", mid, g.gardenIn), ...image("garden-mid-r", mid, g.gardenIn));
  // dusk wash: the garden turns into an evening wedding setting
  if (g.dusk > MIN_ALPHA) {
    ops.push({
      kind: "rect",
      rect: FRAME,
      m: cam,
      alpha: g.dusk,
      fill: {
        linear: [0, 0, 0, HEIGHT],
        stops: [
          [0, "rgba(64,24,46,.68)"],
          [0.52, "rgba(150,62,38,.36)"],
          [1, "rgba(112,40,26,.46)"],
        ],
      },
    });
  }
  ops.push(...image("garden-lights", plane(cam, g.drift, FACTOR.lights), g.lights));
  return ops;
};

/**
 * Foreground leaves and blooms over the couple; they part just before the invitation card rises.
 * @param globalBeat beats since the story began
 * @param cam camera matrix (default identity)
 */
export const gardenForeground = (globalBeat: number, ctx: FrameContext, cam: Mat = I): DrawOp[] => {
  if (globalBeat < GARDEN_START || globalBeat >= GARDEN_END) return [];
  const g = gardenState(globalBeat, ctx.reducedMotion);
  const base = plane(cam, g.drift, FACTOR.near);
  const ops: DrawOp[] = [];
  for (const [art, side] of [
    ["garden-near-l", -1],
    ["garden-near-r", 1],
  ] as const) {
    ops.push(...image(art, mul(base, translate(side * g.part * 360, g.part * 120)), g.foreground));
  }
  return ops;
};

/** Art the garden can draw (for the preloader). */
export const GARDEN_ART: readonly ArtName[] = ["garden-far", "garden-mid-l", "garden-mid-r", "garden-lights", "garden-near-l", "garden-near-r"];
