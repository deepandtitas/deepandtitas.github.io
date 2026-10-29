/**
 * Parity: the pure story core (src/story) must produce the same numbers as the OLD build for the same inputs.
 * The old build (commit 3004fa2, before the canvas remake) is imported straight from a checkout of it: e.g.
 * `git worktree add ../dt-old 3004fa2`, then run with OLD_BUILD=../dt-old. Without one the whole file is skipped; the
 * unit tests in the other story test files still run.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Easing } from "remotion";
import { describe, expect, it } from "vitest";
import * as anim from "../src/story/anim";
import * as camera from "../src/story/camera";
import * as choreo from "../src/story/choreography";
import * as layout from "../src/story/layout";
import * as path from "../src/story/path";
import * as rig from "../src/story/rig";
import * as timeline from "../src/story/timeline";

const OLD = resolve(process.env.OLD_BUILD ?? "../dt-old", "src").replace(/\\/g, "/");
const HAVE_OLD = existsSync(`${OLD}/config/timeline.ts`);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const load = async (p: string): Promise<Any> => (HAVE_OLD ? import(/* @vite-ignore */ `${OLD}/${p}`) : {});

const old: Record<string, Any> = {};
if (HAVE_OLD) {
  old.timeline = await load("config/timeline.ts");
  old.anim = await load("remotion/lib/anim.ts");
  old.path = await load("remotion/lib/path.ts");
  old.layout = await load("remotion/layout.ts");
  old.camera = await load("remotion/camera.ts");
  old.rig = await load("remotion/rig/motion.ts");
  old.meeting = await load("remotion/scenes/MeetingScene.tsx");
  old.wedding = await load("remotion/scenes/WeddingScene.tsx");
  old.garden = await load("remotion/components/GardenStage.tsx");
  old.mandap = await load("remotion/components/FloralMandap.tsx");
  old.petals = await load("remotion/components/FloatingPetals.tsx");
  old.dust = await load("remotion/components/GoldDust.tsx");
  old.garland = await load("remotion/components/Garland.tsx");
  old.couple = await load("remotion/components/WeddingCouple.tsx");
}

/** Deep comparison: numbers to 6 decimals, everything else exactly; failures name the path. */
const same = (a: unknown, b: unknown, where: string): void => {
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) || Number.isNaN(b)) expect(Number.isNaN(a) && Number.isNaN(b), where).toBe(true);
    else expect(a, where).toBeCloseTo(b, 6);
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    expect(a.length, `${where}.length`).toBe(b.length);
    a.forEach((v, i) => same(v, b[i], `${where}[${i}]`));
    return;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object).filter((k) => (a as Any)[k] !== undefined);
    const kb = Object.keys(b as object).filter((k) => (b as Any)[k] !== undefined);
    expect([...ka].sort(), `${where} keys`).toEqual([...kb].sort());
    for (const k of ka) same((a as Any)[k], (b as Any)[k], `${where}.${k}`);
    return;
  }
  expect(a, where).toEqual(b);
};

const range = (from: number, to: number, step: number) => {
  const out: number[] = [];
  for (let x = from; x <= to + 1e-9; x += step) out.push(x);
  return out;
};

describe.skipIf(!HAVE_OLD)("story parity with the old build", () => {
  it("timeline: every exported constant and function", () => {
    for (const key of Object.keys(old.timeline)) {
      const mine = (timeline as Any)[key];
      expect(mine, `timeline.${key} exists`).toBeDefined();
      if (typeof old.timeline[key] !== "function") same(mine, old.timeline[key], `timeline.${key}`);
    }
    for (const b of range(-5, 1600, 7.3)) {
      same(timeline.beatsToFrames(b), old.timeline.beatsToFrames(b), `beatsToFrames(${b})`);
      same(timeline.framesToBeats(b), old.timeline.framesToBeats(b), `framesToBeats(${b})`);
      same(timeline.framesToSeconds(b), old.timeline.framesToSeconds(b), "framesToSeconds");
      same(timeline.secondsToFrames(b), old.timeline.secondsToFrames(b), "secondsToFrames");
    }
    for (const f of range(-20, 3100, 1)) expect(timeline.sceneAt(f), `sceneAt(${f})`).toBe(old.timeline.sceneAt(f));
    for (const id of timeline.SCENE_ORDER) {
      expect(timeline.sceneDuration(id)).toBe(old.timeline.sceneDuration(id));
      expect(timeline.sceneLastFrame(id)).toBe(old.timeline.sceneLastFrame(id));
      expect(timeline.nextScene(id)).toBe(old.timeline.nextScene(id));
      expect(timeline.previousScene(id)).toBe(old.timeline.previousScene(id));
    }
  });

  it("anim: progress, ramp, keyframes, smoothKeyframes, easings, seeded", () => {
    const easings: [string, (t: number) => number, (t: number) => number][] = [
      ["easeOut", anim.easeOut, old.anim.easeOut],
      ["easeInOut", anim.easeInOut, old.anim.easeInOut],
      ["easeSoft", anim.easeSoft, old.anim.easeSoft],
      ["rise", anim.rise, Easing.bezier(0.42, 0, 0.1, 1)],
    ];
    for (const t of range(-0.2, 1.2, 0.0137)) for (const [n, mine, theirs] of easings) same(mine(t), theirs(t), `${n}(${t})`);
    const ranges: [number, number][] = [[0, 70], [30, 150], [250, 290], [436, 479], [0, 1], [0.82, 1]];
    for (const f of range(-10, 520, 1.37)) {
      for (const r of ranges) {
        same(anim.progress(f, r), old.anim.progress(f, r), `progress(${f},${r})`);
        same(anim.progress(f, r, (t) => t), old.anim.progress(f, r, (t: number) => t), `progress linear(${f},${r})`);
        same(anim.progress(f, r, anim.easeOut), old.anim.progress(f, r, old.anim.easeOut), "progress easeOut");
        same(anim.progress(f, r, anim.easeSoft), old.anim.progress(f, r, old.anim.easeSoft), "progress easeSoft");
        same(anim.ramp(f, r, 22, -22), old.anim.ramp(f, r, 22, -22), `ramp(${f},${r})`);
        same(anim.ramp(f, r, 3, 26, (t) => t), old.anim.ramp(f, r, 3, 26, (t: number) => t), "ramp linear");
      }
      const ins = [0, 40, 100, 220, 400];
      const outs = [0, 0.7, 0.8, 0.3, 1.2];
      same(anim.keyframes(f, ins, outs), old.anim.keyframes(f, ins, outs), `keyframes(${f})`);
      same(anim.smoothKeyframes(f, ins, outs), old.anim.smoothKeyframes(f, ins, outs), `smoothKeyframes(${f})`);
    }
    for (let s = -5; s < 400; s++) same(anim.seeded(s), old.anim.seeded(s), `seeded(${s})`);
    same(anim.lerp(3, 9, 0.3), old.anim.lerp(3, 9, 0.3), "lerp");
  });

  it("path: pathPoint, pathCenterline, pathHalfWidth, pathPolygon, constants", () => {
    for (const k of ["PATH_TOP_Y", "PATH_BOTTOM_Y", "MEET_Y", "LOTUS_BASE_Y", "PATH_T_LOTUS", "PATH_T_MEET"]) same((path as Any)[k], old.path[k], k);
    for (const t of range(0, 1, 0.01)) {
      same(path.pathPoint(t), old.path.pathPoint(t), `pathPoint(${t})`);
      for (const grow of [0, 0.3, 1]) same(path.pathHalfWidth(t, grow), old.path.pathHalfWidth(t, grow), "pathHalfWidth");
    }
    expect(path.pathCenterline()).toBe(old.path.pathCenterline());
    expect(path.pathCenterline(path.PATH_T_LOTUS, 1)).toBe(old.path.pathCenterline(old.path.PATH_T_LOTUS, 1));
    for (const grow of [0, 0.25, 0.5, 1]) {
      expect(path.pathPolygon(grow)).toBe(old.path.pathPolygon(grow));
      expect(path.pathPolygon(grow, -26)).toBe(old.path.pathPolygon(grow, -26));
    }
  });

  it("layout and camera", () => {
    for (const k of ["COUPLE", "GAZE_POINT", "CARD_EDGE_Y", "ORNAMENT_POS", "ORNAMENT_SCALE"]) same((layout as Any)[k], old.layout[k], k);
    same(layout.HOTSPOTS.lotus, old.layout.HOTSPOTS.lotus, "HOTSPOTS.lotus");
    same(layout.HOTSPOTS.path, old.layout.HOTSPOTS.path, "HOTSPOTS.path");
    same(layout.HOTSPOTS.ornament, old.layout.HOTSPOTS.ornament, "HOTSPOTS.ornament");
    same(layout.MANDAP, old.mandap.MANDAP, "MANDAP");
    same(layout.ARCH_BOX, old.mandap.ARCH_BOX, "ARCH_BOX");
    same(layout.ARCH_BOX_GATHERED, old.mandap.ARCH_BOX_GATHERED, "ARCH_BOX_GATHERED");
    same(layout.DIYA_BOX, old.mandap.DIYA_BOX, "DIYA_BOX");
    same(layout.GARLAND_BOX, old.wedding.GARLAND_BOX, "GARLAND_BOX");
    same(camera.CAMERA_FOCUS, old.camera.CAMERA_FOCUS, "CAMERA_FOCUS");
    for (const b of range(-10, 1550, 0.75)) {
      for (const reduced of [false, true]) same(camera.cameraZoom(b, reduced), old.camera.cameraZoom(b, reduced), `cameraZoom(${b},${reduced})`);
    }
  });

  const poses: rig.FigurePose[] = [
    { reduced: true },
    {},
    { walk: 3.7, moving: 0.8, vel: 2.1, t: 120.5, lean: 2, headTilt: 3, bow: 0.4 },
    { walk: 11, moving: 1, vel: -5, t: 33, arms: { l: { namaskar: 1 }, r: { face: 0.5, chest: 0.5 } } },
    { t: 250, arms: { l: { hold: 0.4, low: 0.4, aside: 0.4 }, r: { x: 30, y: -420 } } },
    { t: 7, arms: { l: { reach: { x: -20, y: -600 }, mix: 0.4, base: { namaskar: 1 } }, r: { reach: { x: 150, y: -300 }, mix: 1, base: { hold: 1 } } } },
    { t: 99, reduced: true, arms: { l: { reach: { x: 90, y: -430 }, mix: 0.7, base: { chest: 1 } }, r: { aside: 1 } } },
  ];

  it("rig: solveFigure over many poses, restArm, poseArm, blinkAt, pendulum, breathe, wind", () => {
    for (const who of ["groom", "bride"] as const) {
      same(rig.SKELETON[who], old.rig.SKELETON[who], `SKELETON.${who}`);
      for (const side of [1, -1] as const) same(rig.restArm(who, side), old.rig.restArm(who, side), "restArm");
      poses.forEach((p, i) => same(rig.solveFigure(who, p), old.rig.solveFigure(who, p), `solveFigure(${who}, pose ${i})`));
      for (let n = 0; n < 60; n++) {
        const w = { namaskar: (n % 7) / 6, face: (n % 5) / 8, chest: (n % 3) / 3, hold: (n % 11) / 11, low: (n % 4) / 6, aside: (n % 13) / 13 };
        for (const side of [1, -1] as const) same(rig.poseArm(who, side, w), old.rig.poseArm(who, side, w), `poseArm ${n}`);
        const q = { walk: n * 0.9, moving: (n % 5) / 4, vel: n - 30, t: n * 11.3, bow: (n % 6) / 5, headTilt: n - 30, arms: { l: w, r: w } };
        same(rig.solveFigure(who, q), old.rig.solveFigure(who, q), `solveFigure sweep ${who} ${n}`);
      }
      for (const seed of [3, 8]) for (let t = 0; t < 1500; t += 1.7) same(rig.blinkAt(t, seed), old.rig.blinkAt(t, seed), `blinkAt(${t},${seed})`);
    }
    for (let dt = -3; dt < 300; dt += 1.3) same(rig.pendulum(dt, 9), old.rig.pendulum(dt, 9), `pendulum(${dt})`);
    for (let t = 0; t < 600; t += 3.1) {
      same(rig.breathe(t), old.rig.breathe(t), "breathe");
      same(rig.wind(t, 2), old.rig.wind(t, 2), "wind");
    }
    same(rig.solveArm({ x: 54, y: -490 }, { x: 10, y: -450 }, 120, 110, { x: 62, y: -382 }), old.rig.solveArm({ x: 54, y: -490 }, { x: 10, y: -450 }, 120, 110, { x: 62, y: -382 }), "solveArm");
    same(rig.placeArm({ x: 54, y: -490 }, { x: 40, y: -430 }, { x: 11, y: -546 }, 120, 110), old.rig.placeArm({ x: 54, y: -490 }, { x: 40, y: -430 }, { x: 11, y: -546 }, 120, 110), "placeArm");
  });

  it("rig: figurePoints", () => {
    for (const who of ["groom", "bride"] as const) {
      poses.forEach((p, i) => {
        const props = { ...p, x: 415 + i * 13, y: 1500, scale: 0.84 };
        same(rig.figurePoints(who, props), old.couple.figurePoints(who, props), `figurePoints(${who}, ${i})`);
      });
    }
  });

  it("meetingPose at every beat of the scene, normal and reduced", () => {
    for (const reduced of [false, true]) {
      for (const f of range(-2, 332, 0.75)) same(choreo.meetingPose(f, reduced), old.meeting.meetingPose(f, reduced), `meetingPose(${f},${reduced})`);
    }
  });

  it("exchangeAt (poses, hands, garlands) at every beat of the wedding, normal and reduced", () => {
    for (const reduced of [false, true]) {
      for (const f of range(-1, 482, 0.5)) same(choreo.exchangeAt(f, reduced), old.wedding.exchangeAt(f, reduced), `exchangeAt(${f},${reduced})`);
    }
  });

  it("garden: gardenDrift and duskAt", () => {
    for (const b of range(0, 1100, 0.9)) {
      for (const reduced of [false, true]) same(choreo.gardenDrift(b, reduced), old.garden.gardenDrift(b, reduced), `gardenDrift(${b})`);
      same(choreo.duskAt(b), old.garden.duskAt(b), `duskAt(${b})`);
    }
  });

  // These are module-private in the old build; the reference below is its code verbatim (see remake/SPEC/story.md).
  const O = anim;
  const refPetalAt = (t: number) => {
    const e = old.anim.easeInOut(t);
    return {
      x: old.anim.lerp(-90, 540, e) + Math.sin(t * Math.PI * 2.4) * 130 * (1 - t),
      y: old.anim.lerp(560, 1545, old.anim.easeOut(t) * 0.55 + t * 0.45),
      rot: t * 540 - 40,
    };
  };
  const refPetalIntensity = (b: number) =>
    old.anim.keyframes(b, [260, 340, 550, 870, 910, 970, 1006, 1036], [0, 0.7, 0.8, 0.3, 1.2, 0.6, 0.2, 0]);
  const refDustIntensity = (b: number) => old.anim.keyframes(b, [20, 90, 240, 770, 900, 1050, 1250, 1499], [0, 0.55, 0.4, 0.45, 1, 0.5, 0.35, 0.12]);

  it("petalAt, petalIntensity, dustIntensity", () => {
    for (const t of range(0, 1, 0.01)) same(choreo.petalAt(t), refPetalAt(t), `petalAt(${t})`);
    for (const b of range(-5, 1510, 1.9)) {
      same(choreo.petalIntensity(b), refPetalIntensity(b), `petalIntensity(${b})`);
      same(choreo.dustIntensity(b), refDustIntensity(b), `dustIntensity(${b})`);
    }
    expect(O.progress(0, [0, 1])).toBe(0);
  });

  it("set-down betel leaves follow the old SetDownLeaves maths", () => {
    const ref = (f: number, reduced: boolean) => {
      const t = old.anim.progress(f, [222, 250], (u: number) => u);
      if (t <= 0) return [];
      const at = old.wedding.exchangeAt(221.5, reduced).pose.bride; // base pose before any garland override
      const P = old.couple.figurePoints("bride", at);
      const fall = t * t;
      return ([[P.handL, P.handAngL, -1], [P.handR, P.handAngR, 1]] as [Any, number, number][]).map(([h, ang, side]) => {
        const ex = 665 + side * 120 * 0.84;
        const ey = 1500 + 22;
        const sway = Math.sin(t * Math.PI * 3) * (1 - t);
        return {
          name: "paan",
          x: old.anim.lerp(h.x, ex, old.anim.easeOut(t)) + sway * 16,
          y: old.anim.lerp(h.y, ey, fall),
          rot: old.anim.lerp(ang + 90 + side * 6, side * 84, old.anim.easeOut(t)) + sway * 16,
          scale: 0.72 * 0.84,
          opacity: 1,
        };
      });
    };
    for (const reduced of [false, true]) {
      for (const f of range(200, 480, 1.1)) {
        const mine = choreo.setDownLeaves(f, reduced);
        const theirs = ref(f, reduced);
        if (theirs.length === 0) expect(mine.every((s) => s.opacity === 0), `hidden at ${f}`).toBe(true);
        else same(mine, theirs, `setDownLeaves(${f},${reduced})`);
      }
    }
  });

  it("sprite lists: arch, diyas, petals, dust, garlands", () => {
    for (const g of range(-0.1, 1.1, 0.013)) same(choreo.archSprites(g), old.mandap.archSprites(g), `archSprites(${g})`);
    for (const b of range(0, 1500, 11)) {
      const build = Math.min(1, b / 90);
      const lights = Math.min(1, b / 180);
      same(choreo.diyaSprites(build, lights, b), old.mandap.diyaSprites(build, lights, b), `diyaSprites(${b})`);
      for (const kind of ["mixed", "marigold"] as const) {
        const intensity = (b % 300) / 250;
        same(choreo.petalSprites({ beat: b, intensity, kind }), old.petals.petalSprites({ beat: b, intensity, kind }), `petalSprites(${b},${kind})`);
      }
      same(choreo.dustSprites({ beat: b, intensity: (b % 200) / 200 }), old.dust.dustSprites({ beat: b, intensity: (b % 200) / 200 }), `dustSprites(${b})`);
    }
    for (const f of range(0, 480, 3)) {
      const gl = old.wedding.exchangeAt(f, false).garlands;
      const theirs = gl.flatMap((g: Any) => old.garland.garlandSprites({ ...g, size: 22 * 0.84 }));
      same(choreo.garlandField(choreo.exchangeAt(f, false).garlands), theirs, `garlandField(${f})`);
    }
    const a = { x: 400, y: 900 };
    const b = { x: 650, y: 920 };
    for (const sag of [30, 80]) for (const swing of [-9, 0, 5]) same(choreo.strandPoints(a, b, sag, swing, 17), old.garland.strandPoints(a, b, sag, swing, 17), "strandPoints");
  });

  it("couplePose equals the old pose functions on either side of the boundary", () => {
    const M = timeline.SCENE_BEATS.meeting.start;
    const W = timeline.SCENE_BEATS.wedding.start;
    for (const reduced of [false, true]) {
      for (const g of range(M, W - 0.001, 1.5)) {
        const c = choreo.couplePose(g, reduced);
        const o = old.meeting.meetingPose(g - M, reduced);
        same(c.groom, o.groom, `groom @${g}`);
        same(c.bride, o.bride, `bride @${g}`);
        expect(c.front).toBe("bride");
      }
      // after the face blend (14 beats) it is the old exchange pose exactly
      for (const g of range(W + 14, timeline.SCENE_BEATS.wedding.end, 1.5)) {
        const c = choreo.couplePose(g, reduced);
        const o = old.wedding.exchangeAt(g - W, reduced);
        same(c.groom, o.pose.groom, `groom @${g}`);
        same(c.bride, o.pose.bride, `bride @${g}`);
        same(c.garlands, o.garlands, `garlands @${g}`);
        expect(c.front).toBe(g - W < 336 ? "bride" : "groom");
      }
      // inside the blend only faces and head turn differ from the old pose
      for (const g of range(W, W + 14, 1)) {
        const c = choreo.couplePose(g, reduced);
        const o = old.wedding.exchangeAt(g - W, reduced);
        same({ ...c.groom, face: 0, turn: 0 }, { ...o.pose.groom, face: 0, turn: 0 }, `groom body @${g}`);
        same({ ...c.bride, face: 0, turn: 0 }, { ...o.pose.bride, face: 0, turn: 0 }, `bride body @${g}`);
      }
    }
  });
});
