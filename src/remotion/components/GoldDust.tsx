import { seeded } from "../lib/anim";

const COUNT = 34;

interface Props {
  frame: number;
  /** 0..1 */
  intensity: number;
}

/** Restrained gold motes rising slowly and twinkling. */
export const GoldDust = ({ frame, intensity }: Props) => {
  if (intensity <= 0.01) return null;
  const n = Math.ceil(COUNT * Math.min(1, intensity));
  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {Array.from({ length: n }, (_, i) => {
        const speed = 0.0009 + seeded(i + 3) * 0.0012;
        const f = (seeded(i + 50) + frame * speed) % 1;
        const x = seeded(i + 90) * 1080 + Math.sin(frame * 0.02 + i * 2.1) * 26;
        const y = 1960 - f * 2040;
        const r = 1.8 + seeded(i + 130) * 3.4;
        const tw = 0.45 + 0.55 * Math.sin(frame * (0.07 + seeded(i + 170) * 0.06) + i);
        const env = Math.min(1, f * 6, (1 - f) * 6);
        return (
          <circle
            key={i}
            cx={x.toFixed(1)}
            cy={y.toFixed(1)}
            r={r.toFixed(2)}
            fill="#d4aa5e"
            opacity={(env * tw * 0.85 * Math.min(1, intensity)).toFixed(3)}
          />
        );
      })}
    </svg>
  );
};
