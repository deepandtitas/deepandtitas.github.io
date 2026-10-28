# STORY SPEC: timing, motion, choreography (spec-story)

Source of truth: the old build at `C:\Projects\deepandtitas.github.io`. All code below is copied verbatim from it.
Appearance (art, colours, fonts, faces) is in visual.md; shell/guided UI/strings in shell.md. This file is WHAT/WHERE/WHEN.
Everything is a pure function of the frame. Same frame renders identically twice. No timers, no Math.random.

Conventions: the composition is 1080x1920, y grows down. "beat" = 1/30 s. `f` is a scene-local beat, `g` a global beat
(`g = f + SCENE_BEATS.<scene>.start`). Frame -> beat: `beat = frame / FRAMES_PER_BEAT` (fractional at 60 FPS).

---------------------------------------------------------------------------------------------------------------------
## 1. Timing model (config/timeline.ts)

```ts
export const BEAT_FPS = 30;
export const FPS = 60;
export const FRAMES_PER_BEAT = FPS / BEAT_FPS;   // 2
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const SCENE_BEATS = {
  awakening: { start: 0, end: 240 },
  meeting: { start: 240, end: 570 },
  wedding: { start: 570, end: 1050 },
  invitation: { start: 1050, end: 1500 },
} as const;
export const SCENE_ORDER = ["awakening", "meeting", "wedding", "invitation"] as const;

export const beatsToFrames = (beats: number): number => Math.round(beats * FRAMES_PER_BEAT);
export const framesToBeats = (frames: number): number => frames / FRAMES_PER_BEAT;
SCENES[id] = { start: beatsToFrames(SCENE_BEATS[id].start), end: beatsToFrames(SCENE_BEATS[id].end) }  // end exclusive
export const DURATION = SCENES.invitation.end; // 3000 frames = 50 s
export const LAST_FRAME = DURATION - 1;        // 2999: final, fully revealed invitation

export const SCENE_OVERLAP = { awakening: 72, meeting: 0, wedding: 62, invitation: 0 };  // beats kept rendering after end

export const COVER_FRAME = beatsToFrames(118);   // frame 236: alpana + lotus fully drawn, before names appear
export const sceneDuration = (id) => SCENE_BEATS[id].end - SCENE_BEATS[id].start;   // 240, 330, 480, 450
export const sceneLastFrame = (id) => SCENES[id].end - 1;      // guided checkpoints: 479, 1139, 2099, 2999
export const sceneAt = (frame) => { const f = clamp(floor(frame), 0, LAST_FRAME); first scene with f>=start && f<end; else "invitation" };
nextScene / previousScene = neighbour in SCENE_ORDER or null.
framesToSeconds = f/FPS ; secondsToFrames = round(s*FPS)
```

Scene frames: awakening 0-480, meeting 480-1140, wedding 1140-2100, invitation 2100-3000. Durations in seconds: 8, 11, 16, 15.
Skip target / guided checkpoints are `sceneLastFrame(id)` (frames 479, 1139, 2099, 2999); boundary checks use `>=`.
Skip-to-end = LAST_FRAME (2999).

Scene-RELATIVE beat ranges (`BEATS.<scene>.<name>`), `[from, to]`:

```ts
export const BEATS = {
  awakening: {
    lightIn: [15, 45], alpanaDraw: [30, 150], lotusBloom: [70, 160], headingIn: [24, 60],
    namesReveal: [120, 190], subtitleIn: [168, 205], pathExtend: [190, 239],
  },
  meeting: {
    gardenIn: [0, 70], pathWiden: [0, 70], headingIn: [30, 70], groomWalk: [60, 250], brideWalk: [60, 250],
    meetPause: [250, 290], flowersGather: [292, 329],
  },
  wedding: {
    mandapBuild: [0, 90], diyasLight: [60, 180], headingIn: [20, 60], dusk: [0, 160], shubhodrishti: [56, 250],
    garlands: [248, 384], peak: [330, 400], tableau: [386, 436], petalCross: [436, 479], cardEdge: [451, 479],
  },
  invitation: {
    cardUnfold: [0, 124], emblem: [104, 164], heading: [140, 190], names: [180, 250], message: [240, 310],
    details: [300, 350], mapButton: [340, 390], flourish: [380, 430],
  },
};
```

Composition layering (Sequences, frames): Awakening scene runs frames [0, beatsToFrames(240+72)=624). Camera group (everything
below is scaled by cameraZoom about CAMERA_FOCUS): Garden back (from frame 480, length beatsToFrames(1050+62-240)=1744),
Meeting scene (from 480, 660 frames), Wedding scene (from 1140, beatsToFrames(480+62)=1084 frames), Garden foreground
(from 480, 1744 frames). Then headings, then Invitation scene (from 2100, 900 frames), then Atmosphere (petals+dust) on top.
Background below all: paper colour `#f5ebdd`. Z order bottom-to-top: paper, awakening, garden back, meeting, wedding, garden
foreground, headings, invitation, atmosphere. Scenes use their own local beat (Sequence offset).

Atmosphere kind (petal species): `kind = beat >= wedding.start+280 && beat < wedding.end ? "marigold" : "mixed"` (global beat).
Atmosphere is not rendered in reduced motion.

---------------------------------------------------------------------------------------------------------------------
## 2. Animation helpers (lib/anim.ts, lib/time.ts)

```ts
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
// Remotion Easing: Easing.out(Easing.cubic)(t) = 1 - (1-t)^3 ;  Easing.inOut(Easing.cubic)(t) = t<0.5 ? 4t^3 : 1 - ((-2t+2)^3)/2
// (inOut(e)(t) = t<0.5 ? e(2t)/2 : 1 - e(2(1-t))/2 with e = t^3). Easing.bezier(x1,y1,x2,y2) = CSS cubic-bezier (solve x(t)=input, return y).
export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const easeSoft = Easing.bezier(0.22, 0.61, 0.36, 1);

// interpolate(frame,[a,b],[0,1],{clamp both, easing}): t=clamp((frame-a)/(b-a),0,1); out = outA + (outB-outA)*easing(t)
export const progress = (frame, range, easing = easeInOut) => interpolate(frame,[range[0],range[1]],[0,1],{...CLAMP, easing});
export const ramp = (frame, range, a, b, easing = easeInOut) => interpolate(frame,[range[0],range[1]],[a,b],{...CLAMP, easing});
// multi-stop LINEAR clamped (piecewise linear between inputs)
export const keyframes = (frame, inputs, outputs) => interpolate(frame, inputs, outputs, CLAMP);
export const lerp = (a, b, t) => a + (b - a) * t;
export const seeded = (seed) => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123; return x - Math.floor(x); };
export const smoothKeyframes = (frame, inputs, outputs) => {
  if (frame <= inputs[0]) return outputs[0];
  for (let i = 1; i < inputs.length; i++) {
    if (frame <= inputs[i]) {
      const t = (frame - inputs[i - 1]) / (inputs[i] - inputs[i - 1]);
      return lerp(outputs[i - 1], outputs[i], easeInOut(t));
    }
  }
  return outputs[outputs.length - 1];
};
```
`bump` (WeddingScene local helper): `const bump = (f, a, b) => Math.sin(Math.PI * progress(f, [a, b], (t) => t));` (linear progress, half-sine 0->1->0).
`settle` (AwakeningScene): `t<=0 ? 0 : 1 - Math.exp(-5*t)*Math.cos(4.2*t)`.
`rise` (InvitationScene): `Easing.bezier(0.42, 0, 0.1, 1)`.
`useBeat() = useCurrentFrame() / FRAMES_PER_BEAT`.
Note: JS `%` is used in petals/dust (`(beat+phase) % T`, always non-negative because inputs are >= 0).

---------------------------------------------------------------------------------------------------------------------
## 3. Layout constants (layout.ts, lib/path.ts, FloralMandap MANDAP)

```ts
// lib/path.ts
PATH_TOP_Y = 900; PATH_BOTTOM_Y = 1990; MEET_Y = 1500; LOTUS_BASE_Y = 1145;
PATH_T_LOTUS = (LOTUS_BASE_Y - PATH_TOP_Y) / (PATH_BOTTOM_Y - PATH_TOP_Y);   // 245/1090
PATH_T_MEET  = (MEET_Y - PATH_TOP_Y) / (PATH_BOTTOM_Y - PATH_TOP_Y);          // 600/1090
const K = Math.PI / (PATH_T_MEET - PATH_T_LOTUS);
export const pathPoint = (t) => ({ x: 540 + (30 + 170 * t) * Math.sin(K * (t - PATH_T_LOTUS)), y: lerp(PATH_TOP_Y, PATH_BOTTOM_Y, t) });
const STEPS = 48;
// centreline polyline from t0..t1: n = max(2, round(STEPS*(t1-t0))); points pathPoint(lerp(t0,t1,i/n)), i=0..n  (defaults t0=0,t1=1)
export const pathHalfWidth = (t, grow) => lerp(2.5, 14 + 400 * Math.pow(t, 1.25), grow);   // grow 0 = thin alpana line, 1 = full path
// pathPolygon(grow, edgeOffset=0): for i=0..48, t=i/48, p=pathPoint(t), w=pathHalfWidth(t,grow)+edgeOffset;
//   left point (p.x-w, p.y), right point (p.x+w, p.y); polygon = left points in order, then right points reversed, closed.

// layout.ts
COUPLE = { y: MEET_Y (1500), scale: 0.84, groomX: 415, brideX: 665 }
GAZE_POINT = { x: 540, y: MEET_Y - 598 * COUPLE.scale }          // y = 997.68
CARD_EDGE_Y = 1575
ORNAMENT_POS = { x: 540, y: 1545 }; ORNAMENT_SCALE = 0.62
HOTSPOTS = { lotus: {x:540,y:1010}, path: {x:478,y:1560}, ornament: ORNAMENT_POS }   // composition coordinates (guided hotspots)
// mandap hotspot (meeting scene, guided):  MANDAP.hotspot = { x: 540, y: 510 }
MANDAP = { cx: 540, baseY: MEET_Y, postX: [205, 875], archCy: 650, archRx: 330, archRy: 235, hotspot: {x:540,y:510} }
```
Hotspot sizes (guided): lotus default size, path 300 (label above), mandap 340 (label above), ornament 300 (label below), lotus label below.

---------------------------------------------------------------------------------------------------------------------
## 4. Camera (camera.ts)

```ts
const M = SCENE_BEATS.meeting.start;  // 240
const W = SCENE_BEATS.wedding.start;  // 570
export const CAMERA_FOCUS = { x: GAZE_POINT.x, y: GAZE_POINT.y + 60 };    // (540, 1057.68)
export const cameraZoom = (beat, reduced) => reduced ? 1 : smoothKeyframes(beat,
  [M + 200, M + 300, W + 20, W + 70, W + 130, W + 200, W + 236, W + 262, W + 300, W + 380, W + BEATS.wedding.tableau[1]],
  [1, 1.04, 1.04, 1, 1, 1.15, 1.15, 1.04, 1.06, 1.06, 1]);
```
Global beats: 440, 540, 590, 640, 700, 770, 806, 832, 870, 950, 1006. Applied as `scale(z)` about CAMERA_FOCUS on the
group: garden back, meeting, wedding, garden foreground. NOT applied to awakening, headings, invitation, atmosphere.
Each segment eased with easeInOut (smoothKeyframes).

---------------------------------------------------------------------------------------------------------------------
## 5. Character rig (rig/motion.ts), complete

Figure coordinates: origin between feet, y down, head near y -600. `Who = "groom" | "bride"`. Part transform `PartXf`:
rotate by `rot` (deg, clockwise on screen since y is down; `rotate(p,deg)` = x*c - y*s, x*s + y*c) and scale (`sx`,`sy`, along part's
own local axes) about `pivot`, then move pivot to `at`. A figure is drawn at feet position (x,y) with uniform `scale`.

```ts
export const SKELETON = {
  groom: { shoulder:{x:62,y:-496}, elbow:{x:72,y:-384}, wrist:{x:78,y:-282}, hip:{x:0,y:-370}, neck:{x:0,y:-546},
           crown:{x:0,y:-648}, drape:{x:0,y:-524}, foot:{x:30,y:-2} },
  bride: { shoulder:{x:54,y:-490}, elbow:{x:62,y:-382}, wrist:{x:68,y:-286}, hip:{x:0,y:-420}, neck:{x:0,y:-538},
           crown:{x:0,y:-650}, drape:{x:0,y:-660}, foot:{x:28,y:-4} },
};  // arm values are for the screen-right arm; left arm mirrors x. foot: right foot pivot; left foot = (-foot.x, foot.y).
const HAND = 24;   // palm centre this far past the wrist along the forearm

helpers: sub, add, scale, len=hypot, angle(a)=atan2(y,x)*180/PI, DEG=PI/180, clamp(v,a,b)=min(b,max(a,v)),
  rotate(p,deg), lerpPt(a,b,t)

restArm(who, side) {  // side +1 = screen right, -1 = screen left
  m(p) = {x: p.x*side, y: p.y}; S=m(shoulder); E=m(elbow); W=m(wrist); fore=W-E;
  H = W + fore*(HAND/len(fore));   return { S, E, H, upper: len(E-S), lower: len(H-E) } }
```

### Named arm poses (screen-right arm; left mirrors x). hand = palm target, elbow = where elbow appears, torso-local

```ts
export const ARM_POSES = {
  groom: {
    namaskar: { hand: { x: 7, y: -452 }, elbow: { x: 88, y: -404 } },
    hold:     { hand: { x: 44, y: -432 }, elbow: { x: 94, y: -390 } },
    chest:    { hand: { x: 10, y: -462 }, elbow: { x: 90, y: -404 } },
    face:     { hand: { x: 12, y: -548 }, elbow: { x: 46, y: -428 } },
    aside:    { hand: { x: 86, y: -302 }, elbow: { x: 76, y: -392 } },
    low:      { hand: { x: 26, y: -350 }, elbow: { x: 80, y: -392 } },
  },
  bride: {
    namaskar: { hand: { x: 7, y: -448 }, elbow: { x: 78, y: -400 } },
    hold:     { hand: { x: 40, y: -430 }, elbow: { x: 88, y: -388 } },
    chest:    { hand: { x: 9, y: -462 }, elbow: { x: 80, y: -404 } },
    face:     { hand: { x: 11, y: -546 }, elbow: { x: 40, y: -430 } },
    aside:    { hand: { x: 82, y: -305 }, elbow: { x: 70, y: -390 } },
    low:      { hand: { x: 24, y: -356 }, elbow: { x: 74, y: -388 } },
  },
};
```

### Pose blending

```ts
export const poseArm = (who, side, w /* PoseWeights: partial map name->weight */) => {
  const rest = restArm(who, side);
  const names = Object.keys(ARM_POSES[who]);
  const sum = names.reduce((n, k) => n + clamp(w[k] ?? 0, 0, 1), 0);
  const norm = sum > 1 ? 1 / sum : 1;
  const parts = [{ t: 1 - sum * norm, hand: rest.H, elbow: rest.E }];       // rest pose takes the remainder
  for (const name of names) {
    const t = clamp(w[name] ?? 0, 0, 1) * norm;
    if (t <= 0) continue;
    const q = ARM_POSES[who][name];
    parts.push({ t, hand: { x: q.hand.x * side, y: q.hand.y }, elbow: { x: q.elbow.x * side, y: q.elbow.y } });
  }
  const elbow = { x: 0, y: 0 }; let ang = 0; let reach = 0;
  for (const { t, hand, elbow: e } of parts) {
    elbow.x += e.x * t; elbow.y += e.y * t;
    const v = sub(hand, e);
    ang += swingAngle(v, side) * t;
    reach += len(v) * t;
  }
  return { hand: fromSwing(elbow, ang, reach, side), elbow };
};
export const poseTarget = (who, side, w) => poseArm(who, side, w).hand;

const SWING_FROM = 30;
const swingAngle = (v, side) => { const deg = (Math.atan2(v.y, v.x * side) * 180) / Math.PI;
  return ((((deg - SWING_FROM) % 360) + 360) % 360) + SWING_FROM; };   // 90 = hanging down, increasing = inward
const fromSwing = (e, deg, length, side) => ({ x: e.x + Math.cos(deg*Math.PI/180) * length * side, y: e.y + Math.sin(deg*Math.PI/180) * length });
const MIN_FORESHORTEN = 0.5;
```

### IK and placement

```ts
// Two-bone IK to an explicit target; picks the elbow solution nearest prefElbow
export const solveArm = (S, T, upper, lower, prefElbow) => {
  const d0 = sub(T, S);
  const d = clamp(len(d0), Math.abs(upper - lower) + 1, (upper + lower) * 0.99999);
  const base = Math.atan2(d0.y, d0.x);
  const a = Math.acos(clamp((upper*upper + d*d - lower*lower) / (2*upper*d), -1, 1));
  const c1 = { x: S.x + Math.cos(base + a) * upper, y: S.y + Math.sin(base + a) * upper };
  const c2 = { x: S.x + Math.cos(base - a) * upper, y: S.y + Math.sin(base - a) * upper };
  const E = len(sub(c1, prefElbow)) <= len(sub(c2, prefElbow)) ? c1 : c2;
  const dir = Math.atan2(T.y - E.y, T.x - E.x);
  return { E, H: { x: E.x + Math.cos(dir) * lower, y: E.y + Math.sin(dir) * lower } };
};
// Place arm from shoulder, chosen elbow, palm target; each segment points where it must, foreshortened (scaled along length)
export const placeArm = (S, E, T, upper, lower) => {
  const ku = clamp(len(sub(E, S)) / upper, MIN_FORESHORTEN, 1.03);
  const dirU = Math.atan2(E.y - S.y, E.x - S.x);
  const elbow = { x: S.x + Math.cos(dirU) * upper * ku, y: S.y + Math.sin(dirU) * upper * ku };
  const kf = clamp(len(sub(T, elbow)) / lower, MIN_FORESHORTEN, 1.03);
  const dirF = Math.atan2(T.y - elbow.y, T.x - elbow.x);
  return { E: elbow, H: { x: elbow.x + Math.cos(dirF) * lower * kf, y: elbow.y + Math.sin(dirF) * lower * kf }, ku, kf };
};
```

### FigurePose / FigureProps

```ts
interface FigurePose {
  walk?: number;      // walk phase, radians
  moving?: number;    // 0..1 how much walk is applied
  vel?: number;       // horizontal speed, figure units per beat (cloth lag + lean)
  t?: number;         // time in beats (breathing, wind, blinks); the renderer floors t to whole beats (30 Hz idle life)
  lean?: number;      // extra forward lean of upper body, deg (+ = toward screen right)
  headTilt?: number;  // deg
  arms?: { l?: ArmSpec; r?: ArmSpec };   // ArmSpec = PoseWeights | Pt (explicit palm, figure coords) | Reach
  bow?: number;       // 0..1
  reduced?: boolean;
}
interface Reach { reach: Pt; mix: number; base: PoseWeights }   // mix 0 = exactly base pose, 1 = exactly the reach
// FigureProps extends FigurePose: x, y (feet on canvas), scale?, turn? (-1..1 head turn, features shift),
//   face?: { gaze (-1 left..+1 right), look (0 level..1 cast down), smile 0..1, blush, close (0 open..1 closed; added to natural blinks) },
//   opacity?. Bride additionally takes `paan` (size of betel leaves in hands, 0 = none).
// Face drawing: head shift dx = turn*4; blink = min(1, (face.close ?? 0) + blinkAt(t, groom ? 3 : 8)); gaze defaults to turn.
```

### Idle functions

```ts
export const breathe = (t) => 1 + 0.006 * Math.sin((t / 90) * Math.PI * 2);
export const wind = (t, seed) => Math.sin(t * 0.045 + seed) * 1.1 + Math.sin(t * 0.11 + seed * 2.3) * 0.5;
export const blinkAt = (t, seed) => {
  const period = 135; const k = Math.floor(t / period); let b = 0;
  for (const i of [k - 1, k, k + 1]) {
    const at = i * period + 20 + seeded(i * 7 + seed) * 70;
    const u = Math.abs(t - at) / 4;
    if (u < 1) b = Math.max(b, 1 - u * u);
  }
  return b;
};
export const pendulum = (dt, amp, periodBeats = 38, damping = 0.045) =>
  dt <= 0 ? 0 : amp * Math.exp(-damping * dt) * Math.sin((dt / periodBeats) * Math.PI * 2);
```
Blink seeds: groom 3, bride 8. Eye closure maps `lidY = -7 + 12.5*blink` (visual detail).

### solveFigure(who, p) -> SolvedFigure (verbatim)

```ts
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

const hip   = { pivot: k.hip, at: { x: k.hip.x, y: k.hip.y + bob }, rot: 0 };
const lower = { pivot: k.hip, at: hip.at, rot: -sn * 2.2 * moving + lean * 0.15 };
const torso = { pivot: k.hip, at: hip.at, rot: torsoRot, sy: breath };

const onTorso = (q) => { const local = sub(q, k.hip); return add(hip.at, rotate({ x: local.x, y: local.y * breath }, torsoRot)); };

const neck = onTorso(k.neck);
const idleHead = p.reduced ? 0 : Math.sin(t * 0.031 + (who === "bride" ? 1.7 : 0)) * 0.8;
const headRot = torsoRot + (p.headTilt ?? 0) + idleHead - sway * 0.4;
const head = { pivot: k.neck, at: neck, rot: headRot };
const onHead = (q) => add(neck, rotate(sub(q, k.neck), headRot));

const lag = p.reduced ? 0 : clamp(-vel * 1.4, -7, 7) + wind(t, who === "bride" ? 2 : 5) - sn * 1.2 * moving;
const crown = { pivot: k.crown, at: onHead(k.crown), rot: headRot + lag * 0.15 };
const drape = who === "bride"
  ? { pivot: k.drape, at: onHead(k.drape), rot: torsoRot + (headRot - torsoRot) * 0.35 + lag * 0.6 }
  : { pivot: k.drape, at: onTorso(k.drape), rot: torsoRot + lag * 0.5 };

const stepL = Math.max(0, sn) * 9 * moving;
const stepR = Math.max(0, -sn) * 9 * moving;
const footL = { pivot: { x: -k.foot.x, y: k.foot.y }, at: { x: -k.foot.x - stepL * 0.3, y: k.foot.y - stepL }, rot: -stepL * 0.4 };
const footR = { pivot: k.foot, at: { x: k.foot.x + stepR * 0.3, y: k.foot.y - stepR }, rot: stepR * 0.4 };

const arm = (side) => {
  const rest = restArm(who, side);
  const spec = side === 1 ? p.arms?.r : p.arms?.l;
  const S = onTorso(rest.S);
  let E, H, ku = 1, kf = 1;
  const named = (w) => {
    const pose = poseArm(who, side, w);
    // arms swing a little while walking (only when hanging at rest)
    const restness = 1 - Math.min(1, Object.values(w).reduce((a, b) => a + (b ?? 0), 0));
    const swing = Math.sin(ph + (side === 1 ? 0 : Math.PI)) * moving * restness;
    const off = { x: swing * 6 * side, y: -Math.max(0, swing) * 10 };
    return placeArm(S, onTorso(pose.elbow), onTorso(add(pose.hand, off)), rest.upper, rest.lower);
  };
  if (isPt(spec)) {                                     // explicit palm position (figure coords)
    ({ E, H } = solveArm(S, spec, rest.upper, rest.lower, onTorso(rest.E)));
  } else if (isReach(spec)) {                           // {reach, mix, base}
    const m = clamp(spec.mix, 0, 1);
    const from = named(spec.base);
    const to = solveArm(S, spec.reach, rest.upper, rest.lower, onTorso(rest.E));
    if (m <= 0) ({ E, H, ku, kf } = from);
    else {
      const e = lerpPt(from.E, to.E, m);                // elbow in a line, forearm as a swing about it
      const vf = sub(from.H, from.E);
      const vt = sub(to.H, to.E);
      const af = swingAngle(vf, side);
      const turn = ((((swingAngle(vt, side) - af) % 360) + 540) % 360) - 180;   // shorter way round
      const a = af + turn * m;
      ({ E, H, ku, kf } = placeArm(S, e, fromSwing(e, a, len(vf) + (len(vt) - len(vf)) * m, side), rest.upper, rest.lower));
    }
  } else {
    ({ E, H, ku, kf } = named(spec ?? {}));
  }
  const upper = { pivot: rest.S, at: S, rot: angle(sub(E, S)) - angle(sub(rest.E, rest.S)), ...(ku !== 1 ? { sy: ku } : {}) };
  const fore  = { pivot: rest.E, at: E, rot: angle(sub(H, E)) - angle(sub(rest.H, rest.E)), ...(kf !== 1 ? { sy: kf } : {}) };
  return { upper, fore, H, ang: angle(sub(H, E)) };
};
const L = arm(-1); const R = arm(1);
const neckSide = who === "groom" ? 30 : 26;
return { hip, lower, torso, drape, head, crown, footL, footR,
  upperL: L.upper, upperR: R.upper, foreL: L.fore, foreR: R.fore,
  handL: L.H, handR: R.H, handAngL: L.ang, handAngR: R.ang,        // palm centres + forearm direction (deg), figure coords
  neckL: onTorso({ x: -neckSide, y: k.neck.y + 22 }), neckR: onTorso({ x: neckSide, y: k.neck.y + 22 }),
  headTop: onHead({ x: 0, y: k.crown.y - 10 }) };
```
Draw order of body parts (back to front), each moved by the named transform (all drawn along the part's local y axis, scaled `sy` for foreshortening):
- groom: foot-l(footL), foot-r(footR), dhoti(lower), torso(torso), stole(drape), arm-l(upperL), arm-r(upperR), fore-l(foreL), fore-r(foreR); head group (head transform: translate(at - pivot) then rotate(headRot) about neck) containing head base, face, crown (crown transform relative to head: `rot = crown.rot - head.rot`, at = pivot), topor crown.
- bride: veil(drape) FIRST (behind), foot-l, foot-r, saree(lower), torso, arm-l, arm-r, fore-l, fore-r; head group: head base, face, `veil-front`, mukut crown. When the bride holds betel leaves (`paan > 0`): the forearms are drawn AFTER the head and the two leaf sprites (the leaves and forearms are in front of her face).
- Betel leaf sprites in hand: position = palm `handL/handR`, rot = `handAng + 90 -6` (left) / `+ 90 + 6` (right), scale = `paan`. Figure draws a soft ground shadow (240x32 ellipse at feet, rgba(48,37,31,.32) -> 0).
- `figurePoints(who, props)` = solveFigure then `toWorld(p) = (props.x + p.x*k, props.y + p.y*k)` with k = props.scale ?? 1, for handL, handR, neckL, neckR, headTop (also handAngL/R in degrees unchanged).

---------------------------------------------------------------------------------------------------------------------
## 6. Scenes, beat by beat

### 6.1 Awakening (scene-local beat f, 0-240, rendered to 312 for the cross-fade)

```ts
const exit = progress(frame, [dur + 8, dur + 58]);        // dur = 240 -> whole scene opacity = 1 - exit  (fades beats 248-298)
const light = progress(frame, B.lightIn);                  // [15,45]
const lightR = ramp(frame, B.lightIn, 3, 26);
const glow = progress(frame, B.lotusBloom);                // [70,160]
const lotusOpacity = guided.enabled ? 1 : progress(frame, [B.lotusBloom[0] - 14, B.lotusBloom[0] + 4]);   // [56,74]
const bloom = reducedMotion ? progress(frame, [70, 90]) : settle((frame - 70) / (160 - 70));
const pathP = progress(frame, B.pathExtend);               // [190,239]
const tHead = PATH_T_LOTUS + (1 - PATH_T_LOTUS) * pathP;
const head = pathPoint(tHead);
```
- Alpana (rangoli) centre `ALPANA_CENTER` (see visual.md). Drawn by `Alpana(frame)` over `alpanaDraw=[30,150]` (d0=30, span=120); `seg(a,b)=progress(frame,[d0+span*a, d0+span*b])` (easeInOut):
  border seg(0,0.7); ringA seg(0.05,0.4); ringB seg(0.35,0.7); petals i of petalCount: seg(0.15+(i/petalCount)*0.45, 0.35+(i/petalCount)*0.5); scallops i of scallopCount: seg(0.5+(i/scallopCount)*0.35, 0.65+(i/scallopCount)*0.35); four flourishes (mirror combos) seg(0.2,0.8), seg(0.25,0.85) (mirrorX), seg(0.3,0.9) (mirrorY), seg(0.35,0.95) (mirrorX+Y). Reduced motion: draw frame = max(frame, 150) (fully drawn).
- Light: gold dot at ALPANA_CENTER. Glow disc radius `lightR*5.5`, opacity `light*(1 - glow*0.35)*0.9`; core dot radius `lightR*0.45` colour #fff3cf opacity `light*(1 - lotusOpacity*0.85)` (drawn only when light > 0.001).
- Lotus at (540, LOTUS_BASE_Y=1145) with `bloom` and `glow`, group opacity = lotusOpacity. In guided mode the lotus is a closed bud from frame 0 with opacity 1.
- Closing path stroke (when pathP > 0.001): centreline from PATH_T_LOTUS to tHead drawn twice: width 14 #e7c97c opacity 0.35 round caps, then width 5 colour #781f2b opacity 0.85. A head dot (r 11, #f3d37e, opacity .95) at pathPoint(tHead) while pathP < 0.999.
- Names (title) reveal: RevealText range `namesReveal=[120,190]`; subtitle range `subtitleIn=[168,205]`. RevealText: `p = progress(frame, range, easeInOut)`; hidden while p <= 0; light wipe: revealed % of width `edge = p*120 - 10` (clip `inset(-20% (100-edge)% -20% 0)` until p>=1); glow `glowA = max(0, 1 - |p-0.55|*2.2)`; text-shadow blur `24 + glowA*28` px, gold rgba(233,201,126, 0.15+glowA*0.7). Title: Bengali size 156 top 338 / English size 168 top 336, colour #781f2b, display font; subtitle bn 50 (weight 500, spacing .04em, top 572) / en 56 (400, .08em, top 570) colour #665343.
- Heading "opening" (SceneHeading): fadeIn `headingIn=[24,60]` (easeSoft, also slides up 14px*(1-in)), fadeOutAt global beat `awakening.end + 4 = 244` (fade over 28 beats); y=196; tone ink (#781f2b text, #c49a52 rules).
 SceneHeading opacity `o = inP*(1 - outP)`, outP=`progress(frame,[fadeOutAt, fadeOutAt+28])` (easeInOut).
- Guided: lotus hotspot shown when `interactive && guided.awaiting==="awakening"`; path hotspot when awaiting "meeting".
- COVER_FRAME (frame 236 = beat 118): alpana complete, lotus open/glowing, names not yet visible.

### 6.2 Garden (GardenStage; global beat g = local + 240, mounted from meeting start through wedding end + overlap)

```ts
const q = (n) => Math.round(n * 200) / 200;
gardenDrift(globalBeat, reduced) = reduced ? 0 : ramp(globalBeat, [240, 1050], 22, -22, (t) => t);   // linear parallax px
duskAt(globalBeat) = progress(globalBeat, [570 + 0, 570 + 160]);                                      // easeInOut
// GardenBack (local = beat - 240):
gardenIn = progress(local, B.meeting.gardenIn);              // [0,70]
grow = q(progress(local, B.meeting.pathWiden));              // [0,70], quantised to 1/200
dusk = duskAt(g)
lights = progress(g, [570 + 90, 570 + 200])                  // string lights come on
// layers back->front: GardenFar(drift, opacity gardenIn); sun warmth radial gradient circle at 76% 24% rgba(255,236,170,.5)->0 at 52%,
//   opacity gardenIn*(1 - dusk*0.8); path; GardenMid(drift, gardenIn); dusk wash linear 180deg rgba(64,24,46,.68) 0% / rgba(150,62,38,.36) 52% / rgba(112,40,26,.46) 100% at opacity dusk;
//   GardenLights(drift, opacity lights)
// Path drawing: alpana curve (centreline PATH_T_LOTUS..1, stroke #781f2b w5 round, opacity (1-gardenIn)*0.85) still visible at first, and
//   group opacity gardenIn: polygon(grow) fill #e2cb98 opacity .96; polygon(grow, -26) fill #efdcae opacity .9; polygon(grow) outline #c49a52 w3 opacity .75;
//   centreline 0..1 stroke #fff3cf w10 opacity .55 round dashed "2 26". (gardenIn quantised with q())
// GardenForeground (drawn over the couple): gardenIn as above; dusk; part = progress(g, [1050 - 50, 1050 + 20]) ("leaves part before the card rises");
//   GardenNear(drift, part, opacity = gardenIn*(1 - dusk*0.15))
```
Heading "meeting": local beat since meeting start; fadeIn `meeting.headingIn=[30,70]`; fadeOutAt = `sceneDuration("meeting") - 70 = 260`. Heading "wedding": local since wedding start; fadeIn `[20,60]`, fadeOutAt `wedding.tableau[0]+20 = 406`, tone "light" (#fbefd6, rules #e3c27a, dark shadow).

### 6.3 Meeting (local beat f, 0-330)

```ts
const STEP = 58;   // screen distance of half a walk cycle
const START = { groom: -230, bride: 1310 };
const posAt = (who, f, reduced) => {
  const p = reduced ? 1 : progress(f, who === "groom" ? B.groomWalk : B.brideWalk, easeInOut);     // both [60,250]
  return lerp(START[who], who === "groom" ? COUPLE.groomX : COUPLE.brideX, p);
};
export const meetingPose = (f, reduced) => {
  const walkP = reduced ? 1 : progress(f, B.groomWalk, easeInOut);
  const depth = lerp(0.93, 1, walkP) * COUPLE.scale;
  const y = lerp(COUPLE.y - 26, COUPLE.y, walkP);
  const moving = reduced ? 0 : progress(f, [B.groomWalk[0], B.groomWalk[0] + 12]) * (1 - progress(walkP, [0.9, 1]));
  const vel = (who) => (posAt(who, f, reduced) - posAt(who, f - 1, reduced)) / depth;
  const gx = posAt("groom", f, reduced);
  const bx = posAt("bride", f, reduced);
  const greet = progress(f, B.meetPause, easeInOut);                                            // [250,290]
  const bow = Math.sin(Math.PI * progress(f, [B.meetPause[0] + 6, B.meetPause[1] + 18]));      // [256,308]
  const smile = progress(f, [B.meetPause[0] - 10, B.meetPause[1]]);                             // [240,290]
  return {
    groom: { x: gx, y, scale: depth, t: f, walk: ((gx - START.groom) / STEP) * Math.PI, moving, vel: vel("groom"), turn: 0.7,
      arms: { l: { namaskar: greet }, r: { namaskar: greet } }, bow: bow * 0.6, headTilt: bow * 4,
      face: { gaze: 0.8, look: 0.1 + greet * 0.3, smile: 0.25 + smile * 0.45 }, reduced },
    bride: { x: bx, y, scale: depth, t: f, walk: ((START.bride - bx) / STEP) * Math.PI + 1.4, moving, vel: vel("bride"), turn: -0.7,
      arms: { l: { chest: 1 }, r: { chest: 1 } },   // carries two betel leaves between palms
      paan: 0.72, bow: bow * 0.6, headTilt: -bow * 4,
      face: { gaze: -0.8, look: 0.35 + greet * 0.25, smile: 0.2 + smile * 0.35, blush: smile * 0.6 }, reduced },
  };
};
```
- Scene: `fade = reducedMotion ? progress(f,[60,100]) : 1` applied as opacity to both figures. Arch gather: `gather = reducedMotion ? progress(f,[292,312]) : progress(f, B.flowersGather /*[292,329]*/, t=>t)` (linear).
- Draw order: MandapArch(gather) sprite field (box ARCH_BOX), Groom, Bride. Guided: mandap hotspot when `interactive && guided.awaiting==="wedding"`.
- Order of events (beats): 0-70 garden fades in, path widens from thin alpana line; 30-70 heading; 60-250 groom walks in from x=-230 (left) and bride from x=1310 (right), both easeInOut to groomX 415 / brideX 665; walk phase increases by pi per STEP(58) px; depth scale 0.93->1 of 0.84 and feet y 1474->1500; 250-290 greeting (namaskar both, bow peaks ~282, smiles); 292-329 flowers fly from bushes into arch (only after greeting).
- Final tableau at f=330 is `meetingPose(330, reduced)` and is the wedding scene's start pose.

### 6.4 Wedding (local beat f, 0-480, rendered to 542)

Constants:
```ts
const LEAVES = { raise: [56, 106], open: [164, 214], release: [222, 250] };
const EXCHANGE = {
  appear: [250, 272],
  bride: { stepIn: [266, 288], lift: [278, 300], settle: [300, 312], release: [312, 332], stepBack: [318, 336] },
  groom: { stepIn: [334, 352], lift: [342, 364], settle: [364, 376], release: [376, 396], stepBack: [382, 400] },
};
const SWAP = 336;   // from this beat the groom is drawn in front; before it, she is in front
const STEP = 58;
const SIZE = 22 * COUPLE.scale;
export const GARLAND_BOX = { x: 180, y: 640, w: 720, h: 820 };
toFigure(p, fig) = { x: (p.x - fig.x)/(fig.scale ?? 1), y: (p.y - fig.y)/(fig.scale ?? 1) }
```
basePose (verbatim):
```ts
const basePose = (f, reduced) => {
  const start = meetingPose(330, reduced);
  const X = EXCHANGE;
  const xAt = (g) => {
    const bi = progress(g, X.bride.stepIn) * (1 - progress(g, X.bride.stepBack));
    const gi = progress(g, X.groom.stepIn) * (1 - progress(g, X.groom.stepBack));
    return { groom: COUPLE.groomX + bi * 30 + gi * 70, bride: COUPLE.brideX - bi * 70 - gi * 30 };
  };
  const xs = xAt(f); const prev = xAt(f - 1);
  const stepping = reduced ? 0 : Math.min(1, Math.abs(xs.groom - prev.groom) * 0.6 + Math.abs(xs.bride - prev.bride) * 0.6);
  const relax = 1 - progress(f, [8, 40]);
  const raise = progress(f, LEAVES.raise);
  const open = progress(f, LEAVES.open);
  const holding = f < LEAVES.release[0];
  const lowerA = progress(f, [LEAVES.open[0], (LEAVES.open[0] + LEAVES.open[1]) / 2]);
  const lowerB = progress(f, [(LEAVES.open[0] + LEAVES.open[1]) / 2, LEAVES.open[1]]);
  const relaxArms = progress(f, [LEAVES.release[0] + 2, X.appear[0]]);
  const appear = progress(f, [X.appear[0] - 6, X.appear[1] + 4]);
  const brideHas = appear * (1 - progress(f, [X.bride.release[1], X.bride.release[1] + 24]));
  const groomHas = appear * (1 - progress(f, [X.groom.release[1], X.groom.release[1] + 24]));
  const groomReady = progress(f, X.groom.stepIn);
  const veiled = raise * (1 - open);
  const eyesMeet = progress(f, [LEAVES.open[0] + 16, LEAVES.open[1] + 6]);
  const joy = progress(f, [LEAVES.open[0] + 26, LEAVES.open[1] + 40]);
  const tableau = progress(f, B.tableau);
  const receiveG = bump(f, X.bride.lift[0], X.bride.release[1]);
  const receiveB = bump(f, X.groom.lift[0], X.groom.release[1]);

  const groom = { ...start.groom, x: xs.groom, t: f + 330, vel: (xs.groom - prev.groom) / COUPLE.scale,
    walk: ((xs.groom - COUPLE.groomX) / STEP) * Math.PI, moving: stepping, turn: 0.85,
    arms: named({ namaskar: relax * (1 - appear) + tableau, low: groomHas * (1 - groomReady), hold: groomHas * groomReady }),
    bow: receiveG * 0.7, headTilt: receiveG * 5,
    face: { gaze: 0.9, look: 0.12 + receiveG * 0.3 + bump(f, 280, 330) * 0.1, smile: 0.35 + joy * 0.45, blush: joy * 0.25 } };
  const bride = { ...start.bride, x: xs.bride, t: f + 330, vel: (xs.bride - prev.bride) / COUPLE.scale,
    walk: ((COUPLE.brideX - xs.bride) / STEP) * Math.PI + 1.4, moving: stepping, turn: -0.6 - 0.3 * eyesMeet,
    arms: named({ chest: 1 - raise, face: raise * (1 - lowerA), hold: lowerA * (1 - lowerB) + brideHas,
                  aside: lowerB * (1 - relaxArms), namaskar: tableau }),
    paan: holding ? lerp(0.72, 0.98, raise) - 0.2 * open : 0,
    bow: receiveB * 0.7, headTilt: -receiveB * 5,
    face: { gaze: -0.9 * eyesMeet - 0.3, look: lerp(0.55, 0, eyesMeet) + receiveB * 0.3, smile: 0.15 + joy * 0.55,
            blush: 0.3 + joy * 0.5, close: veiled * 0.35 } };
  return { groom, bride };
};
```
(`named(w) = { l: w, r: w }`. Note: `start.*` supplies y, scale (=0.84, y=1500), reduced; `start.bride.paan` is overridden by `paan`.) `lean` is not set by basePose; exchangeAt sets it for the giver.

exchangeAt (verbatim):
```ts
export const exchangeAt = (f, reduced) => {
  const pose = basePose(f, reduced);
  const X = EXCHANGE;
  const appear = progress(f, X.appear);
  const garlands = [];
  const give = (giver) => {
    const receiver = giver === "bride" ? "groom" : "bride";
    const w = X[giver];
    const R = figurePoints(receiver, pose[receiver]);
    const lift = progress(f, w.lift, (t) => t);
    const settle = progress(f, w.settle, (t) => t);
    const release = progress(f, w.release, (t) => t);
    const chin = { l: { x: R.neckL.x - 6, y: R.neckL.y - 62 * COUPLE.scale }, r: { x: R.neckR.x + 6, y: R.neckR.y - 62 * COUPLE.scale } };
    const neck = { l: R.neckL, r: R.neckR };
    if (lift > 0 && release < 1) {
      const giverPose = pose[giver];
      const out = (p) => toFigure(p, giverPose);
      const base = giverPose.arms;                       // {l: PoseWeights, r: PoseWeights}
      const mix = easeInOut(lift) * (1 - easeInOut(release));
      const at = (side) => out(lerpPt(chin[side], neck[side], easeInOut(settle)));
      giverPose.arms = { l: { reach: at("l"), mix, base: base.l }, r: { reach: at("r"), mix, base: base.r } };
      giverPose.lean = (giver === "bride" ? -1 : 1) * 5 * bump(f, w.lift[0], w.release[1]);
    }
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
```
Note `R` (receiver points) uses the receiver's pose as modified so far (bride pass runs first, so in the groom pass the receiver, the bride, already carries any arm override/lean from the bride pass; the pose objects are mutated in place).
Garland sprites each frame: for each of the 2 garlands `garlandSprites({...gl, size: SIZE})` (17 sprites each, 34 total, fixed):
```ts
const KINDS = ["marigold-a", "tuberose", "rose", "tuberose", "marigold-b", "tuberose", "rose", "tuberose"];
strandPoints(a, b, sag, swing, n): mid=(a+b)/2; r=swing*PI/180; down={x:-sin(r)*sag*2, y:cos(r)*sag*2}; c=mid+down;
  point i: t=i/(n-1), u=1-t, quadratic Bezier u²a + 2ut c + t²b.
garlandSprites({a,b,sag,swing=0,size,count=17,opacity=1,seed=0}) -> per point i: { name: KINDS[(i+seed)%8], x, y, rot: i*47 + seed*13, scale: size/22, opacity }
```
(Garland opacity = `appear = progress(f, [250,272])`.) Garlands are drawn on top of both figures (SpriteField with box GARLAND_BOX), then leaves.

SetDownLeaves (betel leaves let go; two sprites "paan"):
```ts
const t = progress(f, LEAVES.release, (u) => u);     // linear [222,250]; returns nothing if t <= 0
const at = basePose(LEAVES.release[0] - 0.5, reduced).bride;     // pose just before release (221.5)
const P = figurePoints("bride", at);
const fall = t * t;
for each [h, ang, side] of [[P.handL, P.handAngL, -1], [P.handR, P.handAngR, 1]]:
  const ex = COUPLE.brideX + side * 120 * COUPLE.scale;
  const ey = COUPLE.y + 22;
  const sway = Math.sin(t * Math.PI * 3) * (1 - t);
  x = lerp(h.x, ex, easeOut(t)) + sway * 16;
  y = lerp(h.y, ey, fall);
  rot = lerp(ang + 90 + side * 6, side * 84, easeOut(t)) + sway * 16;
  Sprite "paan" at (x,y) rot, scale 0.72 * COUPLE.scale
```
(While `f < 222` the bride's own held leaves (`paan` prop, drawn in her hands) show; from 222 `paan` = 0 and these free sprites take over.)

Lighting / transition in WeddingScene:
```ts
const build = progress(f, B.mandapBuild);        // [0,90]; MandapStructure receives round(build*400)/400
const lights = progress(f, B.diyasLight);        // [60,180]
const meet = bump(f, LEAVES.open[0] + 22, LEAVES.open[1] + 52) * 0.6;          // bump(f,186,266)*0.6
const peak = Math.pow(bump(f, B.peak[0], B.peak[1] + 30), 1.4) * 0.9;           // bump(f,330,430)
const settle = progress(f, [B.tableau[0], B.tableau[1] + 20]) * 0.22;           // [386,456]
const glow = Math.max(meet * 0.5, peak, settle, lights * 0.32);
const hp = progress(f, B.petalCross, (t) => t);   // linear [436,479]
const petal = petalAt(hp);
const morph = progress(hp, [0.82, 1]);
const inScene = f <= LAST;                        // LAST = 479
const edge = progress(f, B.cardEdge);             // [451,479] easeInOut
const cardTop = lerp(1920, CARD_EDGE_Y, easeInOut(edge));
const groomFirst = f < SWAP;                      // zIndex: groom 1/2, bride 2/1 (groomFirst -> bride in front)
const petalAt = (t) => { const e = easeInOut(t); return {
  x: lerp(-90, 540, e) + Math.sin(t * Math.PI * 2.4) * 130 * (1 - t),
  y: lerp(560, ORNAMENT_POS.y, easeOut(t) * 0.55 + t * 0.45),
  rot: t * 540 - 40 }; };
```
Draw list (back to front): GlowDisc at (540,1040) r 760 opacity `glow`; MandapStructure(build); MandapArch(gather 1, box ARCH_BOX_GATHERED); MandapDiyas(build, lights, time g); GlowDisc at (GAZE_POINT.x, GAZE_POINT.y+10) r 230 opacity `meet`; groom and bride (groom in front once f >= 336, i.e. he garlands her; before, bride in front); garlands; set-down leaves; marigold petal sprite "petal-marigold" at petalAt(hp), rot, scale `lerp(1.3,1.7,hp)`, opacity `inScene && hp>0 ? 1-morph : 0` (hidden when invisible); invitation card edge (visible when inScene && edge>0): InvitationCard(frame 0, top cardTop, border = edge) + gold Emblem at ORNAMENT_POS, scale `ORNAMENT_SCALE * (reduced ? 1 : lerp(0.5,1,morph))`, opacity `morph`. Guided: ornament hotspot (size 300, label below) when `interactive && guided.awaiting==="invitation"`.
Glow disc = soft radial warm gold disc (visual.md).

Mandap structure (MandapStructure, parameter build 0..1 = quantised wedding build):
```ts
posts = easeOut(progress(build, [0, 0.55], t=>t)); dome = progress(build,[0.12,0.62]); valance = progress(build,[0.3,0.72]);
strings = progress(build,[0.5,1]); floor = progress(build,[0,0.6]);
floor art: opacity floor.
dome: opacity dome, scale lerp(0.86,1,dome) about bottom-centre (w/2, h of the dome art box).
strings: revealed by sliding down from top: offset (1-p)*h upward (clip region = art box), visible when p>0.001.
valance: opacity valance, scaleX lerp(0.6,1,valance) about top-centre.
posts (left & right): rise from bottom: offset (1-p)*h downward within clip, p=posts.
leaves-l / leaves-r: opacity floor, scale lerp(0.7,1,floor) about 50% 100%.
```
Posts at x=205 and 875 (MANDAP.postX). Mandap centre/floor y = 1500.

Arch (34 flowers on a half-ellipse; used in meeting with `gather` 0..1, and in wedding with gather 1):
```ts
ARCH_COUNT = 34
archPoint(i): a = PI - (i/(ARCH_COUNT-1))*PI; { x: 540 + 330*cos(a), y: 650 - 235*sin(a) - 8 }
ARCH_BOX = { x: 0, y: 160, w: 1080, h: 1160 }; ARCH_BOX_GATHERED = { x: 160, y: 330, w: 760, h: 400 }; DIYA_BOX = { x: 0, y: 1360, w: 1080, h: 400 }
BUSHES = [{x:190,y:1010},{x:40,y:1150},{x:890,y:1000},{x:1050,y:1120}]
archSprites(gather) = for i in 0..33:
  fin = archPoint(i)
  order = (i % 2 === 0 ? i / 2 : (ARCH_COUNT - 1 - i) / 2 + 0.5) / (ARCH_COUNT / 2)      // the two ends first
  g = min(1, max(0, gather * 1.65 - order * 0.65))
  bush = BUSHES[(i % 2) * 2 + (i % 3 === 0 ? 1 : 0)]
  sx = bush.x + (seeded(i*3+1) - 0.5) * 120 ; sy = bush.y + (seeded(i*3+2) - 0.5) * 80
  e = easeOut(g)
  { name: i%4===3 ? "tuberose" : i%3===1 ? "marigold-b" : "marigold-a",
    x: lerp(sx, fin.x, e), y: lerp(sy, fin.y, e) - sin(PI*e)*160, rot: i*33 + (1-e)*260,
    scale: lerp(0.45, i%4===3 ? 0.85 : 1.05, e), opacity: g > 0 ? min(1, g*5) : 0 }
```
Diyas (8, three sprites each = 24: glow, diya, flame):
```ts
DIYA_SPOTS = [{120,1560},{215,1605},{345,1622},{460,1632},{620,1632},{735,1622},{865,1605},{960,1560}]   // (x,y)
diyaSprites(build, lights, time):
  fade = build > 0.02 ? min(1, build*3) : 0
  per spot i: lit = progress(lights, [(i/8)*0.7, (i/8)*0.7 + 0.3])
    tt = time + i*11 ; flick = 1 + 0.09*sin(tt*0.72) + 0.05*sin(tt*1.93 + 1.3)
    s = 0.95 + (d.y - 1560)/600
    push { name:"glow",  x:d.x, y:d.y - 22*s, scale: max(0.001, 0.7*s*lit*(0.95+0.05*flick)), opacity: 0.85*lit*fade }
    push { name:"diya",  x:d.x, y:d.y, scale: s, opacity: fade }
    push { name:"flame", x:d.x, y:d.y - 20*s, rot: sin(tt*0.41)*3, scale: max(0.001, s*lit*flick), opacity: lit > 0.01 ? fade : 0 }
```
`time` passed is the GLOBAL beat of the wedding scene (`g = f + 570`).

Wedding event timeline (scene-local beats):
- 0-90 mandap builds (posts rise, dome opens, valance, strings drop); 0-160 dusk deepens (garden wash); 20-60 heading; 60-180 diyas light one after another; 90-200 garden string lights fade in.
- 8-40 groom's greeting hands relax (namaskar weight `relax`). 56-106 bride raises the betel leaves to veil her face (`raise`; leaves grow 0.72->0.98; eyes close 0.35 while veiled).
- 164-214 leaves lowered/opened aside (`open`; first half 164-189 face->hold, second half 189-214 hold->aside); eyes meet 180-220 (`eyesMeet` [180,220]): bride turn -0.6 -> -0.9, gaze -0.3 -> -1.2; joy 190-254 (smile, blush). 186-266 gaze glow `meet`.
- 222-250 the leaves are released and fall to the floor beside her (SetDownLeaves); 224-250 her arms relax (`relaxArms`).
- 244-276 garlands appear (opacity 250-272; hands lift from 244).
- Bride gives garland to groom: stepIn 266-288 (bride moves 70px toward him, groom 30px toward her), lift 278-300 (hands reach to his chin), settle 300-312 (garland lowered to his neck; placed at settle>=1), release 312-332 (hands return to pose, sag grows 60->118 * 0.84, pendulum swing 9 deg starting beat 312), stepBack 318-336.
- At 336 the front/back swap: groom drawn in front.
- Groom gives garland to bride: stepIn 334-352 (groom 70 px, bride 30 px), lift 342-364, settle 364-376, release 376-396, stepBack 382-400. Giver lean `+/-5 * bump(lift[0], release[1])` (bride -, groom +).
- 330-430 peak glow; 386-436 tableau (both fold hands in namaskar, weight `tableau`); camera back to 1 by beat 436; glow settles `settle`.
- 436-479 petal crosses from left (x -90 -> 540, y 560 -> 1545), morphing at hp in [0.82,1] into the gold Emblem ornament at (540,1545) scale 0.62; 451-479 the card edge rises from y=1920 to 1575. Garden foreground parts at global 1000-1070 (part).

### 6.5 Atmosphere: petals and gold dust (global beat)

```ts
petalIntensity(b) = keyframes(b, [260, 340, 550, 870, 910, 970, 1006, 1036], [0, 0.7, 0.8, 0.3, 1.2, 0.6, 0.2, 0]);
//   = [M+20, M+100, M.end-20, W+300, W+340, W+400, W+436, W+466]
dustIntensity(b) = keyframes(b, [20, 90, 240, 770, 900, 1050, 1250, 1499], [0, 0.55, 0.4, 0.45, 1, 0.5, 0.35, 0.12]);
//   = [20, 90, M.start, W+200, W+330, W.end, I.start+200, I.end-1]
const COUNT = 20; MIXED = ["petal-pink", "petal-marigold", "petal-white", "petal-red"];
petalSprites({beat, intensity, kind}) -> 20 sprites:
  n = COUNT * clamp01(intensity)
  T = 420 + seeded(i+1)*360 ; phase = seeded(i+40)*T ; f = ((beat + phase) % T) / T
  depth = i % 3 ; size = depth===0 ? 0.95 : depth===1 ? 0.68 : 0.46 ; base = depth===0 ? 0.95 : depth===1 ? 0.82 : 0.55
  x0 = seeded(i+80)*1180 - 50 ; drift = (seeded(i+120) - 0.35)*320
  x = x0 + drift*f + sin(beat*(0.018 + seeded(i+7)*0.02) + i) * (40 + depth*12)
  y = -60 + f*2040
  spin = beat*(0.8 + seeded(i+9)*1.6)*(i%2 ? 1 : -1) + i*40
  flip = cos(beat*(0.04 + seeded(i+15)*0.04) + i)
  env = min(1, f*7, (1-f)*7)
  name = kind==="marigold" ? (i%4===0 ? "petal-red" : "petal-marigold") : MIXED[i%4]
  present = clamp01(n - i)
  { name, x, y, rot: spin, scale: size, sx: 0.35 + 0.65*|flip|, opacity: env*base*min(1,intensity)*present }
const COUNT = 16 (dust);
dustSprites({beat, intensity}) -> 16 sprites "mote":
  n = 16*clamp01(intensity) ; speed = 0.0009 + seeded(i+3)*0.0012 ; f = (seeded(i+50) + beat*speed) % 1
  x = seeded(i+90)*1080 + sin(beat*0.02 + i*2.1)*26 ; y = 1960 - f*2040 ; r = 0.35 + seeded(i+130)*0.55
  tw = 0.45 + 0.55*sin(beat*(0.07 + seeded(i+170)*0.06) + i) ; env = min(1, f*6, (1-f)*6) ; present = clamp01(n - i)
  { name:"mote", x, y, scale: r, opacity: env*tw*0.9*min(1,intensity)*present }
```
Field order: dust sprites first, then petals; drawn at 0.75 resolution, always on top of everything, whole run (not in reduced motion). Note petals use sprite `sx` (horizontal scale factor, for a flip effect).

### 6.6 Invitation (local beat f, 0-450)

```ts
const e = reducedMotion ? 1 : progress(f, B.cardUnfold /*[0,124]*/, rise /* bezier(0.42,0,0.1,1) */);
const top = lerp(CARD_EDGE_Y, CARD.top, e);        // CARD.top: top of finished card (see visual.md / InvitationCard)
const emblemY = top + lerp(-30, 190, e);
const emblemScale = lerp(ORNAMENT_SCALE, 1, e);
const backdrop = progress(f, [0, 50]);              // radial-gradient(circle at 50% 28%, #62262d 0%, #3b1b1c 58%, #26110f 100%) opacity backdrop
const emblemBloom = progress(f, B.emblem);          // [104,164]
const halo = 1 - progress(f, [B.emblem[1], B.emblem[1] + 60]) * 0.6;
// Emblem at x=540: bloom = 0.55 + 0.45*emblemBloom, halo.
// InvitationCard(frame=f, top): heading = progress(f, [140,190], easeOut); names [180,250] easeOut; message [240,310] easeOut;
//   details [300,350] easeOut; map button [340,390] easeOut; flourish [380,430] easeInOut;
//   shimmer = sin(PI * progress(f, [370, 460])) * 0.9 (gold glow passing over names; progress easeInOut)
//   rise(p) = opacity p, translateY((1-p)*26 px).
```
The last frame (2999) is the fully revealed card (f=449). At the end of the wedding scene the card edge sits at y=1575 with the ornament at (540,1545) scale 0.62, and the invitation scene begins from exactly that top (e=0 -> top=CARD_EDGE_Y, emblemY = 1575-30 = 1545, scale 0.62).

---------------------------------------------------------------------------------------------------------------------
## 7. Reduced motion and guided mode (story-level)

Reduced motion (`reducedMotion` prop):
- Camera zoom = 1 (no push). Garden drift = 0. Atmosphere (petals+dust) not rendered.
- Awakening: alpana drawn complete from the first frame (frame = max(frame, 150)); lotus bloom is a plain 20-beat ease `progress(f,[70,90])` instead of the springy settle.
- Meeting: figures are at final positions from the start (posAt p=1, walkP=1, moving=0), `fade = progress(f,[60,100])` fades them in; arch gather `progress(f,[292,312])` linear.
- Wedding: `stepping` 0, garland swing 0 (no pendulum or idle sway), emblem morph scale fixed 1.
- solveFigure with `reduced:true`: moving=0, breath=1, no idle head sway, no cloth lag/wind. Invitation: card at full position immediately (e=1).
- Fade-in of text etc. unchanged. (The shell still leads with "Watch the story"; see shell.md.)

Guided mode (story effects only; state machine is in shell.md):
- The story pauses at `sceneLastFrame(scene)` (479, 1139, 2099); boundary checks use `>=` and run before scene updates because the Player may skip frames.
- Awakening lotus is a closed bud from frame 0 (`lotusOpacity = 1`); in guided mode lotus hotspot at (540,1010) appears while awaiting "awakening"; path hotspot at (478,1560) size 300 while awaiting "meeting"; mandap hotspot at (540,510) size 340 while awaiting "wedding"; ornament hotspot (540,1545) size 300 while awaiting "invitation". Hotspots only exist when `interactive` (never in renders).
- Composition root is click-through (pointer-events none); hotspots opt back in.

---------------------------------------------------------------------------------------------------------------------
## 8. Existing tests to port

tests/timeline.test.ts:
- WIDTH 1080, HEIGHT 1920, FPS 60, BEAT_FPS 30, FRAMES_PER_BEAT 2, DURATION 3000 (= 50 s at 60 FPS).
- beatsToFrames(240)=480; framesToBeats(481)=240.5; beatsToFrames(framesToBeats(1234))=1234.
- LAST_FRAME 2999; sceneAt(2999)="invitation"; sceneAt(3000)="invitation" (clamped).
- Scenes tile: first start 0, each start = previous end, last end = DURATION.
- Storyboard: awakening beats {0,240}; SCENES.meeting {480,1140}; wedding {1140,2100}; invitation {2100,3000}; durations in seconds [8, 11, 16, 15].
- sceneAt at 0=awakening, 479=awakening, 480=meeting, 1139=meeting, 1140=wedding, 2099=wedding, 2100=invitation, -5=awakening.
- sceneLastFrame: 479, 1139, 2099, LAST_FRAME.
- nextScene/previousScene chain (awakening->meeting; invitation next null; meeting prev awakening; awakening prev null).
- Every BEATS range: start >= 0, end <= sceneDuration, end > start.
- `BEATS.meeting.flowersGather[0] >= BEATS.meeting.meetPause[1]`.
- `BEATS.wedding.shubhodrishti[1] <= BEATS.wedding.garlands[0] + 2`.
- `sceneAt(COVER_FRAME)==="awakening"`; `SCENE_BEATS.wedding.end + SCENE_OVERLAP.wedding <= SCENE_BEATS.invitation.end`.

tests/rig.test.ts (import blinkAt, pendulum, placeArm, poseTarget, restArm, solveArm, solveFigure):
- Rest pose: for both figures `solveFigure(who,{reduced:true})`: |rot| < 0.01 of upperL, upperR, foreL, foreR; dist(handR, restArm(who,1).H) < 0.01.
- solveArm keeps bone lengths (toBeCloseTo 3 digits) for targets (10,-450), (120,-600), (-40,-300) on groom's right arm, and elbow `E.x > 20` (never flips).
- placeArm(S,(40,-430),(11,-546)) for bride right: dist(S,E) ≈ upper*ku, dist(E,H) ≈ lower*kf, ku,kf in [0.5,1.03].
- No arm crossing: for both figures and arms in [{face:1},{namaskar:1},{chest:1},{hold:1},{aside:1},{low:1},{chest:.5,face:.5}], with reduced: `foreR.at.x > 20`, `foreL.at.x < -20`, `handR.x > -6`, `handL.x < 6`.
- Unreachable target (-900,-490) for bride left arm: dist(S,H) <= upper+lower and H.x < S.x.
- Pose blending continuous: bride right `poseTarget({namaskar: i/20})` consecutive steps move < 15.
- Blinks deterministic (blinkAt(t,3) over t=0..1499 equal across calls), some samples > 0.5 and fraction closed (> 0.5) < 0.08.
- pendulum(0,9)=0, pendulum(-5,9)=0, late (200-239) max < 0.1 * early (0-39) max.

tests/choreography.test.ts (exchangeAt, figurePoints, step 0.5 beat over [0.5, 480)):
- No hand jump: for each hand, per-step distance d: not (d > 4 and d > 2.5 * max(neighbour steps)).
- Unhurried: fastest per-0.5-beat hand movement < 16 composition px.

tests/sprites.test.ts:
- Fixed list lengths over beats 0..1500 step 7: petalSprites (intensity (b%300)/250), dustSprites (intensity (b%200)/200), archSprites(min(1,b/600)-0.2), diyaSprites(b/800,b/900,b), garland sprites from exchangeAt(b % 480) all constant lengths.
- Garlands stay inside GARLAND_BOX with margin 24 for beats 0..480 step 0.5 (visible = opacity > 0.002; edges on frame edges not checked: box edges at 0 or 1080/1920 skipped).
- archSprites(g) inside ARCH_BOX margin 24 for g in 0..1 step 0.01; archSprites(1) inside ARCH_BOX_GATHERED margin 30; diyaSprites(1,1,t) inside DIYA_BOX margin 20 for t = 0..400 step 3.
