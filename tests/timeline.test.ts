import { describe, expect, it } from "vitest";
import {
  BEATS,
  COVER_FRAME,
  DURATION,
  FPS,
  HEIGHT,
  LAST_FRAME,
  SCENES,
  SCENE_ORDER,
  SCENE_OVERLAP,
  WIDTH,
  nextScene,
  previousScene,
  sceneAt,
  sceneDuration,
  sceneLastFrame,
} from "../src/config/timeline";

describe("timeline", () => {
  it("is a 1080×1920, 30 FPS, 1500-frame (50 s) composition", () => {
    expect(WIDTH).toBe(1080);
    expect(HEIGHT).toBe(1920);
    expect(FPS).toBe(30);
    expect(DURATION).toBe(1500);
    expect(DURATION / FPS).toBe(50);
  });

  it("handles the last frame index correctly", () => {
    expect(LAST_FRAME).toBe(1499);
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
    expect(SCENES.awakening).toEqual({ start: 0, end: 240 });
    expect(SCENES.meeting).toEqual({ start: 240, end: 570 });
    expect(SCENES.wedding).toEqual({ start: 570, end: 1050 });
    expect(SCENES.invitation).toEqual({ start: 1050, end: 1500 });
    expect(SCENE_ORDER.map((s) => sceneDuration(s) / FPS)).toEqual([8, 11, 16, 15]);
  });

  it("maps frames to scenes at every boundary", () => {
    expect(sceneAt(0)).toBe("awakening");
    expect(sceneAt(239)).toBe("awakening");
    expect(sceneAt(240)).toBe("meeting");
    expect(sceneAt(569)).toBe("meeting");
    expect(sceneAt(570)).toBe("wedding");
    expect(sceneAt(1049)).toBe("wedding");
    expect(sceneAt(1050)).toBe("invitation");
    expect(sceneAt(-5)).toBe("awakening");
  });

  it("exposes guided checkpoints one frame before each scene boundary", () => {
    expect(sceneLastFrame("awakening")).toBe(239);
    expect(sceneLastFrame("meeting")).toBe(569);
    expect(sceneLastFrame("wedding")).toBe(1049);
    expect(sceneLastFrame("invitation")).toBe(LAST_FRAME);
  });

  it("chains scenes in order", () => {
    expect(nextScene("awakening")).toBe("meeting");
    expect(nextScene("invitation")).toBeNull();
    expect(previousScene("meeting")).toBe("awakening");
    expect(previousScene("awakening")).toBeNull();
  });

  it("keeps every beat inside its own scene (relative frames)", () => {
    for (const id of SCENE_ORDER) {
      const len = sceneDuration(id);
      for (const [name, [a, b]] of Object.entries(BEATS[id])) {
        expect(a, `${id}.${name} start`).toBeGreaterThanOrEqual(0);
        expect(b, `${id}.${name} end`).toBeLessThanOrEqual(len);
        expect(b, `${id}.${name} order`).toBeGreaterThan(a);
      }
    }
  });

  it("uses a cover frame inside the awakening scene and overlaps that fit the timeline", () => {
    expect(sceneAt(COVER_FRAME)).toBe("awakening");
    expect(SCENES.wedding.end + SCENE_OVERLAP.wedding).toBeLessThanOrEqual(DURATION);
  });
});
