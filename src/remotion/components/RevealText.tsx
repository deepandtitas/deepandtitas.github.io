import type { CSSProperties } from "react";
import { FONT_BN, FONT_EN } from "../fonts";
import { easeInOut, progress, type Range } from "../lib/anim";
import { useExperience } from "../experience";

interface Props {
  text: string;
  frame: number;
  /** Frames over which the light sweeps across the text. */
  range: Range;
  /** Frame at which it starts fading away (optional). */
  fadeOutAt?: number;
  fadeOutFor?: number;
  size: number;
  color: string;
  weight?: number;
  italicEn?: boolean;
  spacing?: string;
  style?: CSSProperties;
}

/** Text revealed as though by a travelling light: a soft-edged mask sweeps across while a gold glow fades. */
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
  spacing = "0.02em",
  style,
}: Props) => {
  const { lang } = useExperience();
  const p = progress(frame, range, easeInOut);
  const out = fadeOutAt === undefined ? 0 : progress(frame, [fadeOutAt, fadeOutAt + fadeOutFor]);
  const edge = p * 140;
  const mask = `linear-gradient(90deg, #000 ${edge - 40}%, transparent ${edge}%)`;
  const glowA = Math.max(0, 1 - Math.abs(p - 0.55) * 2.2);
  if (p <= 0 || out >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: lang === "bn" ? FONT_BN : FONT_EN,
        fontStyle: lang === "en" && italicEn ? "italic" : "normal",
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.25,
        letterSpacing: spacing,
        color,
        opacity: 1 - out,
        WebkitMaskImage: mask,
        maskImage: mask,
        textShadow: `0 0 ${24 + glowA * 28}px rgba(233,201,126,${(0.15 + glowA * 0.7).toFixed(2)})`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text}
    </div>
  );
};
