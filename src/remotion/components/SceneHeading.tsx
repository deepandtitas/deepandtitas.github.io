import { easeSoft, progress } from "../lib/anim";
import { useExperience } from "../experience";
import { bnWeight, FONT_BN, FONT_EN } from "../fonts";

type Tone = "ink" | "light";

interface Props {
  text: string;
  /** Scene-local frame. */
  frame: number;
  /** Beat range during which it fades in. */
  fadeIn: readonly [number, number];
  /** Local frame at which it starts to fade out. */
  fadeOutAt: number;
  tone?: Tone;
  y?: number;
}

/** The scene title with gold rules either side. */
export const SceneHeading = ({ text, frame, fadeIn, fadeOutAt, tone = "ink", y = 250 }: Props) => {
  const { lang } = useExperience();
  const inP = progress(frame, fadeIn, easeSoft);
  const outP = progress(frame, [fadeOutAt, fadeOutAt + 28]);
  const o = inP * (1 - outP);
  if (o <= 0.002) return null;
  const color = tone === "ink" ? "#781f2b" : "#f8ecd2";
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
        gap: 30,
        opacity: o,
        transform: `translateY(${(1 - inP) * 14}px)`,
      }}
    >
      <span style={{ width: 80, height: 3, background: `linear-gradient(90deg, transparent, ${rule})` }} />
      <span
        style={{
          fontFamily: lang === "bn" ? FONT_BN : FONT_EN,
          fontWeight: bnWeight(lang, 600),
          fontSize: lang === "bn" ? 66 : 54,
          letterSpacing: lang === "bn" ? "0.03em" : "0.14em",
          textTransform: lang === "en" ? "uppercase" : "none",
          color,
          whiteSpace: "nowrap",
          textShadow: tone === "light" ? "0 2px 18px rgba(0,0,0,.45)" : "none",
        }}
      >
        {text}
      </span>
      <span style={{ width: 80, height: 3, background: `linear-gradient(270deg, transparent, ${rule})` }} />
    </div>
  );
};
