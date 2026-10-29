import { describe, expect, it } from "vitest";
import { BEATS, SCENE_BEATS, sceneDuration } from "../src/story/timeline";
import { ARCH_BOX, ARCH_BOX_GATHERED, COUPLE, DIYA_BOX, GARLAND_BOX } from "../src/story/layout";
import { ART } from "../src/art/manifest";
import { figurePoints } from "../src/story/rig";
import {
  EXCHANGE,
  LEAVES,
  SWAP,
  archSprites,
  basePose,
  couplePose,
  diyaSprites,
  dustSprites,
  exchangeAt,
  garlandField,
  petalSprites,
  setDownLeaves,
  type SpriteState,
} from "../src/story/choreography";

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const WED = sceneDuration("wedding");
const W0 = SCENE_BEATS.wedding.start;

/** How far each hand moves per 60 FPS frame through the whole wedding scene (composition px). */
const handSpeeds = () => {
  const step = 0.5; // beats per frame
  const out: { who: string; side: string; f: number; d: number }[][] = [];
  let prev = exchangeAt(0, false).pose;
  for (let f = step; f < WED; f += step) {
    const pose = exchangeAt(f, false).pose;
    const row: { who: string; side: string; f: number; d: number }[] = [];
    for (const who of ["groom", "bride"] as const) {
      const a = figurePoints(who, prev[who]);
      const b = figurePoints(who, pose[who]);
      row.push({ who, side: "left", f, d: dist(a.handL, b.handL) }, { who, side: "right", f, d: dist(a.handR, b.handR) });
    }
    out.push(row);
    prev = pose;
  }
  return out;
};

describe("wedding choreography", () => {
  const speeds = handSpeeds();

  it("never jumps a hand (e.g. when the betel leaves are let go or a garland is placed)", () => {
    for (let i = 1; i < speeds.length - 1; i++) {
      for (let k = 0; k < speeds[i].length; k++) {
        const { who, side, f, d } = speeds[i][k];
        const around = Math.max(speeds[i - 1][k].d, speeds[i + 1][k].d);
        expect(d > 4 && d > 2.5 * around, `${who} ${side} hand jumps ${d.toFixed(1)} px at beat ${f}`).toBe(false);
      }
    }
  });

  it("keeps every gesture unhurried", () => {
    const fastest = speeds.flat().reduce((m, s) => (s.d > m.d ? s : m));
    expect(fastest.d, `${fastest.who} ${fastest.side} hand at beat ${fastest.f}`).toBeLessThan(16);
  });
});

describe("couple across the meeting to wedding boundary", () => {
  const numbers = (o: unknown, path = ""): [string, number][] => {
    if (typeof o === "number") return [[path, o]];
    if (typeof o !== "object" || o === null) return [];
    return Object.entries(o).flatMap(([k, v]) => numbers(v, `${path}.${k}`));
  };

  it("has no jump in any pose number from one frame to the next", () => {
    const flat = (c: ReturnType<typeof couplePose>) => new Map([...numbers(c.groom, "groom"), ...numbers(c.bride, "bride")]);
    for (const reduced of [false, true]) {
      let prev = flat(couplePose(W0 - 20, reduced));
      for (let g = W0 - 19.5; g <= W0 + 40; g += 0.5) {
        const cur = flat(couplePose(g, reduced));
        for (const k of new Set([...prev.keys(), ...cur.keys()])) {
          // t advances 0.5 per step by design; the walk phase only matters while moving > 0 (it is 0 at both ends)
          if (k.endsWith(".t") || k.endsWith(".walk")) continue;
          // a key missing on one side is a pose weight / lean of zero
          expect(Math.abs((cur.get(k) ?? 0) - (prev.get(k) ?? 0)), `${k} at beat ${g}${reduced ? " (reduced)" : ""}`).toBeLessThan(3);
        }
        prev = cur;
      }
    }
  });

  it("is the same pose just before and just after the boundary", () => {
    const a = couplePose(W0 - 0.001, false);
    const b = couplePose(W0 + 0.001, false);
    for (const who of ["groom", "bride"] as const) {
      for (const k of ["x", "y", "scale", "turn", "paan", "bow", "headTilt", "moving", "vel"] as const) {
        const va = (a[who] as unknown as Record<string, unknown>)[k];
        const vb = (b[who] as unknown as Record<string, unknown>)[k];
        if (typeof va === "number" && typeof vb === "number") expect(Math.abs(va - vb), `${who}.${k}`).toBeLessThan(0.01);
      }
      for (const k of ["gaze", "look", "smile", "blush"] as const) {
        expect(Math.abs((a[who].face?.[k] ?? 0) - (b[who].face?.[k] ?? 0)), `${who} face.${k}`).toBeLessThan(0.01);
      }
      const pa = figurePoints(who, a[who]);
      const pb = figurePoints(who, b[who]);
      expect(dist(pa.handL, pb.handL)).toBeLessThan(0.2);
      expect(dist(pa.handR, pb.handR)).toBeLessThan(0.2);
    }
    expect(a.front).toBe(b.front);
  });

  it("puts the bride in front until the swap, then the groom", () => {
    expect(couplePose(W0 + SWAP - 0.5, false).front).toBe("bride");
    expect(couplePose(W0 + SWAP, false).front).toBe("groom");
    expect(couplePose(W0 - 50, false).front).toBe("bride");
  });
});

describe("ritual order", () => {
  it("has শুভদৃষ্টি (leaves opened, eyes meet) strictly before the মালাবদল (garlands appear)", () => {
    expect(LEAVES.open[1]).toBeLessThan(EXCHANGE.appear[0]);
    expect(LEAVES.release[1]).toBeLessThanOrEqual(EXCHANGE.appear[0]);
    const eyesMet = LEAVES.open[1] + 6;
    expect(exchangeAt(eyesMet, false).garlands.every((g) => g.opacity === 0)).toBe(true);
    expect(basePose(eyesMet, false).bride.turn).toBeCloseTo(-0.9, 2);
    let first = -1;
    for (let f = 0; f < WED; f += 0.5) {
      if (exchangeAt(f, false).garlands.some((g) => g.opacity > 0.002)) {
        first = f;
        break;
      }
    }
    expect(first).toBeGreaterThan(LEAVES.open[1]);
    expect(first).toBeGreaterThanOrEqual(BEATS.wedding.shubhodrishti[1]);
  });

  it("has the bride garland the groom first", () => {
    expect(EXCHANGE.bride.settle[1]).toBeLessThan(EXCHANGE.groom.settle[0]);
    // a garland is "placed" once both its ends sit on the receiver's neck points
    const placedAt = (idx: number) => {
      const receiver = idx === 0 ? "groom" : "bride";
      for (let f = 0; f < WED; f += 0.5) {
        const ex = exchangeAt(f, false);
        const R = figurePoints(receiver, ex.pose[receiver]);
        if (dist(ex.garlands[idx].a, R.neckL) < 0.01 && dist(ex.garlands[idx].b, R.neckR) < 0.01) return f;
      }
      return Infinity;
    };
    expect(placedAt(0)).toBeLessThan(placedAt(1));
    expect(placedAt(0)).toBeLessThan(Infinity);
    expect(placedAt(1)).toBeLessThan(Infinity);
  });

  it("holds the betel leaves, lowers them, releases them, and they rest on the floor, in that order", () => {
    const size = (f: number) => basePose(f, false).bride.paan;
    const handY = (f: number) => figurePoints("bride", basePose(f, false).bride).handL.y;
    // held until the release, nothing set down yet
    expect(size(LEAVES.release[0] - 1)).toBeGreaterThan(0.5);
    expect(setDownLeaves(LEAVES.release[0] - 1, false).every((s) => s.opacity === 0)).toBe(true);
    // raised to her face (smaller y), then lowered aside
    expect(handY(LEAVES.raise[1])).toBeLessThan(handY(10));
    expect(handY(LEAVES.open[1])).toBeGreaterThan(handY(LEAVES.raise[1]));
    // released: her hands carry nothing, the free leaves fall
    expect(size(LEAVES.release[0])).toBe(0);
    const falling = setDownLeaves(LEAVES.release[0] + 10, false);
    expect(falling.every((s) => (s.opacity ?? 0) > 0)).toBe(true);
    expect(falling[0].y).toBeLessThan(COUPLE.y + 22);
    // resting on the floor beside her, and staying put
    const floorA = setDownLeaves(LEAVES.release[1], false);
    const floorB = setDownLeaves(WED - 1, false);
    floorA.forEach((s, i) => {
      expect(s.x).toBeCloseTo(floorB[i].x, 6);
      expect(s.y).toBeCloseTo(floorB[i].y, 6);
      expect(s.y).toBeCloseTo(COUPLE.y + 22, 6);
    });
    expect(floorA[0].x).toBeLessThan(COUPLE.brideX);
    expect(floorA[1].x).toBeGreaterThan(COUPLE.brideX);
  });
});

/**
 * Every visible sprite stays inside its canvas, with room for the flower itself (canvases clip). Canvas edges that lie
 * on the frame's own edges are not checked: the frame clips there anyway.
 */
type Box = { x: number; y: number; w: number; h: number };
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
    expect(lengths((b) => garlandField(exchangeAt(b % WED, false).garlands)).size).toBe(1);
    expect(lengths((b) => setDownLeaves(b % WED, false)).size).toBe(1);
    expect(archSprites(0)).toHaveLength(34);
    expect(diyaSprites(1, 1, 0)).toHaveLength(24);
    expect(petalSprites({ beat: 0, intensity: 1 })).toHaveLength(20);
    expect(dustSprites({ beat: 0, intensity: 1 })).toHaveLength(16);
    expect(garlandField(exchangeAt(0, false).garlands)).toHaveLength(34);
  });

  it("keeps the garlands inside their canvas through the whole wedding", () => {
    for (const f of beats(WED)) {
      expect(outside(garlandField(exchangeAt(f, false).garlands), GARLAND_BOX, 24), `beat ${f}`).toEqual([]);
    }
  });

  it("keeps the arch flowers and diyas inside their canvases", () => {
    for (let g = 0; g <= 1; g += 0.01) expect(outside(archSprites(g), ARCH_BOX, 24), `gather ${g}`).toEqual([]);
    expect(outside(archSprites(1), ARCH_BOX_GATHERED, 30)).toEqual([]);
    for (let t = 0; t < 400; t += 3) expect(outside(diyaSprites(1, 1, t), DIYA_BOX, 20)).toEqual([]);
  });

  it("only names art that exists in the manifest", () => {
    const all: SpriteState[] = [
      ...archSprites(0.5),
      ...diyaSprites(1, 1, 0),
      ...petalSprites({ beat: 100, intensity: 1, kind: "mixed" }),
      ...petalSprites({ beat: 100, intensity: 1, kind: "marigold" }),
      ...dustSprites({ beat: 100, intensity: 1 }),
      ...garlandField(exchangeAt(0, false).garlands),
      ...setDownLeaves(240, false),
    ];
    for (const s of all) expect(Object.keys(ART), s.name).toContain(s.name);
  });
});

describe("card hand-over", () => {
  it("keeps the wedding's card on screen on every frame until the invitation scene starts (no empty frame)", async () => {
    const { closingAt } = await import("../src/story/choreography");
    const end = sceneDuration("wedding");
    // every 60 FPS frame (half beat) from the card's first full frame to the invitation scene's first frame
    for (let f = BEATS.wedding.cardEdge[0] + 1; f < end; f += 0.5) expect(closingAt(f, false).cardVisible, `beat ${f}`).toBe(true);
    expect(closingAt(end, false).cardVisible).toBe(false);
  });
});
