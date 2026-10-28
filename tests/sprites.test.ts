import { describe, expect, it } from "vitest";
import { sceneDuration } from "../src/config/timeline";
import type { Box, SpriteState } from "../src/remotion/components/Art";
import { ARCH_BOX, ARCH_BOX_GATHERED, archSprites, DIYA_BOX, diyaSprites } from "../src/remotion/components/FloralMandap";
import { petalSprites } from "../src/remotion/components/FloatingPetals";
import { garlandSprites } from "../src/remotion/components/Garland";
import { dustSprites } from "../src/remotion/components/GoldDust";
import { exchangeAt, GARLAND_BOX } from "../src/remotion/scenes/WeddingScene";
import { COUPLE } from "../src/remotion/layout";

/**
 * Every visible sprite stays inside its canvas, with room for the flower itself (canvases clip). Canvas edges that lie
 * on the frame's own edges are not checked: the frame clips there anyway.
 */
const outside = (sprites: SpriteState[], box: Box, margin: number) =>
  sprites.filter(
    (s) =>
      (s.opacity ?? 1) > 0.002 &&
      ((box.x > 0 && s.x < box.x + margin) ||
        (box.x + box.w < 1080 && s.x > box.x + box.w - margin) ||
        (box.y > 0 && s.y < box.y + margin) ||
        (box.y + box.h < 1920 && s.y > box.y + box.h - margin)),
  );

const beats = (n: number, step = 0.5) => Array.from({ length: Math.floor(n / step) }, (_, i) => i * step);

describe("sprite fields", () => {
  it("never add or remove sprites mid-story (a fixed list; opacity hides them)", () => {
    const lengths = (fn: (b: number) => SpriteState[]) => new Set(beats(1500, 7).map((b) => fn(b).length));
    expect(lengths((b) => petalSprites({ beat: b, intensity: (b % 300) / 250 })).size).toBe(1);
    expect(lengths((b) => dustSprites({ beat: b, intensity: (b % 200) / 200 })).size).toBe(1);
    expect(lengths((b) => archSprites(Math.min(1, b / 600) - 0.2)).size).toBe(1);
    expect(lengths((b) => diyaSprites(b / 800, b / 900, b)).size).toBe(1);
    expect(lengths((b) => exchangeAt(b % sceneDuration("wedding"), false).garlands.flatMap((g) => garlandSprites({ ...g, size: 22 * COUPLE.scale }))).size).toBe(1);
  });

  it("keeps the garlands inside their canvas through the whole wedding", () => {
    for (const f of beats(sceneDuration("wedding"))) {
      const sprites = exchangeAt(f, false).garlands.flatMap((g) => garlandSprites({ ...g, size: 22 * COUPLE.scale }));
      expect(outside(sprites, GARLAND_BOX, 24), `beat ${f}`).toEqual([]);
    }
  });

  it("keeps the arch flowers and diyas inside their canvases", () => {
    for (let g = 0; g <= 1; g += 0.01) expect(outside(archSprites(g), ARCH_BOX, 24), `gather ${g}`).toEqual([]);
    expect(outside(archSprites(1), ARCH_BOX_GATHERED, 30)).toEqual([]);
    for (let t = 0; t < 400; t += 3) expect(outside(diyaSprites(1, 1, t), DIYA_BOX, 20)).toEqual([]);
  });
});
