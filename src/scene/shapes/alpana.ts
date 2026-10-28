import { I, mul, rotate, scale, translate, type Mat } from "../../render/mat";
import type { DrawOp } from "../../render/ops";
import { progress } from "../../story/anim";
import { BEATS } from "../../story/timeline";
import { drawnPath, pathLength } from "./util";

const RED = "#781f2b";
const GOLD = "#c49a52";

const CX = 540;
const CY = 1060;
/** Centre of the mandala (the tiny light appears here). */
export const ALPANA_CENTER = { x: CX, y: CY } as const;

const PETAL = "M0 -238C40 -284 40 -322 0 -356C-40 -322 -40 -284 0 -238Z";
const CURL = "M0 -362c14 -14 34 -4 28 12c-5 12 -22 8 -18 -3";
const SCALLOP = "M-26 -392q26 -34 52 0";
const FLOURISH =
  "M78 330C70 210 118 130 236 112C306 102 340 150 304 186C276 214 230 198 240 162" + "M78 330C84 280 120 250 160 258M120 204C150 176 196 176 214 204";
const FLOURISH_TIP = "M236 112C250 96 272 92 290 100";
const FRAME_OUTER = "M96 60H984Q1020 60 1020 96V1824Q1020 1860 984 1860H96Q60 1860 60 1824V96Q60 60 96 60Z";
const FRAME_INNER = "M110 84H970Q996 84 996 110V1810Q996 1836 970 1836H110Q84 1836 84 1810V110Q84 84 110 84Z";
/** Circles as paths starting at (r, 0) and running clockwise, like SVG `<circle>`. */
const circle = (r: number): string => `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`;
const RING_A = circle(236);
const RING_B = circle(266);

const LEN = {
  petal: pathLength(PETAL),
  curl: pathLength(CURL),
  scallop: pathLength(SCALLOP),
  flourish: pathLength(FLOURISH),
  tip: pathLength(FLOURISH_TIP),
  outer: pathLength(FRAME_OUTER),
  inner: pathLength(FRAME_INNER),
  ringA: 2 * Math.PI * 236,
};

const PETAL_COUNT = 16;
const SCALLOP_COUNT = 32;

const MIRRORS: readonly { mx: boolean; my: boolean; a: number; b: number }[] = [
  { mx: false, my: false, a: 0.2, b: 0.8 },
  { mx: true, my: false, a: 0.25, b: 0.85 },
  { mx: false, my: true, a: 0.3, b: 0.9 },
  { mx: true, my: true, a: 0.35, b: 0.95 },
];

/**
 * The self-drawing alpana (border, concentric rings, petal ring, scallops, corner vines) at the awakening's local
 * beat `frame`, as path ops with the old stroke "draw themselves" dashes. `m` is the parent matrix (frame coordinates).
 */
export const alpanaOps = (frame: number, m: Mat = I): DrawOp[] => {
  const [d0, d1] = BEATS.awakening.alpanaDraw;
  const span = d1 - d0;
  const seg = (a: number, b: number): number => progress(frame, [d0 + span * a, d0 + span * b]);
  const ops: DrawOp[] = [];
  const add = (op: DrawOp | null): void => {
    if (op) ops.push(op);
  };

  const border = seg(0, 0.7);
  add(drawnPath(FRAME_OUTER, LEN.outer, border, m, GOLD, 3));
  add(drawnPath(FRAME_INNER, LEN.inner, border, m, RED, 2, 0.55));

  const c = mul(m, translate(CX, CY));
  const ringA = seg(0.05, 0.4);
  const ringB = seg(0.35, 0.7);
  add(drawnPath(RING_A, LEN.ringA, ringA, mul(c, rotate(-90)), RED, 4, 0.75));
  if (ringB * 0.9 > 0.002) {
    ops.push({ kind: "path", d: RING_B, m: c, alpha: ringB * 0.9, stroke: { paint: GOLD, width: 4, cap: "round", dash: [1, 15] } });
  }
  for (let i = 0; i < PETAL_COUNT; i++) {
    const p = seg(0.15 + (i / PETAL_COUNT) * 0.45, 0.35 + (i / PETAL_COUNT) * 0.5);
    const pm = mul(c, rotate((i * 360) / PETAL_COUNT));
    add(drawnPath(PETAL, LEN.petal, p, pm, RED, 4, 0.8));
    add(drawnPath(CURL, LEN.curl, p, pm, GOLD, 3));
  }
  for (let i = 0; i < SCALLOP_COUNT; i++) {
    const p = seg(0.5 + (i / SCALLOP_COUNT) * 0.35, 0.65 + (i / SCALLOP_COUNT) * 0.35);
    add(drawnPath(SCALLOP, LEN.scallop, p, mul(c, rotate((i * 360) / SCALLOP_COUNT + 360 / SCALLOP_COUNT / 2)), RED, 3, 0.6));
  }
  for (const f of MIRRORS) {
    const p = seg(f.a, f.b);
    const fm = mul(m, mul(translate(f.mx ? 1080 : 0, f.my ? 1920 : 0), scale(f.mx ? -1 : 1, f.my ? -1 : 1)));
    add(drawnPath(FLOURISH, LEN.flourish, p, fm, RED, 4, 0.7));
    add(drawnPath(FLOURISH_TIP, LEN.tip, p, fm, GOLD, 3));
  }
  return ops;
};
