import type { ArtName } from "../art-manifest";
import type { Pt } from "../rig/motion";
import type { SpriteState } from "./Art";

/** Tuberose and rose with marigold: the flowers of a Bengali মালাবদল garland. */
const KINDS: ArtName[] = ["marigold-a", "tuberose", "rose", "tuberose", "marigold-b", "tuberose", "rose", "tuberose"];

/** Points along a hanging strand from `a` to `b` that sags by `sag`, swung by `swing` degrees about its ends. */
export const strandPoints = (a: Pt, b: Pt, sag: number, swing: number, n: number): Pt[] => {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const r = (swing * Math.PI) / 180;
  const down = { x: -Math.sin(r) * sag * 2, y: Math.cos(r) * sag * 2 };
  const c = { x: mid.x + down.x, y: mid.y + down.y };
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
  });
};

interface Strand {
  a: Pt;
  b: Pt;
  sag: number;
  swing?: number;
  /** Size of one flower (composition px). */
  size: number;
  count?: number;
  opacity?: number;
  /** Seed so the two garlands are not identical. */
  seed?: number;
}

/**
 * A garland strand as flower sprites, laid out in composition coordinates. Always `count` sprites (opacity hides
 * them), so the sprite field never changes length.
 */
export const garlandSprites = ({ a, b, sag, swing = 0, size, count = 17, opacity = 1, seed = 0 }: Strand): SpriteState[] =>
  strandPoints(a, b, sag, swing, count).map((p, i) => ({
    name: KINDS[(i + seed) % KINDS.length],
    x: p.x,
    y: p.y,
    rot: i * 47 + seed * 13,
    scale: size / 22,
    opacity,
  }));
