import type { CSSProperties } from "react";
import { BN_PAD, bnWeight, DISPLAY_WEIGHT, FONT_BN, FONT_BN_DISPLAY, FONT_EN } from "../fonts";
import { easeInOut, progress, type Range } from "../lib/anim";
import { useExperience } from "../experience";

interface Props {
  text: string;
  /** Scene-local beat. */
  frame: number;
  /** Beats over which the light sweeps across the text. */
  range: Range;
  /** Beat at which it starts fading away (optional). */
  fadeOutAt?: number;
  fadeOutFor?: number;
  size: number;
  color: string;
  weight?: number;
  italicEn?: boolean;
  /** Use the flowing display script for Bengali (the couple's names). */
  display?: boolean;
  spacing?: string;
  style?: CSSProperties;
}

/**
 * Text revealed as though by a travelling light: a clip wipes across (no mask, so nothing is re-composited and tall
 * Bengali glyphs are never cut — the box is padded well beyond the line), and a gold glow rides the edge.
 */
export const RevealText = ({
  text,
  frame,
  range,
  fadeOutAt,
  fadeOutFor = 24,
  size,
  color,
  weight = 600,
  italicEn = false,
  display = false,
  spacing = "0.02em",
  style,
}: Props) => {
  const { lang } = useExperience();
  const p = progress(frame, range, easeInOut);
  const out = fadeOutAt === undefined ? 0 : progress(frame, [fadeOutAt, fadeOutAt + fadeOutFor]);
  if (p <= 0 || out >= 1) return null;
  const bn = lang === "bn";
  const edge = p * 120 - 10; // % of the width revealed
  const glowA = Math.max(0, 1 - Math.abs(p - 0.55) * 2.2);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: bn ? (display ? FONT_BN_DISPLAY : FONT_BN) : FONT_EN,
        fontStyle: !bn && italicEn ? "italic" : "normal",
        fontWeight: bn && display ? DISPLAY_WEIGHT : bnWeight(lang, weight),
        fontSize: size,
        lineHeight: 1.3,
        padding: `${BN_PAD} 0`,
        marginTop: `-${BN_PAD}`,
        letterSpacing: spacing,
        color,
        opacity: 1 - out,
        clipPath: p >= 1 ? undefined : `inset(-20% ${Math.max(0, 100 - edge).toFixed(2)}% -20% 0)`,
        textShadow: `0 0 ${(24 + glowA * 28).toFixed(1)}px rgba(233,201,126,${(0.15 + glowA * 0.7).toFixed(2)})`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text}
    </div>
  );
};
