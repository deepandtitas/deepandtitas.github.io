import { describe, expect, it } from "vitest";
import { weightedProgress, type LoadItem } from "../src/app/loader/preload";

const items: LoadItem[] = [
  { id: "a", kind: "image", src: "a.webp", weight: 100 },
  { id: "b", kind: "image", src: "b.webp", weight: 300 },
  { id: "music", kind: "audio", src: "m.mp3", weight: 600, optional: true },
];

describe("preloader progress", () => {
  it("weights progress by size", () => {
    expect(weightedProgress(items, new Map())).toBe(0);
    expect(weightedProgress(items, new Map([["a", 1]]))).toBeCloseTo(0.1);
    expect(
      weightedProgress(
        items,
        new Map([
          ["b", 1],
          ["music", 0.5],
        ]),
      ),
    ).toBeCloseTo(0.6);
    expect(
      weightedProgress(
        items,
        new Map([
          ["a", 1],
          ["b", 1],
          ["music", 1],
        ]),
      ),
    ).toBe(1);
  });

  it("clamps partial values and treats an empty list as done", () => {
    expect(weightedProgress(items, new Map([["a", 7]]))).toBeCloseTo(0.1);
    expect(weightedProgress([], new Map())).toBe(1);
  });
});
