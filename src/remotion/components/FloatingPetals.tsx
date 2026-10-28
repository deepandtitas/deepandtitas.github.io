import type { ArtName } from "../art-manifest";
import { seeded } from "../lib/anim";
import type { SpriteState } from "./Art";

type Kind = "marigold" | "mixed";

const COUNT = 20;
const MIXED: ArtName[] = ["petal-pink", "petal-marigold", "petal-white", "petal-red"];

interface Props {
  /** Global time in beats — petals are a pure function of it. */
  beat: number;
  /** 0..1.2: how many petals are in the air. */
  intensity: number;
  kind?: Kind;
}

/**
 * Drifting petals on three depth layers, as sprites for a SpriteField. Always COUNT of them: the intensity fades
 * petals in and out one after another (by opacity), so nothing is added or removed mid-story.
 */
export const petalSprites = ({ beat, intensity, kind = "mixed" }: Props): SpriteState[] => {
  const n = COUNT * Math.min(1, Math.max(0, intensity));
  return Array.from({ length: COUNT }, (_, i): SpriteState => {
    const T = 420 + seeded(i + 1) * 360;
    const phase = seeded(i + 40) * T;
    const f = ((beat + phase) % T) / T;
    const depth = i % 3; // 0 foreground, 1 mid, 2 far
    const size = depth === 0 ? 0.95 : depth === 1 ? 0.68 : 0.46;
    const base = depth === 0 ? 0.95 : depth === 1 ? 0.82 : 0.55;
    const x0 = seeded(i + 80) * 1180 - 50;
    const drift = (seeded(i + 120) - 0.35) * 320;
    const x = x0 + drift * f + Math.sin(beat * (0.018 + seeded(i + 7) * 0.02) + i) * (40 + depth * 12);
    const y = -60 + f * 2040;
    const spin = beat * (0.8 + seeded(i + 9) * 1.6) * (i % 2 ? 1 : -1) + i * 40;
    const flip = Math.cos(beat * (0.04 + seeded(i + 15) * 0.04) + i);
    const env = Math.min(1, f * 7, (1 - f) * 7);
    const name: ArtName = kind === "marigold" ? (i % 4 === 0 ? "petal-red" : "petal-marigold") : MIXED[i % MIXED.length];
    const present = Math.min(1, Math.max(0, n - i));
    return { name, x, y, rot: spin, scale: size, sx: 0.35 + 0.65 * Math.abs(flip), opacity: env * base * Math.min(1, intensity) * present };
  });
};
