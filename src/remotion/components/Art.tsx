import { useMemo, type CSSProperties } from "react";
import { Img } from "remotion";
import { ART, type ArtName } from "../art-manifest";
import { useAsset } from "../experience";
import { useLiveStyles, type LiveStyle } from "../lib/live";
import type { PartXf } from "../rig/motion";

/** Transform origin of a rig part: its rest pivot, relative to the part's image rectangle. */
export const partOrigin = (name: ArtName, pivot: { x: number; y: number }): string => {
  const a = ART[name];
  return `${(pivot.x - a.x).toFixed(2)}px ${(pivot.y - a.y).toFixed(2)}px`;
};

/** Transform of a rig part: rotate/scale about its rest pivot, then move that pivot to where the rig put it. */
export const partTransform = (xf: PartXf): string => {
  const s = xf.sx !== undefined || xf.sy !== undefined ? ` scale(${(xf.sx ?? 1).toFixed(4)},${(xf.sy ?? 1).toFixed(4)})` : "";
  return `translate(${(xf.at.x - xf.pivot.x).toFixed(2)}px,${(xf.at.y - xf.pivot.y).toFixed(2)}px) rotate(${xf.rot.toFixed(3)}deg)${s}`;
};

/** Full style for a part rendered through React (static placements). */
export const partStyle = (name: ArtName, xf: PartXf): CSSProperties => ({ transformOrigin: partOrigin(name, xf.pivot), transform: partTransform(xf) });

/** Static placement of a baked image at its design rectangle. */
export const artBox = (name: ArtName): CSSProperties => {
  const a = ART[name];
  return { position: "absolute", left: a.x, top: a.y, width: a.w, height: a.h, maxWidth: "none" };
};

interface ArtProps {
  name: ArtName;
  style?: CSSProperties;
  /** Promote to its own compositor layer (for parts that move every frame). Constant: never toggled. */
  moving?: boolean;
}

/**
 * A baked image placed at its design rectangle (see art-manifest.ts). Plain <img>: in renders, the hidden <ArtGate/>
 * makes Remotion wait for every image; in the website, the loader has already fetched and decoded them.
 */
export const Art = ({ name, style, moving = false }: ArtProps) => {
  const url = useAsset();
  return (
    <img
      src={url(ART[name].src)}
      alt=""
      draggable={false}
      decoding="sync"
      style={{ ...artBox(name), willChange: moving ? "transform" : undefined, ...style }}
    />
  );
};

/** One sprite's state for a frame: centred on its design origin, placed in its parent's coordinates. */
export interface SpriteState {
  name: ArtName;
  x: number;
  y: number;
  rot?: number;
  scale?: number;
  /** Extra horizontal scale (a petal turning edge-on). */
  sx?: number;
  opacity?: number;
}

export const spriteTransform = (s: SpriteState): string => {
  const k = s.scale ?? 1;
  return `translate(${s.x.toFixed(2)}px,${s.y.toFixed(2)}px) rotate(${(s.rot ?? 0).toFixed(2)}deg) scale(${((s.sx ?? 1) * k).toFixed(4)},${k.toFixed(4)})`;
};

/**
 * A set of moving sprites. The <img> elements are rendered once (re-rendered only if the list of images changes);
 * each frame only their transform/opacity is written to the DOM, with no React diffing.
 */
export const SpriteField = ({ sprites }: { sprites: readonly SpriteState[] }) => {
  const url = useAsset();
  const ref = useLiveStyles(
    sprites.map((s): LiveStyle => ({ transform: spriteTransform(s), opacity: s.opacity ?? 1, visibility: (s.opacity ?? 1) > 0.002 ? "visible" : "hidden" })),
  );
  const key = sprites.map((s) => s.name).join("|");
  const nodes = useMemo(
    () =>
      key
        .split("|")
        .filter(Boolean)
        .map((name, i) => {
          const n = name as ArtName;
          return (
            <img
              key={`${i}-${n}`}
              ref={ref(i)}
              src={url(ART[n].src)}
              alt=""
              draggable={false}
              decoding="sync"
              style={{ ...artBox(n), transformOrigin: `${-ART[n].x}px ${-ART[n].y}px`, willChange: "transform, opacity" }}
            />
          );
        }),
    [key, url, ref],
  );
  return <>{nodes}</>;
};

/** A single static sprite (rendered through React; for things that do not move every frame). */
export const Sprite = (s: SpriteState & { style?: CSSProperties }) => (
  <Art name={s.name} moving style={{ transformOrigin: `${-ART[s.name].x}px ${-ART[s.name].y}px`, transform: spriteTransform(s), opacity: s.opacity ?? 1, ...s.style }} />
);

/**
 * Mounts every baked image once, invisibly, through Remotion's <Img> so a render never captures a frame before the
 * art has loaded. Only used for renders: Remotion's <Img> re-renders on every frame, and the website does not need it.
 */
export const ArtGate = () => {
  const url = useAsset();
  return (
    <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }} aria-hidden="true">
      {(Object.keys(ART) as ArtName[]).map((n) => (
        <Img key={n} src={url(ART[n].src)} style={{ width: 1, height: 1 }} />
      ))}
    </div>
  );
};
