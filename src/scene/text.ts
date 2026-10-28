import { I } from "../render/mat";
import type { DrawOp } from "../render/ops";
import type { OverlayItem } from "../render/overlay";
import { textStyle } from "../render/textStyles";
import { easeSoft, progress, type Range } from "../story/anim";
import { BEATS, SCENE_BEATS, sceneDuration } from "../story/timeline";
import type { FrameContext, FrameOutput } from "./frame";
import { rgba } from "./shapes/util";

type Lang = FrameContext["lang"];
type HeadingKey = "opening" | "meeting" | "wedding";

/** Height of a text style's line box in px (font size × line height), the same numbers the overlay renders with. */
export const lineHeightOf = (style: string, lang: Lang): number => {
  const css = textStyle(style, lang);
  return Number(css.fontSize) * Number(css.lineHeight);
};

/**
 * Width in px of each heading's text box (text plus the 0.2em side padding), measured with the shipped fonts. The gold
 * rules sit 26 px either side of it, so they follow the text. Re-measure if a heading string or font changes.
 */
const HEADING_WIDTH: Record<Lang, Record<HeadingKey, number>> = {
  bn: { opening: 275.2, meeting: 507.05, wedding: 319.91 },
  en: { opening: 715.97, meeting: 627.27, wedding: 455.58 },
};

const TOP = 196;
const GAP = 26;
const RULE = { w: 80, h: 3 } as const;
const FADE_OUT = 28;
const RISE = 14;
/** The headings leave a few beats after their scene ends / before the scene's closing moves. */
const OPENING_LINGER = 4;
const MEETING_EARLY = 70;
const WEDDING_AFTER_TABLEAU = 20;

interface HeadingDef {
  key: HeadingKey;
  tone: "ink" | "light";
  /** Scene-local beat from the global beat. */
  local: (globalBeat: number) => number;
  fadeIn: Range;
  fadeOutAt: number;
}

const DEFS: readonly HeadingDef[] = [
  { key: "opening", tone: "ink", local: (b) => b, fadeIn: BEATS.awakening.headingIn, fadeOutAt: SCENE_BEATS.awakening.end + OPENING_LINGER },
  {
    key: "meeting",
    tone: "ink",
    local: (b) => b - SCENE_BEATS.meeting.start,
    fadeIn: BEATS.meeting.headingIn,
    fadeOutAt: sceneDuration("meeting") - MEETING_EARLY,
  },
  {
    key: "wedding",
    tone: "light",
    local: (b) => b - SCENE_BEATS.wedding.start,
    fadeIn: BEATS.wedding.headingIn,
    fadeOutAt: BEATS.wedding.tableau[0] + WEDDING_AFTER_TABLEAU,
  },
];

/**
 * The three scene headings. The words are overlay text; the gold rules either side are canvas ops, drawn with the
 * same fade and 14 px rise as the old SceneHeading. All three ids are always returned.
 */
export const headings = (globalBeat: number, ctx: FrameContext): FrameOutput => {
  const { lang, text } = ctx;
  const bn = lang === "bn";
  const size = bn ? 64 : 44;
  const boxH = size * (1.45 + 2 * 0.32);
  const draw: DrawOp[] = [];
  const overlay: OverlayItem[] = [];
  for (const def of DEFS) {
    const f = def.local(globalBeat);
    const inP = progress(f, def.fadeIn, easeSoft);
    const outP = progress(f, [def.fadeOutAt, def.fadeOutAt + FADE_OUT]);
    const o = inP * (1 - outP);
    const cy = TOP + boxH / 2 + (1 - inP) * RISE;
    overlay.push({
      kind: "text",
      id: `heading-${def.key}`,
      text: text[def.key],
      x: 540,
      y: cy,
      anchor: "center",
      style: def.tone === "ink" ? "heading-ink" : "heading-light",
      opacity: o > 0.002 ? o : 0,
    });
    if (o <= 0.002) continue;
    const colour = def.tone === "ink" ? "#c49a52" : "#e3c27a";
    const half = (RULE.w * 2 + GAP * 2 + HEADING_WIDTH[lang][def.key]) / 2;
    const left = 540 - half;
    const right = 540 + half - RULE.w;
    const y = cy - RULE.h / 2;
    draw.push({
      kind: "rect",
      rect: { x: left, y, w: RULE.w, h: RULE.h },
      m: I,
      alpha: o,
      fill: { linear: [left, 0, left + RULE.w, 0], stops: [[0, rgba(colour, 0)], [1, colour]] },
    });
    draw.push({
      kind: "rect",
      rect: { x: right, y, w: RULE.w, h: RULE.h },
      m: I,
      alpha: o,
      fill: { linear: [right, 0, right + RULE.w, 0], stops: [[0, colour], [1, rgba(colour, 0)]] },
    });
  }
  return { draw, overlay };
};
