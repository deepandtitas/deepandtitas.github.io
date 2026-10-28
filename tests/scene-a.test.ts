import { describe, expect, it } from "vitest";
import { ART } from "../src/art/manifest";
import { t } from "../src/content/translations";
import { wedding, type WeddingDetails } from "../src/content/wedding";
import { I } from "../src/render/mat";
import type { DrawOp } from "../src/render/ops";
import type { OverlayItem } from "../src/render/overlay";
import { awakening } from "../src/scene/awakening";
import type { FrameContext, FrameOutput } from "../src/scene/frame";
import { invitationCard, invitationScene } from "../src/scene/invitation";
import { emblemOps } from "../src/scene/shapes/emblem";
import { pathLength } from "../src/scene/shapes/util";
import { headings } from "../src/scene/text";
import { BEATS, SCENE_BEATS, SCENE_OVERLAP, sceneDuration } from "../src/story/timeline";

const ctxFor = (lang: "bn" | "en", over: Partial<FrameContext> = {}): FrameContext => ({
  lang,
  text: t(lang),
  wedding: wedding as unknown as WeddingDetails,
  reducedMotion: false,
  interactive: true,
  guided: { enabled: false, awaiting: null },
  ...over,
});

/** Beats taken from the timeline: every range edge of the scene's BEATS, the scene bounds, and points outside. */
const sampleBeats = (scene: keyof typeof BEATS): number[] => {
  const edges = Object.values(BEATS[scene]).flatMap((r) => [r[0], (r[0] + r[1]) / 2, r[1]]);
  const dur = sceneDuration(scene);
  const out = [-dur, -1, 0, ...edges, dur, dur + SCENE_OVERLAP[scene], dur + SCENE_OVERLAP[scene] + 1, dur * 2];
  return [...new Set(out)].sort((a, b) => a - b);
};

const ids = (items: OverlayItem[]): string[] => items.map((i) => i.id);

const walk = (ops: DrawOp[], fn: (op: DrawOp) => void): void => {
  for (const op of ops) {
    fn(op);
    if (op.kind === "group") walk(op.ops, fn);
  }
};

const langs = ["bn", "en"] as const;

describe("scenes-a builders are pure", () => {
  for (const lang of langs) {
    const ctx = ctxFor(lang);
    it(`awakening ${lang}`, () => {
      for (const b of sampleBeats("awakening")) expect(awakening(b, ctx)).toEqual(awakening(b, ctx));
    });
    it(`headings ${lang}`, () => {
      for (const b of [0, 100, SCENE_BEATS.meeting.start + 60, SCENE_BEATS.wedding.start + 40, SCENE_BEATS.invitation.start]) {
        expect(headings(b, ctx)).toEqual(headings(b, ctx));
      }
    });
    it(`invitation ${lang}`, () => {
      for (const b of sampleBeats("invitation")) expect(invitationScene(b, ctx)).toEqual(invitationScene(b, ctx));
    });
  }
});

describe("overlay ids are the same on every frame", () => {
  for (const lang of langs) {
    for (const guided of [{ enabled: false, awaiting: null }, { enabled: true, awaiting: "awakening" as const }, { enabled: true, awaiting: "meeting" as const }]) {
      const ctx = ctxFor(lang, { guided });
      it(`awakening ${lang} ${guided.awaiting}`, () => {
        const ref = ids(awakening(0, ctx).overlay);
        expect(ref).toEqual(["aw-title", "aw-subtitle", "hotspot-awakening", "hotspot-meeting"]);
        for (const b of sampleBeats("awakening")) expect(ids(awakening(b, ctx).overlay)).toEqual(ref);
      });
    }
    const ctx = ctxFor(lang);
    it(`headings ${lang}`, () => {
      const ref = ids(headings(0, ctx).overlay);
      expect(ref).toEqual(["heading-opening", "heading-meeting", "heading-wedding"]);
      const total = SCENE_BEATS.invitation.end;
      for (const b of [-5, 0, ...sampleBeats("awakening"), ...sampleBeats("meeting").map((x) => x + SCENE_BEATS.meeting.start), ...sampleBeats("wedding").map((x) => x + SCENE_BEATS.wedding.start), total]) {
        expect(ids(headings(b, ctx).overlay)).toEqual(ref);
      }
    });
    it(`invitation scene ${lang}`, () => {
      const ref = ids(invitationScene(0, ctx).overlay);
      for (const b of sampleBeats("invitation")) expect(ids(invitationScene(b, ctx).overlay)).toEqual(ref);
    });
    it(`cards ${lang}: the two prefixes differ only by prefix`, () => {
      const w = invitationCard(0, { top: 1575, border: 0.4, idPrefix: "card-w", m: I, visible: true }, ctx);
      const i = invitationScene(BEATS.invitation.flourish[1], ctx);
      expect(ids(w.overlay).map((x) => x.replace(/^card-w-|^map-link-w$/, "X-"))).toEqual(ids(i.overlay).map((x) => x.replace(/^card-i-|^map-link-i$/, "X-")));
      const hidden = invitationCard(0, { top: 1575, border: 0, idPrefix: "card-w", m: I, visible: false }, ctx);
      expect(ids(hidden.overlay)).toEqual(ids(w.overlay));
      expect(hidden.draw).toEqual([]);
    });
  }
});

describe("awakening", () => {
  const ctx = ctxFor("bn");
  it("draws nothing outside its range, and fades out as one full-frame group", () => {
    expect(awakening(-1, ctx).draw).toEqual([]);
    expect(awakening(sceneDuration("awakening") + SCENE_OVERLAP.awakening, ctx).draw).toEqual([]);
    const mid = awakening(sceneDuration("awakening") + 30, ctx).draw;
    expect(mid).toHaveLength(1);
    expect(mid[0].kind).toBe("group");
  });
  it("shows a hotspot only when awaited and interactive", () => {
    const visible = (c: FrameContext, id: string): boolean => {
      const h = awakening(10, c).overlay.find((o) => o.id === id);
      return h?.kind === "hotspot" && h.visible;
    };
    expect(visible(ctxFor("bn", { guided: { enabled: true, awaiting: "awakening" } }), "hotspot-awakening")).toBe(true);
    expect(visible(ctxFor("bn", { guided: { enabled: true, awaiting: "awakening" }, interactive: false }), "hotspot-awakening")).toBe(false);
    expect(visible(ctxFor("bn", { guided: { enabled: true, awaiting: "meeting" } }), "hotspot-meeting")).toBe(true);
    expect(visible(ctxFor("bn"), "hotspot-awakening")).toBe(false);
  });
  it("reveals the title across its range", () => {
    const title = (b: number) => awakening(b, ctx).overlay.find((o) => o.id === "aw-title");
    const [a, z] = BEATS.awakening.namesReveal;
    expect(title(a - 1)).toMatchObject({ opacity: 0 });
    const mid = title((a + z) / 2);
    expect(mid?.kind === "text" && mid.reveal).toBeGreaterThan(0);
    expect(mid?.kind === "text" && mid.reveal).toBeLessThan(1);
    expect(title(z)).toMatchObject({ reveal: 1, opacity: 1 });
  });
});

describe("invitation card", () => {
  const last = BEATS.invitation.flourish[1] + 60;
  const textOf = (out: FrameOutput, id: string) => {
    const o = out.overlay.find((x) => x.id === id);
    if (!o || o.kind !== "text") throw new Error(`no text item ${id}`);
    return o;
  };

  it("shows every supplied field at the end", () => {
    for (const lang of langs) {
      const out = invitationScene(last, ctxFor(lang));
      for (const id of ["heading", "names", "message", "wedding-day", "wedding-when", "reception-day", "venue-name", "venue-note", "venue-address", "venue-landmark"]) {
        const o = textOf(out, `card-i-${id}`);
        expect(o.text, id).not.toBe("");
        expect(o.opacity, id).toBe(1);
      }
    }
  });

  it("hides blank wedding fields and invents nothing", () => {
    const blank: WeddingDetails = {
      ...(wedding as unknown as WeddingDetails),
      events: {
        wedding: { date: "2026-11-25", bengaliDate: "", time: { bn: "", en: "" } },
        reception: { date: "", bengaliDate: "", time: { bn: "", en: "" } },
      },
      venue: { name: { bn: "", en: "" }, note: { bn: "", en: "" }, address: { bn: "", en: "" }, landmark: { bn: "", en: "" } },
    };
    for (const lang of langs) {
      const out = invitationScene(last, ctxFor(lang, { wedding: blank }));
      for (const id of [
        "reception-label",
        "reception-day",
        "reception-bndate",
        "reception-when",
        "wedding-bndate",
        "venue-label",
        "venue-name",
        "venue-note",
        "venue-address",
        "venue-landmark",
      ]) {
        const o = textOf(out, `card-i-${id}`);
        expect(o.opacity, id).toBe(0);
        expect(o.text, id).toBe("");
      }
      expect(textOf(out, "card-i-wedding-day").opacity).toBe(1);
      // the lone event block is centred
      expect(textOf(out, "card-i-wedding-day").x).toBe(540);
    }
  });

  it("the map link opens wedding.mapUrl exactly, in both cards", () => {
    for (const lang of langs) {
      const ctx = ctxFor(lang);
      const i = invitationScene(last, ctx).overlay.find((o) => o.id === "map-link-i");
      const w = invitationCard(0, { top: 1575, border: 1, idPrefix: "card-w", m: I, visible: true }, ctx).overlay.find((o) => o.id === "map-link-w");
      for (const link of [i, w]) {
        expect(link?.kind).toBe("link");
        expect(link?.kind === "link" && link.href).toBe(wedding.mapUrl);
      }
      expect(i?.kind === "link" && i.visible).toBe(true);
    }
  });

  it("the names shimmer rises and settles", () => {
    const glow = (b: number) => {
      const o = textOf(invitationScene(b, ctxFor("bn")), "card-i-names");
      return o.glow ?? 0;
    };
    expect(glow(BEATS.invitation.flourish[0] + 10)).toBeGreaterThan(0.1);
    expect(glow(last + 200)).toBeCloseTo(0, 5);
  });

  it("the last frame is the fully drawn card", () => {
    const { draw } = invitationScene(last, ctxFor("bn"));
    expect(draw.length).toBeGreaterThan(20);
  });
});

describe("draw ops", () => {
  it("every image op names a manifest entry", () => {
    const seen = new Set<string>();
    for (const lang of langs) {
      const ctx = ctxFor(lang);
      const all = [
        ...sampleBeats("awakening").flatMap((b) => awakening(b, ctx).draw),
        ...sampleBeats("invitation").flatMap((b) => invitationScene(b, ctx).draw),
        ...emblemOps(540, 1545, 0.62, 0.5, I),
      ];
      walk(all, (op) => {
        if (op.kind === "image") seen.add(op.art);
      });
    }
    expect(seen.size).toBeGreaterThan(0);
    for (const art of seen) expect(Object.keys(ART)).toContain(art);
  });

  it("group opacity is used only for fades, with sane bounds", () => {
    const ctx = ctxFor("bn");
    for (const b of sampleBeats("awakening")) {
      walk(awakening(b, ctx).draw, (op) => {
        if (op.kind === "group") {
          expect(op.bounds.w).toBeGreaterThan(0);
          expect(op.bounds.h).toBeGreaterThan(0);
          expect(op.alpha).toBeGreaterThanOrEqual(0);
          expect(op.alpha).toBeLessThanOrEqual(1);
        }
      });
    }
  });

  it("headings fade and draw their rules", () => {
    const ctx = ctxFor("en");
    const mid = (BEATS.awakening.headingIn[0] + BEATS.awakening.headingIn[1]) / 2;
    const out = headings(mid + 40, ctx);
    expect(out.draw.length).toBe(2);
    expect(out.overlay.find((o) => o.id === "heading-opening")?.kind).toBe("text");
    expect(headings(SCENE_BEATS.invitation.start, ctx).draw).toEqual([]);
  });
});

describe("pathLength", () => {
  it("measures lines and arcs", () => {
    expect(pathLength("M0 0H100")).toBeCloseTo(100, 6);
    expect(pathLength("M10 10L13 14")).toBeCloseTo(5, 6);
    const r = 236;
    expect(pathLength(`M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`)).toBeCloseTo(2 * Math.PI * r, 0);
    expect(pathLength("M0 0Q50 0 100 0")).toBeCloseTo(100, 4);
    expect(pathLength("M0 0m10 0h5")).toBeCloseTo(5, 6);
  });
});
