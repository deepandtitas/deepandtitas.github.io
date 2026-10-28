import { lerp } from "./anim";

/**
 * The shared "alpana curve → garden pathway" centreline, used by the awakening scene's
 * closing stroke AND the meeting scene's garden path so the two match frame-for-frame.
 * t = 0 is the lotus base, t = 1 runs off the bottom of the frame.
 */
export const PATH_TOP_Y = 900; // vanishing point at the garden horizon
export const PATH_BOTTOM_Y = 1990;
/** Where the couple meets (feet line) — also the centre of the wedding mandap. */
export const MEET_Y = 1500;
/** Lotus base in the awakening scene; the alpana curve starts here. */
export const LOTUS_BASE_Y = 1145;

export const PATH_T_LOTUS = (LOTUS_BASE_Y - PATH_TOP_Y) / (PATH_BOTTOM_Y - PATH_TOP_Y);
export const PATH_T_MEET = (MEET_Y - PATH_TOP_Y) / (PATH_BOTTOM_Y - PATH_TOP_Y);

// A winding S: x = 540 at the lotus base and again at the meeting point.
const K = Math.PI / (PATH_T_MEET - PATH_T_LOTUS);

export const pathPoint = (t: number): { x: number; y: number } => ({
  x: 540 + (30 + 170 * t) * Math.sin(K * (t - PATH_T_LOTUS)),
  y: lerp(PATH_TOP_Y, PATH_BOTTOM_Y, t),
});

const STEPS = 48;

/** Centreline as an SVG path between t0 and t1. */
export const pathCenterline = (t0 = 0, t1 = 1): string => {
  let d = "";
  const n = Math.max(2, Math.round(STEPS * (t1 - t0)));
  for (let i = 0; i <= n; i++) {
    const p = pathPoint(lerp(t0, t1, i / n));
    d += `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }
  return d;
};

/** Perspective half-width of the pathway at t, scaled by `grow` (0 = thin alpana line, 1 = full path). */
export const pathHalfWidth = (t: number, grow: number): number =>
  lerp(2.5, 14 + 400 * Math.pow(t, 1.25), grow);

/** Filled pathway polygon with perspective taper. */
export const pathPolygon = (grow: number, edgeOffset = 0): string => {
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const p = pathPoint(t);
    const w = pathHalfWidth(t, grow) + edgeOffset;
    left.push(`${(p.x - w).toFixed(1)} ${p.y.toFixed(1)}`);
    right.push(`${(p.x + w).toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
};
