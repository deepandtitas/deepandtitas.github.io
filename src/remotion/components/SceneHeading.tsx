import { easeSoft, progress } from "../lib/anim";
import { useExperience } from "../experience";
import { BN_PAD, bnWeight, FONT_BN, FONT_EN } from "../fonts";

type Tone = "ink" | "light";

interface Props {
  text: string;
  /** Scene-local beat. */
  frame: number;
  /** Beat range during which it fades in. */
  fadeIn: readonly [number, number];
  /** Local beat at which it starts to fade out. */
  fadeOutAt: number;
  tone?: Tone;
  y?: number;
}

/** The scene title with gold rules either side, on a soft backing so it reads over any artwork. */
export const SceneHeading = ({ text, frame, fadeIn, fadeOutAt, tone = "ink", y = 196 }: Props) => {
  const { lang } = useExperience();
  const inP = progress(frame, fadeIn, easeSoft);
  const outP = progress(frame, [fadeOutAt, fadeOutAt + 28]);
  const o = inP * (1 - outP);
  if (o <= 0.002) return null;
  const bn = lang === "bn";
  const color = tone === "ink" ? "#781f2b" : "#fbefd6";
  const rule = tone === "ink" ? "#c49a52" : "#e3c27a";
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
        opacity: o,
        transform: `translateY(${((1 - inP) * 14).toFixed(2)}px)`,
      }}
    >
      <span style={{ width: 80, height: 3, background: `linear-gradient(90deg, transparent, ${rule})` }} />
      <span
        style={{
          fontFamily: bn ? FONT_BN : FONT_EN,
          fontWeight: bnWeight(lang, bn ? 500 : 600),
          fontSize: bn ? 64 : 44,
          lineHeight: 1.45,
          padding: `${BN_PAD} 0.2em`,
          letterSpacing: bn ? "0.01em" : "0.12em",
          textTransform: bn ? "none" : "uppercase",
          color,
          whiteSpace: "nowrap",
          textShadow: tone === "light" ? "0 2px 18px rgba(0,0,0,.55)" : "0 0 18px rgba(251,244,230,.9), 0 0 4px rgba(251,244,230,.9)",
        }}
      >
        {text}
      </span>
      <span style={{ width: 80, height: 3, background: `linear-gradient(270deg, transparent, ${rule})` }} />
    </div>
  );
};
