import { describe, expect, it } from "vitest";
import {
  BEATS,
  BEAT_FPS,
  COVER_FRAME,
  DURATION,
  FPS,
  FRAMES_PER_BEAT,
  HEIGHT,
  LAST_FRAME,
  SCENES,
  SCENE_BEATS,
  SCENE_ORDER,
  SCENE_OVERLAP,
  WIDTH,
  beatsToFrames,
  framesToBeats,
  nextScene,
  previousScene,
  sceneAt,
  sceneDuration,
  sceneLastFrame,
} from "../src/story/timeline";

describe("timeline", () => {
  it("is a 1080×1920, 60 FPS, 3000-frame (50 s) composition authored in 30-per-second beats", () => {
    expect(WIDTH).toBe(1080);
    expect(HEIGHT).toBe(1920);
    expect(FPS).toBe(60);
    expect(BEAT_FPS).toBe(30);
    expect(FRAMES_PER_BEAT).toBe(2);
    expect(DURATION).toBe(3000);
    expect(DURATION / FPS).toBe(50);
  });

  it("converts beats and frames both ways", () => {
    expect(beatsToFrames(240)).toBe(480);
    expect(framesToBeats(481)).toBe(240.5);
    expect(beatsToFrames(framesToBeats(1234))).toBe(1234);
  });

  it("handles the last frame index correctly", () => {
    expect(LAST_FRAME).toBe(2999);
    expect(sceneAt(LAST_FRAME)).toBe("invitation");
    expect(sceneAt(DURATION)).toBe("invitation"); // clamped, never out of range
  });

  it("has contiguous scenes that tile the whole timeline", () => {
    expect(SCENES[SCENE_ORDER[0]].start).toBe(0);
    for (let i = 1; i < SCENE_ORDER.length; i++) {
      expect(SCENES[SCENE_ORDER[i]].start).toBe(SCENES[SCENE_ORDER[i - 1]].end);
    }
    expect(SCENES[SCENE_ORDER[SCENE_ORDER.length - 1]].end).toBe(DURATION);
  });

  it("matches the storyboard (0–8 s, 8–19 s, 19–35 s, 35–50 s)", () => {
    expect(SCENE_BEATS.awakening).toEqual({ start: 0, end: 240 });
    expect(SCENES.meeting).toEqual({ start: 480, end: 1140 });
    expect(SCENES.wedding).toEqual({ start: 1140, end: 2100 });
    expect(SCENES.invitation).toEqual({ start: 2100, end: 3000 });
    expect(SCENE_ORDER.map((s) => sceneDuration(s) / BEAT_FPS)).toEqual([8, 11, 16, 15]);
  });

  it("maps frames to scenes at every boundary", () => {
    expect(sceneAt(0)).toBe("awakening");
    expect(sceneAt(479)).toBe("awakening");
    expect(sceneAt(480)).toBe("meeting");
    expect(sceneAt(1139)).toBe("meeting");
    expect(sceneAt(1140)).toBe("wedding");
    expect(sceneAt(2099)).toBe("wedding");
    expect(sceneAt(2100)).toBe("invitation");
    expect(sceneAt(-5)).toBe("awakening");
  });

  it("exposes guided checkpoints one frame before each scene boundary", () => {
    expect(sceneLastFrame("awakening")).toBe(479);
    expect(sceneLastFrame("meeting")).toBe(1139);
    expect(sceneLastFrame("wedding")).toBe(2099);
    expect(sceneLastFrame("invitation")).toBe(LAST_FRAME);
  });

  it("chains scenes in order", () => {
    expect(nextScene("awakening")).toBe("meeting");
    expect(nextScene("invitation")).toBeNull();
    expect(previousScene("meeting")).toBe("awakening");
    expect(previousScene("awakening")).toBeNull();
  });

  it("keeps every beat inside its own scene (relative beats)", () => {
    for (const id of SCENE_ORDER) {
      const len = sceneDuration(id);
      for (const [name, [a, b]] of Object.entries(BEATS[id])) {
        expect(a, `${id}.${name} start`).toBeGreaterThanOrEqual(0);
        expect(b, `${id}.${name} end`).toBeLessThanOrEqual(len);
        expect(b, `${id}.${name} order`).toBeGreaterThan(a);
      }
    }
  });

  it("gathers the arch flowers only after the couple have greeted", () => {
    expect(BEATS.meeting.flowersGather[0]).toBeGreaterThanOrEqual(BEATS.meeting.meetPause[1]);
  });

  it("keeps শুভদৃষ্টি before মালাবদল", () => {
    expect(BEATS.wedding.shubhodrishti[1]).toBeLessThanOrEqual(BEATS.wedding.garlands[0] + 2);
  });

  it("uses a cover frame inside the awakening scene and overlaps that fit the timeline", () => {
    expect(sceneAt(COVER_FRAME)).toBe("awakening");
    expect(SCENE_BEATS.wedding.end + SCENE_OVERLAP.wedding).toBeLessThanOrEqual(SCENE_BEATS.invitation.end);
  });
});
