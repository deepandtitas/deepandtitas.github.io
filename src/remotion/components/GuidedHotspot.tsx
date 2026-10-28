import type { SyntheticEvent } from "react";
import { FONT_BN_UI, FONT_EN } from "../fonts";
import { useExperience } from "../experience";

interface Props {
  x: number;
  y: number;
  size?: number;
  label: string;
  ariaLabel: string;
  /** Where the visible text hint sits relative to the ring. */
  labelPosition?: "above" | "below";
  onActivate: (e: SyntheticEvent) => void;
}

const CSS = `
@keyframes hs-pulse { 0% { transform: scale(.72); opacity: .95 } 100% { transform: scale(1.18); opacity: 0 } }
.hs-ring { animation: hs-pulse 2.2s ease-out infinite }
.hs-btn:focus-visible { outline: 6px solid #f8ecd2; outline-offset: 6px }
.hs-btn:hover .hs-core { background: rgba(255,244,214,.34) }
@media (prefers-reduced-motion: reduce) { .hs-ring { animation: none; opacity: .6 } }
`;

/**
 * A real, keyboard-focusable button placed in composition space (1080×1920) so it stays glued to the artwork.
 * A visible text hint (not just a pulse) says what it does.
 */
export const GuidedHotspot = ({
  x,
  y,
  size = 330,
  label,
  ariaLabel,
  labelPosition = "below",
  onActivate,
}: Props) => {
  const { lang } = useExperience();
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        pointerEvents: "auto",
      }}
    >
      <style>{CSS}</style>
      <button
        type="button"
        className="hs-btn"
        aria-label={ariaLabel}
        onClick={onActivate}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span
          className="hs-ring"
          style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "5px solid #c49a52" }}
        />
        <span
          className="hs-core"
          style={{
            position: "absolute",
            inset: size * 0.22,
            borderRadius: "50%",
            border: "4px solid #f8ecd2",
            background: "rgba(255,244,214,.18)",
            boxShadow: "0 0 0 3px rgba(120,31,43,.55)",
          }}
        />
      </button>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          [labelPosition === "below" ? "top" : "bottom"]: size + 6,
          padding: "14px 34px",
          borderRadius: 60,
          background: "rgba(251,244,230,.96)",
          border: "3px solid #c49a52",
          color: "#781f2b",
          fontFamily: lang === "bn" ? FONT_BN_UI : FONT_EN,
          fontWeight: 600,
          fontSize: lang === "bn" ? 40 : 44,
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        {label}
      </span>
    </div>
  );
};
