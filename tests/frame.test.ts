import { describe, expect, it } from "vitest";
import { ART } from "../src/art/manifest";
import { t } from "../src/content/translations";
import { wedding } from "../src/content/wedding";
import { ALL_ART, describeFrame, type FrameContext } from "../src/scene/frame";
import type { DrawOp } from "../src/render/ops";
import { EXCHANGE, LEAVES } from "../src/story/choreography";
import { LAST_FRAME, SCENE_BEATS, SCENE_OVERLAP, SCENES, beatsToFrames } from "../src/story/timeline";

const ctxOf = (lang: "bn" | "en", reducedMotion: boolean, awaiting: FrameContext["guided"]["awaiting"] = null): FrameContext => ({
  lang,
  text: t(lang),
  wedding,
  reducedMotion,
  interactive: true,
  guided: { enabled: awaiting !== null, awaiting },
});

/** Every op, with group children flattened in. */
const flat = (ops: readonly DrawOp[]): DrawOp[] => ops.flatMap((o) => (o.kind === "group" ? [o, ...flat(o.ops)] : [o]));

const frames = (step: number, from = 0, to = LAST_FRAME): number[] => {
  const out: number[] = [];
  for (let f = from; f <= to; f += step) out.push(f);
  if (out[out.length - 1] !== to) out.push(to);
  return out;
};

const W0 = beatsToFrames(SCENE_BEATS.wedding.start);
const COUPLE_FIRST = beatsToFrames(SCENE_BEATS.meeting.start);
const COUPLE_LAST = beatsToFrames(SCENE_BEATS.wedding.end + SCENE_OVERLAP.wedding) - 1;
const variants = [
  ["bn", false],
  ["en", false],
  ["bn", true],
  ["en", true],
] as const;

const SHADOW = "rgba(48,37,31,.32)";
const shadows = (ops: readonly DrawOp[]) =>
  flat(ops).filter((o) => o.kind === "ellipse" && typeof o.fill === "object" && "radial" in o.fill && o.fill.stops[0][1] === SHADOW);

describe("describeFrame", () => {
  it("is pure: the same frame gives the same output twice, in every language and motion mode", () => {
    for (const [lang, reduced] of variants) {
      const ctx = ctxOf(lang, reduced);
      for (const f of frames(61)) {
        const a = describeFrame(f, ctx);
        // a second, unrelated call in between must not matter
        describeFrame((f + 700) % 3000, ctx);
        expect(JSON.stringify(describeFrame(f, ctx))).toBe(JSON.stringify(a));
      }
    }
  });

  it("returns the same overlay ids on every 10th frame", () => {
    const ids = (f: number, ctx: FrameContext) => describeFrame(f, ctx).overlay.map((o) => o.id);
    for (const ctx of [ctxOf("bn", false), ctxOf("en", true), ctxOf("bn", false, "wedding"), ctxOf("bn", false, "invitation")]) {
      const first = ids(0, ctx);
      expect(new Set(first).size).toBe(first.length);
      for (const f of frames(10)) expect(ids(f, ctx)).toEqual(first);
    }
    const first = ids(0, ctxOf("bn", false));
    expect(first).toContain("hotspot-wedding");
    expect(first).toContain("hotspot-invitation");
    expect(first.some((id) => id.startsWith("card-w"))).toBe(true);
  });

  it("only draws images that are in ALL_ART and in the art manifest", () => {
    expect(new Set(ALL_ART).size).toBe(ALL_ART.length);
    for (const art of ALL_ART) expect(ART[art]).toBeDefined();
    for (const [lang, reduced] of variants) {
      for (const f of frames(37)) {
        for (const op of flat(describeFrame(f, ctxOf(lang, reduced)).draw)) {
          if (op.kind === "image") {
            expect(ALL_ART).toContain(op.art);
            expect(ART[op.art]).toBeDefined();
          }
        }
      }
    }
  });

  it("draws one pair of figures, one shadow each, from the meeting's start to the wedding's end", () => {
    for (const reduced of [false, true]) {
      const ctx = ctxOf("bn", reduced);
      // reduced motion fades them in over the meeting's first 100 beats (nothing to draw while fully transparent)
      const first = reduced ? COUPLE_FIRST + beatsToFrames(70) : COUPLE_FIRST;
      for (const f of [...frames(29, first, COUPLE_LAST), first, W0 - 1, W0, W0 + 1, COUPLE_LAST]) {
        const { draw } = describeFrame(f, ctx);
        expect(shadows(draw), `frame ${f}`).toHaveLength(2);
        const heads = flat(draw).filter((o) => o.kind === "image" && (o.art === "groom-head" || o.art === "bride-head"));
        expect(heads, `frame ${f}`).toHaveLength(2);
      }
    }
    // and none outside
    expect(shadows(describeFrame(COUPLE_FIRST - 1, ctxOf("bn", false)).draw)).toHaveLength(0);
    expect(shadows(describeFrame(COUPLE_LAST + 1, ctxOf("bn", false)).draw)).toHaveLength(0);
  });

  it("draws the front figure last (bride until the garland swap, then groom)", () => {
    const order = (f: number) =>
      flat(describeFrame(f, ctxOf("bn", false)).draw)
        .filter((o) => o.kind === "image" && (o.art === "groom-head" || o.art === "bride-head"))
        .map((o) => (o.kind === "image" ? o.art : ""));
    expect(order(W0 + beatsToFrames(100))).toEqual(["groom-head", "bride-head"]);
    expect(order(W0 + beatsToFrames(360))).toEqual(["bride-head", "groom-head"]);
  });

  it("keeps the ritual order: the garlands only appear after the leaves are released", () => {
    const ctx = ctxOf("bn", false);
    const releaseEnd = W0 + beatsToFrames(LEAVES.release[1]);
    const appear = W0 + beatsToFrames(EXCHANGE.appear[0]);
    expect(releaseEnd).toBeLessThanOrEqual(appear);
    for (const f of frames(7, COUPLE_FIRST, SCENES.invitation.start + 100)) {
      const ops = flat(describeFrame(f, ctx).draw);
      const roses = ops.filter((o) => o.kind === "image" && o.art === "rose").length; // only garlands use roses
      const leaves = ops.filter((o) => o.kind === "image" && o.art === "paan").length;
      if (f < releaseEnd) expect(roses, `frame ${f}`).toBe(0);
      if (f > appear + 2) expect(roses, `frame ${f}`).toBeGreaterThan(0);
      // two betel leaves at all times: in her hands, then set down (never both, never none)
      if (f >= COUPLE_FIRST + 40 && f <= COUPLE_LAST) expect(leaves, `frame ${f}`).toBe(2);
    }
  });

  it("never emits an op that would be skipped (alpha ≤ 0.002)", () => {
    for (const [lang, reduced] of variants) {
      for (const f of frames(23)) {
        for (const op of flat(describeFrame(f, ctxOf(lang, reduced)).draw)) {
          expect(op.alpha, `frame ${f} ${op.kind}`).toBeGreaterThan(0.002);
        }
      }
    }
  });

  it("shows the guided hotspots only in their own scene and only while awaited", () => {
    const vis = (f: number, awaiting: FrameContext["guided"]["awaiting"], id: string) => {
      const item = describeFrame(f, ctxOf("bn", false, awaiting)).overlay.find((o) => o.id === id);
      return item?.kind === "hotspot" && item.visible;
    };
    const mid = beatsToFrames(SCENE_BEATS.meeting.start + 300);
    expect(vis(mid, "wedding", "hotspot-wedding")).toBe(true);
    expect(vis(mid, null, "hotspot-wedding")).toBe(false);
    expect(vis(mid, "invitation", "hotspot-invitation")).toBe(false);
    const late = beatsToFrames(SCENE_BEATS.wedding.start + 470);
    expect(vis(late, "invitation", "hotspot-invitation")).toBe(true);
    expect(vis(late, "wedding", "hotspot-wedding")).toBe(false);
    // renders have no hotspots
    const render = { ...ctxOf("bn", false, "wedding"), interactive: false };
    const item = describeFrame(mid, render).overlay.find((o) => o.id === "hotspot-wedding");
    expect(item?.kind === "hotspot" && item.visible).toBe(false);
  });

  it("starts with the paper and ends with the atmosphere over it", () => {
    const { draw } = describeFrame(beatsToFrames(SCENE_BEATS.wedding.start + 330), ctxOf("bn", false));
    expect(draw[0]).toMatchObject({ kind: "image", art: "paper" });
    const last = draw[draw.length - 1];
    expect(last.kind).toBe("image");
    // reduced motion has no atmosphere
    const reduced = describeFrame(beatsToFrames(SCENE_BEATS.wedding.start + 330), ctxOf("bn", true)).draw;
    expect(reduced.some((o) => o.kind === "image" && o.art.startsWith("petal"))).toBe(false);
  });
});
