import { seeded } from "../lib/anim";

const INK = "#30251f";

type Kind = "pink" | "marigold" | "mixed";

const COLORS = {
  pink: ["#ec9fa6", "#c4566a"],
  marigold: ["#f2a93a", "#c9701a"],
  white: ["#fbf3e4", "#c49a52"],
} as const;

const PETAL = "M0 -1C0.95 -0.7 0.9 0.5 0 1C-0.9 0.5 -0.95 -0.7 0 -1Z";
const COUNT = 24;

interface Props {
  /** Global frame — petals are a pure function of it. */
  frame: number;
  /** 0..1.2: how many petals are in the air. */
  intensity: number;
  kind?: Kind;
}

/** Drifting petals on three depth layers. Deterministic: position depends only on `frame` and the petal index. */
export const FloatingPetals = ({ frame, intensity, kind = "mixed" }: Props) => {
  if (intensity <= 0.01) return null;
  const visible = Math.ceil(COUNT * Math.min(1, intensity));
  return (
    <g>
      {Array.from({ length: visible }, (_, i) => {
        const T = 420 + seeded(i + 1) * 360;
        const phase = seeded(i + 40) * T;
        const f = ((frame + phase) % T) / T;
        const depth = i % 3; // 0 foreground, 1 mid, 2 far
        const size = depth === 0 ? 30 : depth === 1 ? 21 : 14;
        const base = depth === 0 ? 0.95 : depth === 1 ? 0.8 : 0.5;
        const x0 = seeded(i + 80) * 1180 - 50;
        const drift = (seeded(i + 120) - 0.35) * 320;
        const x = x0 + drift * f + Math.sin(frame * (0.018 + seeded(i + 7) * 0.02) + i) * (40 + depth * 12);
        const y = -60 + f * 2040;
        const spin = frame * (0.8 + seeded(i + 9) * 1.6) * (i % 2 ? 1 : -1) + i * 40;
        const flip = Math.cos(frame * (0.04 + seeded(i + 15) * 0.04) + i);
        const env = Math.min(1, f * 7, (1 - f) * 7);
        const tone =
          kind === "pink" ? "pink" : kind === "marigold" ? "marigold" : (["pink", "marigold", "white"] as const)[i % 3];
        const [fill, edge] = COLORS[tone];
        return (
          <g
            key={i}
            transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${spin.toFixed(1)}) scale(${(size * 0.55).toFixed(1)} ${(size * (0.35 + 0.65 * Math.abs(flip))).toFixed(1)})`}
            opacity={(env * base * Math.min(1, intensity)).toFixed(3)}
          >
            <path d={PETAL} fill={fill} stroke={edge} strokeWidth={0.09} />
            <path d="M0 -0.8V0.7" stroke={INK} strokeOpacity={0.25} strokeWidth={0.05} />
          </g>
        );
      })}
    </g>
  );
};
