/**
 * Scene 3, the sacred union, as ops. `weddingBack` is everything behind the couple (lamplight, the mandap, the arch,
 * the diyas, the glow of their first look); `weddingFront` is everything in front of them (garlands, the betel leaves
 * set down, the drifting petal that becomes the gold ornament, the edge of the invitation card) plus the ornament's
 * guided hotspot. The couple itself is drawn between the two by `couple`.
 */
import { ART, type ArtName } from "../art/manifest";
import { about, apply, I, mul, scale, translate, type Mat } from "../render/mat";
import type { DrawOp, Rect } from "../render/ops";
import type { OverlayItem } from "../render/overlay";
import {
  archSprites,
  closingAt,
  diyaSprites,
  exchangeAt,
  garlandField,
  mandapParts,
  setDownLeaves,
  weddingLight,
} from "../story/choreography";
import { lerp } from "../story/anim";
import { GAZE_GLOW, HOTSPOT_SIZE, MANDAP_GLOW, ORNAMENT_POS, ORNAMENT_SCALE } from "../story/layout";
import { SCENE_BEATS, sceneDuration, SCENE_OVERLAP } from "../story/timeline";
import type { FrameContext, FrameOutput } from "./frame";
import { invitationCard } from "./invitation";
import { emblemOps } from "./shapes/emblem";
import { MIN_ALPHA, spriteOp, spriteOps } from "./sprites";

/** Beats the wedding scene is on screen: its length plus the cross-fade into the invitation. */
const MOUNTED = sceneDuration("wedding") + SCENE_OVERLAP.wedding;

/** A soft gold disc: `radial-gradient(circle, …)` on a 2r box (farthest-corner radius r·√2), clipped to the disc. */
const glowDisc = (x: number, y: number, r: number, alpha: number, m: Mat): DrawOp[] =>
  alpha > MIN_ALPHA
    ? [
        {
          kind: "ellipse",
          cx: x,
          cy: y,
          rx: r,
          ry: r,
          m,
          alpha,
          fill: {
            radial: [x, y, 0, x, y, r * Math.SQRT2],
            stops: [
              [0, "rgba(249,226,160,.9)"],
              [0.45, "rgba(241,196,99,.35)"],
              [0.7, "rgba(241,196,99,0)"],
            ],
          },
        },
      ]
    : [];

const rectOf = (art: ArtName): Rect => {
  const a = ART[art];
  return { x: a.x, y: a.y, w: a.w, h: a.h };
};

/** An image revealed by sliding inside a clip of its own rectangle (so only a transform changes). */
const reveal = (art: ArtName, p: number, from: "bottom" | "top", cam: Mat): DrawOp[] => {
  if (p <= 0.001) return [];
  const r = rectOf(art);
  const off = (1 - p) * r.h * (from === "bottom" ? 1 : -1);
  return [{ kind: "image", art, m: mul(cam, translate(0, off)), alpha: 1, clip: { rect: r, m: cam } }];
};

/** The mandap built from baked parts: floor, dome, strings, valance, posts, banana leaves. */
const mandapStructure = (build: number, cam: Mat): DrawOp[] => {
  const p = mandapParts(build);
  const ops: DrawOp[] = [];
  if (p.floor > MIN_ALPHA) ops.push({ kind: "image", art: "mandap-floor", m: cam, alpha: p.floor });
  if (p.dome > MIN_ALPHA) {
    const a = ART["mandap-dome"];
    ops.push({ kind: "image", art: "mandap-dome", m: mul(cam, about(a.x + a.w / 2, a.y + a.h, scale(lerp(0.86, 1, p.dome)))), alpha: p.dome });
  }
  ops.push(...reveal("mandap-strings", p.strings, "top", cam));
  if (p.valance > MIN_ALPHA) {
    const a = ART["mandap-valance"];
    ops.push({ kind: "image", art: "mandap-valance", m: mul(cam, about(a.x + a.w / 2, a.y, scale(lerp(0.6, 1, p.valance), 1))), alpha: p.valance });
  }
  ops.push(...reveal("mandap-post-l", p.posts, "bottom", cam), ...reveal("mandap-post-r", p.posts, "bottom", cam));
  if (p.floor > MIN_ALPHA) {
    for (const art of ["mandap-leaves-l", "mandap-leaves-r"] as const) {
      const a = ART[art];
      ops.push({ kind: "image", art, m: mul(cam, about(a.x + a.w / 2, a.y + a.h, scale(lerp(0.7, 1, p.floor)))), alpha: p.floor });
    }
  }
  return ops;
};

/**
 * Behind the couple: the big lamplight glow, the mandap, the gathered arch, the diyas and the first-look glow.
 * @param beat SCENE-LOCAL beat (0 at the wedding's start); empty outside the scene
 * @param cam camera matrix (default identity)
 */
export const weddingBack = (beat: number, _ctx: FrameContext, cam: Mat = I): DrawOp[] => {
  if (beat < 0 || beat >= MOUNTED) return [];
  const w = weddingLight(beat);
  return [
    ...glowDisc(MANDAP_GLOW.x, MANDAP_GLOW.y, MANDAP_GLOW.r, w.glow, cam),
    ...mandapStructure(Math.round(w.build * 400) / 400, cam),
    ...spriteOps(archSprites(1), cam),
    ...spriteOps(diyaSprites(w.build, w.lights, beat + SCENE_BEATS.wedding.start), cam),
    ...glowDisc(GAZE_GLOW.x, GAZE_GLOW.y, GAZE_GLOW.r, w.meet, cam),
  ];
};

/**
 * In front of the couple: the garlands, the betel leaves set down, the drifting petal, the card's rising edge with the
 * gold ornament on it, and the ornament's guided hotspot (id `hotspot-invitation`; the card's ids are prefixed `card-w`).
 * @param beat SCENE-LOCAL beat; out of range nothing is drawn but every overlay id is still returned
 * @param cam camera matrix (default identity)
 */
export const weddingFront = (beat: number, ctx: FrameContext, cam: Mat = I): FrameOutput => {
  const mounted = beat >= 0 && beat < MOUNTED;
  const reduced = ctx.reducedMotion;
  const c = closingAt(mounted ? beat : 0, reduced);
  const showCard = mounted && c.cardVisible;
  const draw: DrawOp[] = [];
  if (mounted) {
    draw.push(...spriteOps(garlandField(exchangeAt(beat, reduced).garlands), cam));
    draw.push(...spriteOps(setDownLeaves(beat, reduced), cam));
    draw.push(spriteOp({ name: "petal-marigold", x: c.petal.x, y: c.petal.y, rot: c.petal.rot, scale: c.petalScale, opacity: c.petalOpacity }, cam));
  }
  const card = invitationCard(0, { top: c.cardTop, border: c.edge, idPrefix: "card-w", m: cam, visible: showCard }, ctx);
  if (showCard) {
    draw.push(...card.draw);
    draw.push(...emblemOps(ORNAMENT_POS.x, ORNAMENT_POS.y, ORNAMENT_SCALE * c.ornamentGrow, c.ornamentOpacity, cam));
  }
  const at = apply(cam, ORNAMENT_POS);
  const hotspot: OverlayItem = {
    kind: "hotspot",
    id: "hotspot-invitation",
    x: at.x,
    y: at.y,
    size: HOTSPOT_SIZE.ornament * cam[0],
    label: ctx.text.hintOrnament,
    ariaLabel: ctx.text.hintOrnament,
    labelPosition: "below",
    visible: mounted && ctx.interactive && ctx.guided.awaiting === "invitation",
    action: "invitation",
  };
  return { draw: draw.filter((op) => op.kind === "group" || op.alpha > MIN_ALPHA), overlay: [...card.overlay, hotspot] };
};
