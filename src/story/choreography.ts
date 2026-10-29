/**
 * Choreography: every pose and position the scenes need, as PURE functions of the beat.
 *
 * Units: `f` is a scene-local beat (1 beat = 1/30 s; 2 frames at 60 FPS); `g` / `globalBeat` is a beat counted from the
 * start of the story (`g = f + SCENE_BEATS.<scene>.start`). Positions are composition px (1080 x 1920, y down).
 * Nothing here reads a clock or random numbers: the same beat always gives the same result.
 */
import { bump, easeInOut, easeOut, keyframes, lerp, progress, ramp, seeded } from "./anim";
import { BEATS, SCENE_BEATS, sceneDuration } from "./timeline";
import { BUSHES, CARD_EDGE_Y, COUPLE, DIYA_SPOTS, MANDAP, ORNAMENT_POS } from "./layout";
import type { ArtName } from "../art/manifest";
import { figurePoints, lerpPt, pendulum, type FigureProps, type PoseWeights, type Pt } from "./rig";

// ===================================================================================================================
// Sprites
// ===================================================================================================================

/** Names of the sprite art the sprite lists use: keys of the art manifest. */
export type SpriteName = ArtName;

/**
 * One sprite: art `name` placed at (x, y) px, rotated `rot` degrees, uniformly scaled by `scale` and horizontally by a
 * further `sx` (flip effect), drawn at `opacity` (0 hides it; lists never change length).
 */
export interface SpriteState {
  name: SpriteName;
  x: number;
  y: number;
  rot?: number;
  scale?: number;
  sx?: number;
  opacity?: number;
}

// ===================================================================================================================
// Meeting (scene 2)
// ===================================================================================================================

const MB = BEATS.meeting;
/** Length of the meeting scene in beats (330): the beat of its final tableau. */
const MEETING_END = sceneDuration("meeting");
/** Screen distance (px) of half a walk cycle (one step). */
const STEP = 58;
const START = { groom: -230, bride: 1310 } as const;

/** Where each of them stands (px) at a meeting-local beat: walking in along the path, easing to a stop. */
const posAt = (who: "groom" | "bride", f: number, reduced: boolean): number => {
  const p = reduced ? 1 : progress(f, who === "groom" ? MB.groomWalk : MB.brideWalk, easeInOut);
  return lerp(START[who], who === "groom" ? COUPLE.groomX : COUPLE.brideX, p);
};

/** Both figures. The bride's `paan` is the size of the betel leaves in her hands. */
export interface CouplePose {
  groom: FigureProps;
  bride: FigureProps & { paan: number };
}

/**
 * Pose of both figures at a MEETING-local beat. Pure, so its end is the wedding scene's first pose.
 * @param f beats since the meeting scene started (0..330)
 */
export const meetingPose = (f: number, reduced: boolean): CouplePose => {
  const walkP = reduced ? 1 : progress(f, MB.groomWalk, easeInOut);
  const depth = lerp(0.93, 1, walkP) * COUPLE.scale;
  const y = lerp(COUPLE.y - 26, COUPLE.y, walkP);
  const moving = reduced ? 0 : progress(f, [MB.groomWalk[0], MB.groomWalk[0] + 12]) * (1 - progress(walkP, [0.9, 1]));
  const vel = (who: "groom" | "bride") => (posAt(who, f, reduced) - posAt(who, f - 1, reduced)) / depth;
  const gx = posAt("groom", f, reduced);
  const bx = posAt("bride", f, reduced);

  // they slow, turn to each other, and greet with folded hands and a small bow
  const greet = progress(f, MB.meetPause, easeInOut);
  const bow = Math.sin(Math.PI * progress(f, [MB.meetPause[0] + 6, MB.meetPause[1] + 18]));
  const smile = progress(f, [MB.meetPause[0] - 10, MB.meetPause[1]]);

  return {
    groom: {
      x: gx,
      y,
      scale: depth,
      t: f,
      walk: ((gx - START.groom) / STEP) * Math.PI,
      moving,
      vel: vel("groom"),
      turn: 0.7,
      arms: { l: { namaskar: greet }, r: { namaskar: greet } },
      bow: bow * 0.6,
      headTilt: bow * 4,
      face: { gaze: 0.8, look: 0.1 + greet * 0.3, smile: 0.25 + smile * 0.45 },
      reduced,
    },
    bride: {
      x: bx,
      y,
      scale: depth,
      t: f,
      walk: ((START.bride - bx) / STEP) * Math.PI + 1.4,
      moving,
      vel: vel("bride"),
      turn: -0.7,
      // she carries the two betel leaves of the শুভদৃষ্টি before her, between her palms
      arms: { l: { chest: 1 }, r: { chest: 1 } },
      paan: 0.72,
      bow: bow * 0.6,
      headTilt: -bow * 4,
      face: { gaze: -0.8, look: 0.35 + greet * 0.25, smile: 0.2 + smile * 0.35, blush: smile * 0.6 },
      reduced,
    },
  };
};

/** Opacity of both figures in the meeting scene (reduced motion fades them in instead of walking). Meeting-local beat. */
export const meetingFade = (f: number, reduced: boolean): number =>
  reduced ? progress(f, [MB.groomWalk[0], MB.groomWalk[0] + 40]) : 1;

/** 0..1 how far the arch flowers have flown into place. Meeting-local beat. */
export const flowerGather = (f: number, reduced: boolean): number =>
  reduced ? progress(f, [MB.flowersGather[0], MB.flowersGather[0] + 20]) : progress(f, MB.flowersGather, (t) => t);

// ===================================================================================================================
// Wedding (scene 3)
// ===================================================================================================================

const WB = BEATS.wedding;
const W_LAST = sceneDuration("wedding") - 1;

/** Scene-local beats of the শুভদৃষ্টি: leaves raised to veil her face, opened aside as their eyes meet, set down. */
export const LEAVES = { raise: [56, 106], open: [164, 214], release: [222, 250] } as const;

/**
 * মালাবদল, one after the other: she garlands him, then he garlands her. Each giver steps in, raises the garland to
 * the other's face, settles it around the neck, lets go, and steps back. Wedding-local beats.
 */
export const EXCHANGE = {
  appear: [250, 272],
  bride: { stepIn: [266, 288], lift: [278, 300], settle: [300, 312], release: [312, 332], stepBack: [318, 336] },
  groom: { stepIn: [334, 352], lift: [342, 364], settle: [364, 376], release: [376, 396], stepBack: [382, 400] },
} as const;

/** From this wedding-local beat the groom is drawn in front (he garlands her); before it, she is in front. */
export const SWAP = 336;

/** Size of one garland flower (px). */
export const GARLAND_FLOWER = 22 * COUPLE.scale;

type Side = { l: PoseWeights | Pt; r: PoseWeights | Pt };
const named = (w: PoseWeights): Side => ({ l: w, r: w });
const toFigure = (p: Pt, fig: { x: number; y: number; scale?: number }): Pt => ({
  x: (p.x - fig.x) / (fig.scale ?? 1),
  y: (p.y - fig.y) / (fig.scale ?? 1),
});

/**
 * Both figures at a WEDDING-local beat, before the garland exchange moves the givers' hands.
 * @param f beats since the wedding scene started (0..480)
 */
export const basePose = (f: number, reduced: boolean): CouplePose => {
  const start = meetingPose(MEETING_END, reduced); // the meeting scene's final tableau
  const X = EXCHANGE;
  // stepping in and back for each half of the exchange
  const xAt = (g: number) => {
    const bi = progress(g, X.bride.stepIn) * (1 - progress(g, X.bride.stepBack));
    const gi = progress(g, X.groom.stepIn) * (1 - progress(g, X.groom.stepBack));
    return { groom: COUPLE.groomX + bi * 30 + gi * 70, bride: COUPLE.brideX - bi * 70 - gi * 30 };
  };
  const xs = xAt(f);
  const prev = xAt(f - 1);
  const stepping = reduced ? 0 : Math.min(1, Math.abs(xs.groom - prev.groom) * 0.6 + Math.abs(xs.bride - prev.bride) * 0.6);

  // — groom: relaxes from his greeting, turns to her —
  const relax = 1 - progress(f, [8, 40]);
  // — bride: the betel leaves —
  const raise = progress(f, LEAVES.raise);
  const open = progress(f, LEAVES.open);
  const holding = f < LEAVES.release[0];
  // the leaves come down from her face to her chest, then out to her sides
  const lowerA = progress(f, [LEAVES.open[0], (LEAVES.open[0] + LEAVES.open[1]) / 2]);
  const lowerB = progress(f, [(LEAVES.open[0] + LEAVES.open[1]) / 2, LEAVES.open[1]]);
  // after letting the leaves fall, her arms relax to her sides before she takes up the garland
  const relaxArms = progress(f, [LEAVES.release[0] + 2, X.appear[0]]);
  // — garlands in hand: each holds one until it has been given —
  const appear = progress(f, [X.appear[0] - 6, X.appear[1] + 4]);
  const brideHas = appear * (1 - progress(f, [X.bride.release[1], X.bride.release[1] + 24]));
  const groomHas = appear * (1 - progress(f, [X.groom.release[1], X.groom.release[1] + 24]));
  const groomReady = progress(f, X.groom.stepIn);

  // — faces —
  const veiled = raise * (1 - open);
  const eyesMeet = progress(f, [LEAVES.open[0] + 16, LEAVES.open[1] + 6]);
  const joy = progress(f, [LEAVES.open[0] + 26, LEAVES.open[1] + 40]);
  const tableau = progress(f, WB.tableau);
  const receiveG = bump(f, X.bride.lift[0], X.bride.release[1]);
  const receiveB = bump(f, X.groom.lift[0], X.groom.release[1]);

  const groom: FigureProps = {
    ...start.groom,
    x: xs.groom,
    t: f + MEETING_END,
    vel: (xs.groom - prev.groom) / COUPLE.scale,
    walk: ((xs.groom - COUPLE.groomX) / STEP) * Math.PI,
    moving: stepping,
    turn: 0.85,
    arms: named({ namaskar: relax * (1 - appear) + tableau, low: groomHas * (1 - groomReady), hold: groomHas * groomReady }),
    bow: receiveG * 0.7,
    headTilt: receiveG * 5,
    face: { gaze: 0.9, look: 0.12 + receiveG * 0.3 + bump(f, 280, 330) * 0.1, smile: 0.35 + joy * 0.45, blush: joy * 0.25 },
  };
  const bride: CouplePose["bride"] = {
    ...start.bride,
    x: xs.bride,
    t: f + MEETING_END,
    vel: (xs.bride - prev.bride) / COUPLE.scale,
    walk: ((COUPLE.brideX - xs.bride) / STEP) * Math.PI + 1.4,
    moving: stepping,
    turn: -0.6 - 0.3 * eyesMeet,
    // one continuous blend for the whole scene: chest → veiling her face → leaves lowered aside → (the leaves are
    // let go) arms relax → the garland in her hands → folded hands. Weight passes from one pose to the next.
    arms: named({
      chest: 1 - raise,
      face: raise * (1 - lowerA),
      hold: lowerA * (1 - lowerB) + brideHas,
      aside: lowerB * (1 - relaxArms),
      namaskar: tableau,
    }),
    paan: holding ? lerp(0.72, 0.98, raise) - 0.2 * open : 0,
    bow: receiveB * 0.7,
    headTilt: -receiveB * 5,
    face: {
      gaze: -0.9 * eyesMeet - 0.3,
      look: lerp(0.55, 0, eyesMeet) + receiveB * 0.3,
      smile: 0.15 + joy * 0.55,
      blush: 0.3 + joy * 0.5,
      close: veiled * 0.35,
    },
  };
  return { groom, bride };
};

/** A garland strand: anchors (composition px), sag (px), swing (deg), opacity, seed. */
export interface GarlandState {
  a: Pt;
  b: Pt;
  sag: number;
  swing: number;
  opacity: number;
  seed: number;
}

/** The two figures plus the two garlands at one beat. */
export interface Exchange {
  pose: CouplePose;
  /** Index 0 is the bride's gift to the groom, index 1 the groom's. */
  garlands: GarlandState[];
}

/**
 * The garland exchange: givers' hands follow the garland's path; afterwards it hangs at the receiver's neck.
 * The bride gives first (she garlands him), then the groom.
 * @param f beats since the wedding scene started
 */
export const exchangeAt = (f: number, reduced: boolean): Exchange => {
  const pose = basePose(f, reduced);
  const X = EXCHANGE;
  const appear = progress(f, X.appear);
  const garlands: GarlandState[] = [];

  const give = (giver: "bride" | "groom") => {
    const receiver = giver === "bride" ? "groom" : "bride";
    const w = X[giver];
    const R = figurePoints(receiver, pose[receiver]);
    // linear here: each is eased once where it is used
    const lift = progress(f, w.lift, (t) => t);
    const settle = progress(f, w.settle, (t) => t);
    const release = progress(f, w.release, (t) => t);
    const chin = { l: { x: R.neckL.x - 6, y: R.neckL.y - 62 * COUPLE.scale }, r: { x: R.neckR.x + 6, y: R.neckR.y - 62 * COUPLE.scale } };
    const neck = { l: R.neckL, r: R.neckR };
    // the giver's hands reach out of their pose to the other's chin, settle the garland at the neck, and return to
    // the pose as they let go — one blend, so the hands never jump when the reach starts or ends
    if (lift > 0 && release < 1) {
      const giverPose = pose[giver];
      const out = (p: Pt) => toFigure(p, giverPose);
      const base = giverPose.arms as { l: PoseWeights; r: PoseWeights };
      const mix = easeInOut(lift) * (1 - easeInOut(release));
      const at = (side: "l" | "r") => out(lerpPt(chin[side], neck[side], easeInOut(settle)));
      giverPose.arms = { l: { reach: at("l"), mix, base: base.l }, r: { reach: at("r"), mix, base: base.r } };
      giverPose.lean = (giver === "bride" ? -1 : 1) * 5 * bump(f, w.lift[0], w.release[1]);
    }
    // where the garland hangs
    const H = figurePoints(giver, pose[giver]);
    const placed = settle >= 1;
    const a = placed ? R.neckL : H.handL;
    const b = placed ? R.neckR : H.handR;
    const sag = placed ? lerp(60, 118, easeOut(release)) * COUPLE.scale : lerp(64, 46, lift) * COUPLE.scale;
    const swing = reduced ? 0 : pendulum(f - w.release[0], 9) + (placed ? 0 : Math.sin((f + (giver === "bride" ? 0 : 9)) * 0.21) * 3 * (1 - lift));
    garlands.push({ a, b, sag, swing, opacity: appear, seed: giver === "bride" ? 0 : 3 });
  };
  give("bride");
  give("groom");
  return { pose, garlands };
};

/** Which figure is drawn in front at a wedding-local beat: the bride until the swap (she garlands him), then the groom. */
export const frontFigure = (f: number): "groom" | "bride" => (f < SWAP ? "bride" : "groom");

/** Light and build numbers of the wedding scene. */
export interface WeddingLight {
  /** 0..1 mandap build progress (feed `mandapParts(Math.round(build * 400) / 400)`). */
  build: number;
  /** 0..1 diyas lit progress. */
  lights: number;
  /** Eye-contact glow strength (0..0.6). */
  meet: number;
  /** Warm lamplight disc opacity (0..0.9). */
  glow: number;
}

/** Light and build numbers for the wedding scene at a wedding-local beat. */
export const weddingLight = (f: number): WeddingLight => {
  const build = progress(f, WB.mandapBuild);
  const lights = progress(f, WB.diyasLight);
  const meet = bump(f, LEAVES.open[0] + 22, LEAVES.open[1] + 52) * 0.6;
  const peak = Math.pow(bump(f, WB.peak[0], WB.peak[1] + 30), 1.4) * 0.9;
  const settle = progress(f, [WB.tableau[0], WB.tableau[1] + 20]) * 0.22;
  const glow = Math.max(meet * 0.5, peak, settle, lights * 0.32);
  return { build, lights, meet, glow };
};

/** How far each mandap part has built (0..1 each; posts eased). `build` is the (quantised) 0..1 build progress. */
export const mandapParts = (build: number) => ({
  posts: easeOut(progress(build, [0, 0.55], (t) => t)),
  dome: progress(build, [0.12, 0.62]),
  valance: progress(build, [0.3, 0.72]),
  strings: progress(build, [0.5, 1]),
  floor: progress(build, [0, 0.6]),
});

/** Position (px) of the drifting petal at linear progress t: crosses from the left, then settles down the centre. */
export const petalAt = (t: number): { x: number; y: number; rot: number } => {
  const e = easeInOut(t);
  return {
    x: lerp(-90, 540, e) + Math.sin(t * Math.PI * 2.4) * 130 * (1 - t),
    y: lerp(560, ORNAMENT_POS.y, easeOut(t) * 0.55 + t * 0.45),
    rot: t * 540 - 40,
  };
};

/** The closing transition of the wedding: a petal turns into the gold ornament and the card's edge rises. */
export interface Closing {
  /** Linear 0..1 progress of the petal's crossing. */
  hp: number;
  petal: { x: number; y: number; rot: number };
  petalScale: number;
  /** Petal opacity (0 when not crossing). */
  petalOpacity: number;
  /** 0..1 petal to ornament morph. */
  morph: number;
  ornamentOpacity: number;
  /** Multiplier on ORNAMENT_SCALE (1 in reduced motion). */
  ornamentGrow: number;
  /** True while the card edge is on screen. */
  cardVisible: boolean;
  /** 0..1 card-edge progress. */
  edge: number;
  /** Top of the card (px). */
  cardTop: number;
}

/** Closing transition numbers at a wedding-local beat. */
export const closingAt = (f: number, reduced: boolean): Closing => {
  const hp = progress(f, WB.petalCross, (t) => t);
  const morph = progress(hp, [0.82, 1]);
  // up to the invitation scene's first frame: `<= W_LAST` left the half-beat frame before it (2099) with no card at all
  const inScene = f < W_LAST + 1;
  const edge = progress(f, WB.cardEdge);
  return {
    hp,
    petal: petalAt(hp),
    petalScale: lerp(1.3, 1.7, hp),
    petalOpacity: inScene && hp > 0 ? 1 - morph : 0,
    morph,
    ornamentOpacity: morph,
    ornamentGrow: reduced ? 1 : lerp(0.5, 1, morph),
    cardVisible: inScene && edge > 0,
    edge,
    cardTop: lerp(1920, CARD_EDGE_Y, easeInOut(edge)),
  };
};

/**
 * The two betel leaves leaving her hands and settling flat on the floor beside her (wedding-local beat).
 * Always two sprites; opacity 0 before the release begins (until then the figure draws the leaves in her hands).
 * After the release they rest on the floor.
 */
export const setDownLeaves = (f: number, reduced: boolean): SpriteState[] => {
  const t = progress(f, LEAVES.release, (u) => u);
  const at = basePose(LEAVES.release[0] - 0.5, reduced).bride;
  const P = figurePoints("bride", at);
  const fall = t * t;
  const one = (h: Pt, ang: number, side: number): SpriteState => {
    const ex = COUPLE.brideX + side * 120 * COUPLE.scale;
    const ey = COUPLE.y + 22;
    const sway = Math.sin(t * Math.PI * 3) * (1 - t);
    return {
      name: "paan",
      x: lerp(h.x, ex, easeOut(t)) + sway * 16,
      y: lerp(h.y, ey, fall),
      rot: lerp(ang + 90 + side * 6, side * 84, easeOut(t)) + sway * 16,
      scale: 0.72 * COUPLE.scale,
      opacity: t > 0 ? 1 : 0,
    };
  };
  return [one(P.handL, P.handAngL, -1), one(P.handR, P.handAngR, 1)];
};

// ===================================================================================================================
// Both figures across the whole meeting → wedding stretch
// ===================================================================================================================

/** Everything about the couple at one beat. */
export interface CoupleFrame {
  groom: FigureProps;
  bride: FigureProps & { paan: number };
  /** Who is drawn in front. */
  front: "groom" | "bride";
  /** The two garlands (opacity 0 until they appear). */
  garlands: GarlandState[];
}

/** Beats over which the faces/turn ease from the meeting's last look to the wedding's first (removes a pop). */
const FACE_BLEND = 14;

/**
 * Both figures at ANY global beat from the meeting's start to the wedding's end. Before the wedding starts this is
 * `meetingPose`; after, `exchangeAt`'s pose. At the boundary the faces and head turn would jump (the two scenes
 * were authored separately), so over the first FACE_BLEND beats of the wedding they ease from the meeting's final look
 * into the wedding's own; everything else is already identical.
 * @param globalBeat beats since the story began (240 = meeting starts, 570 = wedding starts, 1050 = wedding ends)
 */
export const couplePose = (globalBeat: number, reduced: boolean): CoupleFrame => {
  const wf = globalBeat - SCENE_BEATS.wedding.start;
  if (wf < 0) {
    const pose = meetingPose(globalBeat - SCENE_BEATS.meeting.start, reduced);
    return { groom: pose.groom, bride: pose.bride, front: "bride", garlands: exchangeAt(0, reduced).garlands };
  }
  const { pose, garlands } = exchangeAt(wf, reduced);
  const k = 1 - progress(wf, [0, FACE_BLEND]);
  if (k > 0) {
    const prior = meetingPose(MEETING_END, reduced);
    const mix = <T extends FigureProps>(now: T, then: FigureProps): T => {
      const face = { ...now.face };
      for (const key of ["gaze", "look", "smile", "blush", "close"] as const) {
        face[key] = lerp(now.face?.[key] ?? 0, then.face?.[key] ?? 0, k);
      }
      return { ...now, turn: lerp(now.turn ?? 0, then.turn ?? 0, k), face };
    };
    pose.groom = mix(pose.groom, prior.groom);
    pose.bride = mix(pose.bride, prior.bride);
  }
  return { groom: pose.groom, bride: pose.bride, front: frontFigure(wf), garlands };
};

// ===================================================================================================================
// Garden and light
// ===================================================================================================================

/** Quantises to 1/200 (the garden path is redrawn only when this changes). */
export const quantise = (n: number): number => Math.round(n * 200) / 200;

/** Parallax drift of the garden layers (px) as a pure function of the GLOBAL beat, so meeting → wedding is continuous. */
export const gardenDrift = (globalBeat: number, reduced: boolean): number =>
  reduced ? 0 : ramp(globalBeat, [SCENE_BEATS.meeting.start, SCENE_BEATS.wedding.end], 22, -22, (t) => t);

/** Dusk amount 0..1 (the garden warms and darkens as the wedding scene begins). Global beat. */
export const duskAt = (globalBeat: number): number =>
  progress(globalBeat, [SCENE_BEATS.wedding.start + WB.dusk[0], SCENE_BEATS.wedding.start + WB.dusk[1]]);

/** Everything the garden needs at a global beat. */
export interface GardenState {
  /** 0..1 garden fade-in (meeting-local [0, 70]). */
  gardenIn: number;
  /** gardenIn quantised to 1/200, for the path. */
  pathIn: number;
  /** 0..1 how wide the path has grown (quantised to 1/200). */
  grow: number;
  /** Parallax drift (px). */
  drift: number;
  dusk: number;
  /** String lights 0..1. */
  lights: number;
  /** Sun-warmth opacity. */
  sun: number;
  /** Foreground leaves part 0..1 (just before the card rises). */
  part: number;
  /** Foreground opacity. */
  foreground: number;
}

/** Garden numbers at a global beat. */
export const gardenState = (globalBeat: number, reduced: boolean): GardenState => {
  const local = globalBeat - SCENE_BEATS.meeting.start;
  const gardenIn = progress(local, MB.gardenIn);
  const dusk = duskAt(globalBeat);
  return {
    gardenIn,
    pathIn: quantise(gardenIn),
    grow: quantise(progress(local, MB.pathWiden)),
    drift: gardenDrift(globalBeat, reduced),
    dusk,
    lights: progress(globalBeat, [SCENE_BEATS.wedding.start + 90, SCENE_BEATS.wedding.start + 200]),
    sun: gardenIn * (1 - dusk * 0.8),
    part: progress(globalBeat, [SCENE_BEATS.wedding.end - 50, SCENE_BEATS.wedding.end + 20]),
    foreground: gardenIn * (1 - dusk * 0.15),
  };
};

// ===================================================================================================================
// Atmosphere, arch, diyas, garlands: sprite lists (fixed length; opacity hides)
// ===================================================================================================================

const S = SCENE_BEATS;

/** How many petals are in the air at a global beat (0..1.2). */
export const petalIntensity = (b: number): number =>
  keyframes(
    b,
    [S.meeting.start + 20, S.meeting.start + 100, S.meeting.end - 20, S.wedding.start + 300, S.wedding.start + 340, S.wedding.start + 400, S.wedding.start + 436, S.wedding.start + 466],
    [0, 0.7, 0.8, 0.3, 1.2, 0.6, 0.2, 0],
  );

/** Gold dust amount (0..1) at a global beat. */
export const dustIntensity = (b: number): number =>
  keyframes(
    b,
    [20, 90, S.meeting.start, S.wedding.start + 200, S.wedding.start + 330, S.wedding.end, S.invitation.start + 200, S.invitation.end - 1],
    [0, 0.55, 0.4, 0.45, 1, 0.5, 0.35, 0.12],
  );

/** Which petals fall at a global beat: marigold-only during the garland exchange, a mix otherwise. */
export const atmosphereKind = (b: number): "marigold" | "mixed" =>
  b >= S.wedding.start + 280 && b < S.wedding.end ? "marigold" : "mixed";

const PETAL_COUNT = 20;
const MIXED: SpriteName[] = ["petal-pink", "petal-marigold", "petal-white", "petal-red"];

/**
 * Drifting petals on three depth layers (always 20). The intensity fades petals in and out one after another by opacity.
 * @param beat global beat
 * @param intensity 0..1.2 (see petalIntensity)
 */
export const petalSprites = ({ beat, intensity, kind = "mixed" }: { beat: number; intensity: number; kind?: "marigold" | "mixed" }): SpriteState[] => {
  const n = PETAL_COUNT * Math.min(1, Math.max(0, intensity));
  return Array.from({ length: PETAL_COUNT }, (_, i): SpriteState => {
    const T = 420 + seeded(i + 1) * 360;
    const phase = seeded(i + 40) * T;
    const f = ((beat + phase) % T) / T;
    const depth = i % 3; // 0 foreground, 1 mid, 2 far
    const size = depth === 0 ? 0.95 : depth === 1 ? 0.68 : 0.46;
    const base = depth === 0 ? 0.95 : depth === 1 ? 0.82 : 0.55;
    const x0 = seeded(i + 80) * 1180 - 50;
    const drift = (seeded(i + 120) - 0.35) * 320;
    const x = x0 + drift * f + Math.sin(beat * (0.018 + seeded(i + 7) * 0.02) + i) * (40 + depth * 12);
    const y = -60 + f * 2040;
    const spin = beat * (0.8 + seeded(i + 9) * 1.6) * (i % 2 ? 1 : -1) + i * 40;
    const flip = Math.cos(beat * (0.04 + seeded(i + 15) * 0.04) + i);
    const env = Math.min(1, f * 7, (1 - f) * 7);
    const name: SpriteName = kind === "marigold" ? (i % 4 === 0 ? "petal-red" : "petal-marigold") : MIXED[i % MIXED.length];
    const present = Math.min(1, Math.max(0, n - i));
    return { name, x, y, rot: spin, scale: size, sx: 0.35 + 0.65 * Math.abs(flip), opacity: env * base * Math.min(1, intensity) * present };
  });
};

const DUST_COUNT = 16;

/**
 * Restrained gold motes rising slowly and twinkling (always 16; faded by opacity).
 * @param beat global beat
 * @param intensity 0..1 (see dustIntensity)
 */
export const dustSprites = ({ beat, intensity }: { beat: number; intensity: number }): SpriteState[] => {
  const n = DUST_COUNT * Math.min(1, Math.max(0, intensity));
  return Array.from({ length: DUST_COUNT }, (_, i): SpriteState => {
    const speed = 0.0009 + seeded(i + 3) * 0.0012;
    const f = (seeded(i + 50) + beat * speed) % 1;
    const x = seeded(i + 90) * 1080 + Math.sin(beat * 0.02 + i * 2.1) * 26;
    const y = 1960 - f * 2040;
    const r = 0.35 + seeded(i + 130) * 0.55;
    const tw = 0.45 + 0.55 * Math.sin(beat * (0.07 + seeded(i + 170) * 0.06) + i);
    const env = Math.min(1, f * 6, (1 - f) * 6);
    const present = Math.min(1, Math.max(0, n - i));
    return { name: "mote", x, y, scale: r, opacity: env * tw * 0.9 * Math.min(1, intensity) * present };
  });
};

/** The whole atmosphere field at a global beat: dust first, then petals (36 sprites). Empty in reduced motion. */
export const atmosphereSprites = (beat: number, reduced: boolean): SpriteState[] =>
  reduced
    ? []
    : [...dustSprites({ beat, intensity: dustIntensity(beat) }), ...petalSprites({ beat, intensity: petalIntensity(beat), kind: atmosphereKind(beat) })];

const ARCH_COUNT = 34;

/** Final position (px) of arch flower i on the half-ellipse. */
export const archPoint = (i: number): Pt => {
  const a = Math.PI - (i / (ARCH_COUNT - 1)) * Math.PI;
  return { x: MANDAP.cx + MANDAP.archRx * Math.cos(a), y: MANDAP.archCy - MANDAP.archRy * Math.sin(a) - 8 };
};

/**
 * The arch of marigolds above the couple (always 34). Invisible until `gather` begins: each flower appears in a
 * flowering bush and flies up into its place, one after another.
 * @param gather 0..1 (see flowerGather)
 */
export const archSprites = (gather: number): SpriteState[] =>
  Array.from({ length: ARCH_COUNT }, (_, i): SpriteState => {
    const fin = archPoint(i);
    const order = (i % 2 === 0 ? i / 2 : (ARCH_COUNT - 1 - i) / 2 + 0.5) / (ARCH_COUNT / 2); // the two ends first
    const g = Math.min(1, Math.max(0, gather * 1.65 - order * 0.65));
    const bush = BUSHES[(i % 2) * 2 + (i % 3 === 0 ? 1 : 0)];
    const sx = bush.x + (seeded(i * 3 + 1) - 0.5) * 120;
    const sy = bush.y + (seeded(i * 3 + 2) - 0.5) * 80;
    const e = easeOut(g);
    // an arc: up and over toward its place
    return {
      name: i % 4 === 3 ? "tuberose" : i % 3 === 1 ? "marigold-b" : "marigold-a",
      x: lerp(sx, fin.x, e),
      y: lerp(sy, fin.y, e) - Math.sin(Math.PI * e) * 160,
      rot: i * 33 + (1 - e) * 260,
      scale: lerp(0.45, i % 4 === 3 ? 0.85 : 1.05, e),
      opacity: g > 0 ? Math.min(1, g * 5) : 0,
    };
  });

/** Number of diyas. */
export const DIYA_COUNT = DIYA_SPOTS.length;

/**
 * Clay lamps along the front of the mandap: glow, bowl and flame for each (always 24 sprites).
 * @param build 0..1 wedding mandap build
 * @param lights 0..1 diyas lit
 * @param time GLOBAL beat (drives the flicker)
 */
export const diyaSprites = (build: number, lights: number, time: number): SpriteState[] => {
  const sprites: SpriteState[] = [];
  const fade = build > 0.02 ? Math.min(1, build * 3) : 0;
  DIYA_SPOTS.forEach((d, i) => {
    const lit = progress(lights, [(i / DIYA_COUNT) * 0.7, (i / DIYA_COUNT) * 0.7 + 0.3]);
    const tt = time + i * 11;
    const flick = 1 + 0.09 * Math.sin(tt * 0.72) + 0.05 * Math.sin(tt * 1.93 + 1.3);
    const s = 0.95 + (d.y - 1560) / 600;
    sprites.push(
      { name: "glow", x: d.x, y: d.y - 22 * s, scale: Math.max(0.001, 0.7 * s * lit * (0.95 + 0.05 * flick)), opacity: 0.85 * lit * fade },
      { name: "diya", x: d.x, y: d.y, scale: s, opacity: fade },
      { name: "flame", x: d.x, y: d.y - 20 * s, rot: Math.sin(tt * 0.41) * 3, scale: Math.max(0.001, s * lit * flick), opacity: lit > 0.01 ? fade : 0 },
    );
  });
  return sprites;
};

/** Flower kinds along a garland. */
const KINDS: SpriteName[] = ["marigold-a", "tuberose", "rose", "tuberose", "marigold-b", "tuberose", "rose", "tuberose"];

/** Points (px) along a hanging strand from `a` to `b` that sags by `sag`, swung by `swing` degrees about its ends. */
export const strandPoints = (a: Pt, b: Pt, sag: number, swing: number, n: number): Pt[] => {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const r = (swing * Math.PI) / 180;
  const down = { x: -Math.sin(r) * sag * 2, y: Math.cos(r) * sag * 2 };
  const c = { x: mid.x + down.x, y: mid.y + down.y };
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
  });
};

/**
 * One garland strand as flower sprites (always `count`; opacity hides them).
 * @param size size of one flower in px
 */
export const garlandSprites = ({
  a,
  b,
  sag,
  swing = 0,
  size,
  count = 17,
  opacity = 1,
  seed = 0,
}: {
  a: Pt;
  b: Pt;
  sag: number;
  swing?: number;
  size: number;
  count?: number;
  opacity?: number;
  seed?: number;
}): SpriteState[] =>
  strandPoints(a, b, sag, swing, count).map((p, i) => ({
    name: KINDS[(i + seed) % KINDS.length],
    x: p.x,
    y: p.y,
    rot: i * 47 + seed * 13,
    scale: size / 22,
    opacity,
  }));

/** Both garlands as one 34-sprite list (the bride's first). */
export const garlandField = (garlands: readonly GarlandState[]): SpriteState[] =>
  garlands.flatMap((gl) => garlandSprites({ ...gl, size: GARLAND_FLOWER }));
