import type { CSSProperties } from "react";
import { BEATS } from "../../config/timeline";
import { progress, ramp } from "../lib/anim";

const RED = "#781f2b";
const GOLD = "#c49a52";

interface StrokeProps {
  d: string;
  p: number;
  stroke: string;
  width: number;
  opacity?: number;
  dash?: string;
}

/** A path that draws itself: pathLength normalises the dash so p ∈ [0,1] is the drawn fraction. */
const Stroke = ({ d, p, stroke, width, opacity = 1 }: StrokeProps) => {
  if (p <= 0.001) return null;
  return (
    <path
      d={d}
      pathLength={1}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={1}
      strokeDashoffset={1 - p}
      opacity={opacity}
    />
  );
};

const CX = 540;
const CY = 1060;

const PETAL = "M0 -238C40 -284 40 -322 0 -356C-40 -322 -40 -284 0 -238Z";
const CURL = "M0 -362c14 -14 34 -4 28 12c-5 12 -22 8 -18 -3";
const SCALLOP = "M-26 -392q26 -34 52 0";

/** Four corner flourishes (top-left drawn, others mirrored). */
const FLOURISH =
  "M78 330C70 210 118 130 236 112C306 102 340 150 304 186C276 214 230 198 240 162" +
  "M78 330C84 280 120 250 160 258M120 204C150 176 196 176 214 204";

const Flourish = ({ p, mirrorX, mirrorY }: { p: number; mirrorX: boolean; mirrorY: boolean }) => (
  <g
    transform={`translate(${mirrorX ? 1080 : 0} ${mirrorY ? 1920 : 0}) scale(${mirrorX ? -1 : 1} ${mirrorY ? -1 : 1})`}
  >
    <Stroke d={FLOURISH} p={p} stroke={RED} width={4} opacity={0.7} />
    <Stroke d="M236 112C250 96 272 92 290 100" p={p} stroke={GOLD} width={3} />
  </g>
);

interface AlpanaProps {
  /** Scene-local frame of the awakening scene. */
  frame: number;
  style?: CSSProperties;
}

/** The self-drawing alpana: border, concentric rings, petal ring, scallops and corner vines. */
export const Alpana = ({ frame, style }: AlpanaProps) => {
  const [d0, d1] = BEATS.awakening.alpanaDraw;
  const span = d1 - d0;
  const seg = (a: number, b: number) => progress(frame, [d0 + span * a, d0 + span * b]);

  const border = seg(0, 0.7);
  const ringA = seg(0.05, 0.4);
  const ringB = seg(0.35, 0.7);
  const petalCount = 16;
  const scallopCount = 32;

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, ...style }}>
      {/* frame */}
      <Stroke
        d="M96 60H984Q1020 60 1020 96V1824Q1020 1860 984 1860H96Q60 1860 60 1824V96Q60 60 96 60Z"
        p={border}
        stroke={GOLD}
        width={3}
      />
      <Stroke
        d="M110 84H970Q996 84 996 110V1810Q996 1836 970 1836H110Q84 1836 84 1810V110Q84 84 110 84Z"
        p={border}
        stroke={RED}
        width={2}
        opacity={0.55}
      />

      {/* mandala */}
      <g transform={`translate(${CX} ${CY})`}>
        <circle
          r={236}
          fill="none"
          stroke={RED}
          strokeWidth={4}
          opacity={0.75}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ringA}
          transform="rotate(-90)"
        />
        <circle
          r={266}
          fill="none"
          stroke={GOLD}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="1 15"
          opacity={ringB * 0.9}
        />
        {Array.from({ length: petalCount }, (_, i) => {
          const p = seg(0.15 + (i / petalCount) * 0.45, 0.35 + (i / petalCount) * 0.5);
          return (
            <g key={`p${i}`} transform={`rotate(${(i * 360) / petalCount})`}>
              <Stroke d={PETAL} p={p} stroke={RED} width={4} opacity={0.8} />
              <Stroke d={CURL} p={p} stroke={GOLD} width={3} />
            </g>
          );
        })}
        {Array.from({ length: scallopCount }, (_, i) => {
          const p = seg(0.5 + (i / scallopCount) * 0.35, 0.65 + (i / scallopCount) * 0.35);
          return (
            <g key={`s${i}`} transform={`rotate(${(i * 360) / scallopCount + 360 / scallopCount / 2})`}>
              <Stroke d={SCALLOP} p={p} stroke={RED} width={3} opacity={0.6} />
            </g>
          );
        })}
      </g>

      <Flourish p={seg(0.2, 0.8)} mirrorX={false} mirrorY={false} />
      <Flourish p={seg(0.25, 0.85)} mirrorX mirrorY={false} />
      <Flourish p={seg(0.3, 0.9)} mirrorX={false} mirrorY />
      <Flourish p={seg(0.35, 0.95)} mirrorX mirrorY />
    </svg>
  );
};

export const ALPANA_CENTER = { x: CX, y: CY } as const;

/** Sparkle-free helper: eased opacity for a soft gold point of light. */
export const lightPoint = (frame: number): number => ramp(frame, BEATS.awakening.lightIn, 0, 1);
