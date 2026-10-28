/**
 * Single source of truth for the cinematic timeline.
 * Scene starts/ends, guided checkpoints, the skip target and the composition duration all derive from here.
 * `end` is exclusive: a scene owns frames [start, end).
 *
 * Pacing is authored in BEATS (1 beat = 1/30 s) and the composition plays at 60 FPS, so every beat is two frames.
 * Animation code reads the fractional beat (`useBeat()`), which keeps all hand-tuned numbers below while
 * interpolating smoothly at 60 FPS. Anything that talks to the Player or a <Sequence> uses frames.
 */
export const BEAT_FPS = 30;
export const FPS = 60;
export const FRAMES_PER_BEAT = FPS / BEAT_FPS;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Scene boundaries in beats. */
export const SCENE_BEATS = {
  awakening: { start: 0, end: 240 },
  meeting: { start: 240, end: 570 },
  wedding: { start: 570, end: 1050 },
  invitation: { start: 1050, end: 1500 },
} as const;

export type SceneId = keyof typeof SCENE_BEATS;
export const SCENE_ORDER = ["awakening", "meeting", "wedding", "invitation"] as const;

export const beatsToFrames = (beats: number): number => Math.round(beats * FRAMES_PER_BEAT);
export const framesToBeats = (frames: number): number => frames / FRAMES_PER_BEAT;

/** Scene boundaries in frames (60 FPS). */
export const SCENES = Object.fromEntries(
  SCENE_ORDER.map((id) => [id, { start: beatsToFrames(SCENE_BEATS[id].start), end: beatsToFrames(SCENE_BEATS[id].end) }]),
) as Record<SceneId, { start: number; end: number }>;

export const DURATION = SCENES.invitation.end; // 3000 frames = 50 s at 60 FPS
export const LAST_FRAME = DURATION - 1; // 2999 — the final, fully revealed invitation

/**
 * Beats a scene keeps rendering after its end so the next scene can cross-fade over it.
 * Scenes whose end state is identical to the next scene's start state need no overlap.
 */
export const SCENE_OVERLAP: Record<SceneId, number> = {
  awakening: 72,
  meeting: 0,
  wedding: 62,
  invitation: 0,
};

/** Frame shown behind the intro screen: the alpana and lotus fully drawn, before the names appear (beat 118). */
export const COVER_FRAME = beatsToFrames(118);

/** Scene length in beats. */
export const sceneDuration = (id: SceneId): number => SCENE_BEATS[id].end - SCENE_BEATS[id].start;

/** Last frame (60 FPS) that belongs to a scene (where guided mode pauses). */
export const sceneLastFrame = (id: SceneId): number => SCENES[id].end - 1;

export const sceneAt = (frame: number): SceneId => {
  const f = Math.max(0, Math.min(LAST_FRAME, Math.floor(frame)));
  for (const id of SCENE_ORDER) {
    if (f >= SCENES[id].start && f < SCENES[id].end) return id;
  }
  return "invitation";
};

export const nextScene = (id: SceneId): SceneId | null => {
  const i = SCENE_ORDER.indexOf(id);
  return SCENE_ORDER[i + 1] ?? null;
};

export const previousScene = (id: SceneId): SceneId | null => {
  const i = SCENE_ORDER.indexOf(id);
  return SCENE_ORDER[i - 1] ?? null;
};

export const framesToSeconds = (frames: number): number => frames / FPS;
export const secondsToFrames = (seconds: number): number => Math.round(seconds * FPS);

/**
 * Beats RELATIVE to the start of each scene. Animation code reads these
 * instead of hard-coding numbers, so pacing can be tuned in one place.
 */
export const BEATS = {
  awakening: {
    lightIn: [15, 45],
    alpanaDraw: [30, 150],
    lotusBloom: [70, 160],
    headingIn: [24, 60],
    namesReveal: [120, 190],
    subtitleIn: [168, 205],
    pathExtend: [190, 239],
  },
  meeting: {
    gardenIn: [0, 70],
    pathWiden: [0, 70],
    headingIn: [30, 70],
    groomWalk: [60, 250],
    brideWalk: [60, 250],
    meetPause: [250, 290],
    flowersGather: [292, 329],
  },
  wedding: {
    mandapBuild: [0, 90],
    diyasLight: [60, 180],
    headingIn: [20, 60],
    dusk: [0, 160],
    shubhodrishti: [56, 250],
    garlands: [248, 384],
    peak: [330, 400],
    tableau: [386, 436],
    petalCross: [436, 479],
    cardEdge: [451, 479],
  },
  invitation: {
    cardUnfold: [0, 124],
    emblem: [104, 164],
    heading: [140, 190],
    names: [180, 250],
    message: [240, 310],
    details: [300, 350],
    mapButton: [340, 390],
    flourish: [380, 430],
  },
} as const satisfies Record<SceneId, Record<string, readonly [number, number]>>;
