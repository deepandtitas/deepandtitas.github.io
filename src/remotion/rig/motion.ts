/**
 * Pure motion maths for the cut-out rig: skeleton, two-bone IK for the arms, walk cycle, breathing, blinks,
 * cloth lag and a damped pendulum. Everything is a pure function of its inputs (no timers, no randomness),
 * so the same frame always produces the same pose.
 *
 * Coordinates are FIGURE coordinates: origin between the feet, y grows downward (the head is near y ≈ -600).
 * The rest-pose geometry mirrors scripts/art/characters.mjs, where the parts are painted.
 */
import { seeded } from "../lib/anim";

export type Who = "groom" | "bride";

export interface Pt {
  x: number;
  y: number;
}

interface Skeleton {
  shoulder: Pt;
  elbow: Pt;
  wrist: Pt;
  /** Torso and lower body pivot (waist/hips). */
  hip: Pt;
  /** Head pivot. */
  neck: Pt;
  /** Where the headgear sits. */
  crown: Pt;
  /** Pivot of the cloth that hangs from the neck/head (stole, veil). */
  drape: Pt;
  foot: Pt;
}

export const SKELETON: Record<Who, Skeleton> = {
  groom: {
    shoulder: { x: 62, y: -496 },
    elbow: { x: 72, y: -384 },
    wrist: { x: 78, y: -282 },
    hip: { x: 0, y: -370 },
    neck: { x: 0, y: -546 },
    crown: { x: 0, y: -648 },
    drape: { x: 0, y: -524 },
    foot: { x: 30, y: -2 },
  },
  bride: {
    shoulder: { x: 54, y: -490 },
    elbow: { x: 62, y: -382 },
    wrist: { x: 68, y: -286 },
    hip: { x: 0, y: -420 },
    neck: { x: 0, y: -538 },
    crown: { x: 0, y: -650 },
    drape: { x: 0, y: -660 },
    foot: { x: 28, y: -4 },
  },
};

/** How far past the wrist the centre of the palm is. */
const HAND = 24;

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k });
const len = (a: Pt): number => Math.hypot(a.x, a.y);
const angle = (a: Pt): number => (Math.atan2(a.y, a.x) * 180) / Math.PI;
const DEG = Math.PI / 180;
export const rotate = (p: Pt, deg: number): Pt => {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
};
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Rest positions of one arm (side +1 = screen right, -1 = screen left). */
export const restArm = (who: Who, side: 1 | -1) => {
  const k = SKELETON[who];
  const m = (p: Pt): Pt => ({ x: p.x * side, y: p.y });
  const S = m(k.shoulder);
  const E = m(k.elbow);
  const W = m(k.wrist);
  const fore = sub(W, E);
  const H = add(W, scale(fore, HAND / len(fore)));
  return { S, E, H, upper: len(sub(E, S)), lower: len(sub(H, E)) };
};

/**
 * Named arm poses for the screen-right arm (the left arm mirrors x), torso-local: where the palm goes AND where the
 * elbow sits. A flat, front-facing figure cannot fold its arms in depth, so each pose says where the elbow appears and
 * the arm is foreshortened (scaled along its length) to reach — the elbows stay at the sides and the arms never cross.
 */
export const ARM_POSES = {
  groom: {
    namaskar: { hand: { x: 7, y: -452 }, elbow: { x: 88, y: -404 } },
    hold: { hand: { x: 44, y: -432 }, elbow: { x: 94, y: -390 } },
    chest: { hand: { x: 10, y: -462 }, elbow: { x: 90, y: -404 } },
    face: { hand: { x: 12, y: -548 }, elbow: { x: 46, y: -428 } },
    aside: { hand: { x: 78, y: -330 }, elbow: { x: 76, y: -392 } },
    low: { hand: { x: 26, y: -350 }, elbow: { x: 80, y: -392 } },
  },
  bride: {
    namaskar: { hand: { x: 7, y: -448 }, elbow: { x: 78, y: -400 } },
    hold: { hand: { x: 40, y: -430 }, elbow: { x: 88, y: -388 } },
    chest: { hand: { x: 9, y: -462 }, elbow: { x: 80, y: -404 } },
    face: { hand: { x: 11, y: -546 }, elbow: { x: 40, y: -430 } },
    aside: { hand: { x: 74, y: -330 }, elbow: { x: 70, y: -390 } },
    low: { hand: { x: 24, y: -356 }, elbow: { x: 74, y: -388 } },
  },
} as const satisfies Record<Who, Record<string, { hand: Pt; elbow: Pt }>>;

export type PoseName = keyof (typeof ARM_POSES)["groom"];
export type PoseWeights = Partial<Record<PoseName, number>>;

/** Blends named poses on top of the rest pose, in order (each weight 0..1): palm and elbow, torso-local. */
export const poseArm = (who: Who, side: 1 | -1, w: PoseWeights): { hand: Pt; elbow: Pt } => {
  const rest = restArm(who, side);
  let hand = rest.H;
  let elbow = rest.E;
  for (const name of Object.keys(ARM_POSES[who]) as PoseName[]) {
    const t = clamp(w[name] ?? 0, 0, 1);
    if (t <= 0) continue;
    const q = ARM_POSES[who][name];
    hand = lerpPt(hand, { x: q.hand.x * side, y: q.hand.y }, t);
    elbow = lerpPt(elbow, { x: q.elbow.x * side, y: q.elbow.y }, t);
  }
  return { hand, elbow };
};

/** Where the palm goes for a blend of named poses (torso-local). */
export const poseTarget = (who: Who, side: 1 | -1, w: PoseWeights): Pt => poseArm(who, side, w).hand;

/** Foreshortening limit: a segment can come toward the viewer down to this fraction of its length. */
const MIN_FORESHORTEN = 0.5;

/**
 * Two-bone IK for explicit hand targets (the garland exchange): the solution whose elbow is nearest the arm's natural
 * hanging elbow (moved with the body), so the elbow never flips to the other side of the body.
 */
export const solveArm = (S: Pt, T: Pt, upper: number, lower: number, prefElbow: Pt) => {
  const d0 = sub(T, S);
  const d = clamp(len(d0), Math.abs(upper - lower) + 1, (upper + lower) * 0.99999);
  const base = Math.atan2(d0.y, d0.x);
  const a = Math.acos(clamp((upper * upper + d * d - lower * lower) / (2 * upper * d), -1, 1));
  const c1 = { x: S.x + Math.cos(base + a) * upper, y: S.y + Math.sin(base + a) * upper };
  const c2 = { x: S.x + Math.cos(base - a) * upper, y: S.y + Math.sin(base - a) * upper };
  const E = len(sub(c1, prefElbow)) <= len(sub(c2, prefElbow)) ? c1 : c2;
  const dir = Math.atan2(T.y - E.y, T.x - E.x);
  return { E, H: { x: E.x + Math.cos(dir) * lower, y: E.y + Math.sin(dir) * lower } };
};

/**
 * Places an arm from a shoulder, a chosen elbow and a palm target: each segment points where it must and is
 * foreshortened (never stretched beyond a hair) to reach. Returns the elbow and palm actually reached and both scales.
 */
export const placeArm = (S: Pt, E: Pt, T: Pt, upper: number, lower: number) => {
  const ku = clamp(len(sub(E, S)) / upper, MIN_FORESHORTEN, 1.03);
  const dirU = Math.atan2(E.y - S.y, E.x - S.x);
  const elbow = { x: S.x + Math.cos(dirU) * upper * ku, y: S.y + Math.sin(dirU) * upper * ku };
  const kf = clamp(len(sub(T, elbow)) / lower, MIN_FORESHORTEN, 1.03);
  const dirF = Math.atan2(T.y - elbow.y, T.x - elbow.x);
  return { E: elbow, H: { x: elbow.x + Math.cos(dirF) * lower * kf, y: elbow.y + Math.sin(dirF) * lower * kf }, ku, kf };
};

/** A placed part: rotate by `rot` (deg) and scale about its rest pivot, then move the pivot to `at`. */
export interface PartXf {
  pivot: Pt;
  at: Pt;
  rot: number;
  sx?: number;
  sy?: number;
}

export interface FigurePose {
  /** Walk phase (radians) and how much of the walk is applied (0..1). */
  walk?: number;
  moving?: number;
  /** Horizontal speed in figure units per beat; drives cloth lag and lean. */
  vel?: number;
  /** Time in beats (breathing, wind, blinks). */
  t?: number;
  /** Extra forward lean of the upper body, degrees (+ = toward screen right). */
  lean?: number;
  /** Head tilt in degrees. */
  headTilt?: number;
  /** Arm targets: named-pose weights (torso-local) or an explicit palm position in figure coordinates. */
  arms?: { l?: PoseWeights | Pt; r?: PoseWeights | Pt };
  /** Bow of the upper body (0..1), used for greetings and the garland exchange. */
  bow?: number;
  reduced?: boolean;
}

const isPt = (v: unknown): v is Pt => typeof v === "object" && v !== null && "x" in v && "y" in v;

/** Breathing: a slow, tiny rise of the chest (period ~3 s). */
export const breathe = (t: number): number => 1 + 0.006 * Math.sin((t / 90) * Math.PI * 2);

/** Gentle idle wind on hanging cloth (degrees). */
export const wind = (t: number, seed: number): number =>
  Math.sin(t * 0.045 + seed) * 1.1 + Math.sin(t * 0.11 + seed * 2.3) * 0.5;

/**
 * Blink amount (0 open … 1 closed) at time t (beats). Blinks are spaced 3–6 s apart with a seeded jitter,
 * each lasting ~0.25 s. Deterministic for a given seed.
 */
export const blinkAt = (t: number, seed: number): number => {
  const period = 135;
  const k = Math.floor(t / period);
  let b = 0;
  for (const i of [k - 1, k, k + 1]) {
    const at = i * period + 20 + seeded(i * 7 + seed) * 70;
    const u = Math.abs(t - at) / 4;
    if (u < 1) b = Math.max(b, 1 - u * u);
  }
  return b;
};

/** Damped pendulum angle (deg) `dt` beats after a push of `amp` degrees. 0 before the push. */
export const pendulum = (dt: number, amp: number, periodBeats = 38, damping = 0.045): number =>
  dt <= 0 ? 0 : amp * Math.exp(-damping * dt) * Math.sin((dt / periodBeats) * Math.PI * 2);

export interface SolvedFigure {
  hip: PartXf;
  lower: PartXf;
  torso: PartXf;
  drape: PartXf;
  head: PartXf;
  crown: PartXf;
  footL: PartXf;
  footR: PartXf;
  upperL: PartXf;
  upperR: PartXf;
  foreL: PartXf;
  foreR: PartXf;
  /** Palm centres and forearm directions (deg) in figure coordinates, for things held in the hands. */
  handL: Pt;
  handR: Pt;
  handAngL: number;
  handAngR: number;
  /** Where a worn garland sits (both sides of the neck) and the head top, in figure coordinates. */
  neckL: Pt;
  neckR: Pt;
  headTop: Pt;
}

/** Solves every part's transform for a pose. Shared by the renderer and by scenes that need hand positions. */
export const solveFigure = (who: Who, p: FigurePose): SolvedFigure => {
  const k = SKELETON[who];
  const t = p.t ?? 0;
  const moving = p.reduced ? 0 : (p.moving ?? 0);
  const ph = p.walk ?? 0;
  const vel = p.vel ?? 0;
  const sn = Math.sin(ph);

  const bob = -Math.abs(Math.sin(ph)) * 6 * moving;
  const sway = sn * 1.4 * moving;
  const lean = (p.lean ?? 0) + clamp(vel * 0.9, -4, 4) + (p.bow ?? 0) * (who === "groom" ? 7 : -7);
  const torsoRot = lean - sway * 0.6;
  const breath = p.reduced ? 1 : breathe(t + (who === "bride" ? 40 : 0));

  const hip: PartXf = { pivot: k.hip, at: { x: k.hip.x, y: k.hip.y + bob }, rot: 0 };
  const lower: PartXf = { pivot: k.hip, at: hip.at, rot: -sn * 2.2 * moving + lean * 0.15 };
  const torso: PartXf = { pivot: k.hip, at: hip.at, rot: torsoRot, sy: breath };

  // a point that rides on the torso
  const onTorso = (q: Pt): Pt => {
    const local = sub(q, k.hip);
    return add(hip.at, rotate({ x: local.x, y: local.y * breath }, torsoRot));
  };

  const neck = onTorso(k.neck);
  const idleHead = p.reduced ? 0 : Math.sin(t * 0.031 + (who === "bride" ? 1.7 : 0)) * 0.8;
  const headRot = torsoRot + (p.headTilt ?? 0) + idleHead - sway * 0.4;
  const head: PartXf = { pivot: k.neck, at: neck, rot: headRot };
  const onHead = (q: Pt): Pt => add(neck, rotate(sub(q, k.neck), headRot));

  const lag = p.reduced ? 0 : clamp(-vel * 1.4, -7, 7) + wind(t, who === "bride" ? 2 : 5) - sn * 1.2 * moving;
  const crown: PartXf = { pivot: k.crown, at: onHead(k.crown), rot: headRot + lag * 0.15 };
  const drape: PartXf =
    who === "bride"
      ? { pivot: k.drape, at: onHead(k.drape), rot: torsoRot + (headRot - torsoRot) * 0.35 + lag * 0.6 }
      : { pivot: k.drape, at: onTorso(k.drape), rot: torsoRot + lag * 0.5 };

  const stepL = Math.max(0, sn) * 9 * moving;
  const stepR = Math.max(0, -sn) * 9 * moving;
  const footL: PartXf = { pivot: { x: -k.foot.x, y: k.foot.y }, at: { x: -k.foot.x - stepL * 0.3, y: k.foot.y - stepL }, rot: -stepL * 0.4 };
  const footR: PartXf = { pivot: k.foot, at: { x: k.foot.x + stepR * 0.3, y: k.foot.y - stepR }, rot: stepR * 0.4 };

  const arm = (side: 1 | -1) => {
    const rest = restArm(who, side);
    const spec = side === 1 ? p.arms?.r : p.arms?.l;
    const S = onTorso(rest.S);
    let E: Pt;
    let H: Pt;
    let ku = 1;
    let kf = 1;
    if (isPt(spec)) {
      ({ E, H } = solveArm(S, spec, rest.upper, rest.lower, onTorso(rest.E)));
    } else {
      const pose = poseArm(who, side, spec ?? {});
      // arms swing a little while walking (only when hanging at rest)
      const restness = spec ? 1 - Math.min(1, Object.values(spec).reduce((a, b) => a + (b ?? 0), 0)) : 1;
      const swing = Math.sin(ph + (side === 1 ? 0 : Math.PI)) * moving * restness;
      const off = { x: swing * 6 * side, y: -Math.max(0, swing) * 10 };
      ({ E, H, ku, kf } = placeArm(S, onTorso(pose.elbow), onTorso(add(pose.hand, off)), rest.upper, rest.lower));
    }
    // foreshortened segments are scaled along their own length (each part is drawn along its local y axis)
    const upper: PartXf = { pivot: rest.S, at: S, rot: angle(sub(E, S)) - angle(sub(rest.E, rest.S)), ...(ku !== 1 ? { sy: ku } : {}) };
    const fore: PartXf = { pivot: rest.E, at: E, rot: angle(sub(H, E)) - angle(sub(rest.H, rest.E)), ...(kf !== 1 ? { sy: kf } : {}) };
    return { upper, fore, H, ang: angle(sub(H, E)) };
  };
  const L = arm(-1);
  const R = arm(1);

  const neckSide = who === "groom" ? 30 : 26;
  return {
    hip,
    lower,
    torso,
    drape,
    head,
    crown,
    footL,
    footR,
    upperL: L.upper,
    upperR: R.upper,
    foreL: L.fore,
    foreR: R.fore,
    handL: L.H,
    handR: R.H,
    handAngL: L.ang,
    handAngR: R.ang,
    neckL: onTorso({ x: -neckSide, y: k.neck.y + 22 }),
    neckR: onTorso({ x: neckSide, y: k.neck.y + 22 }),
    headTop: onHead({ x: 0, y: k.crown.y - 10 }),
  };
};
