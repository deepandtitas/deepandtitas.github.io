import { seeded } from "../lib/anim";
import type { SpriteState } from "./Art";

const COUNT = 16;

interface Props {
  /** Global time in beats. */
  beat: number;
  /** 0..1 */
  intensity: number;
}

/** Restrained gold motes rising slowly and twinkling, as sprites for a SpriteField (always COUNT; faded by opacity). */
export const dustSprites = ({ beat, intensity }: Props): SpriteState[] => {
  const n = COUNT * Math.min(1, Math.max(0, intensity));
  return Array.from({ length: COUNT }, (_, i): SpriteState => {
    const speed = 0.0009 + seeded(i + 3) * 0.0012;
    const f = (seeded(i + 50) + beat * speed) % 1;
    const x = seeded(i + 90) * 1080 + Math.sin(beat * 0.02 + i * 2.1) * 26;
    const y = 1960 - f * 2040;
    const r = 0.35 + seeded(i + 130) * 0.55;
    const tw = 0.45 + 0.55 * Math.sin(beat * (0.07 + seeded(i + 170) * 0.06) + i);
    const env = Math.min(1, f * 6, (1 - f) * 6);
    const present = Math.min(1, Math.max(0, n - i));
    return { name: "mote", x, y, scale: r, opacity: env * tw * 0.9 * Math.min(1, intensity) * present };
  });
};
