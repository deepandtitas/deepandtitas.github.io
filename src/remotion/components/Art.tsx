import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { continueRender, delayRender, Img } from "remotion";
import { ART, type ArtName } from "../art-manifest";
import { useAsset, useExperience } from "../experience";
import { artImage, imageReady } from "../lib/images";
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

/** A rectangle in the parent's (composition) coordinates. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FULL_FRAME: Box = { x: 0, y: 0, w: 1080, h: 1920 };

/**
 * A set of moving sprites drawn into ONE canvas: a single compositor layer however many sprites there are, mounted
 * once and never changing its DOM. Each frame it is cleared and every sprite is drawn with the same placement as
 * `spriteTransform` around its design origin, so a sprite looks exactly as an <img> of it would. (One layer per sprite
 * made phones run out of GPU tile memory and blank parts of the picture as sprites came and went.) Sprites must stay
 * inside `box`. Opacity 0 hides a sprite; callers keep their list a fixed length instead of adding and removing them.
 * `res` is canvas pixels per composition px: 1 is ≈1.08 device px on a 3× phone; soft particles can use less.
 */
export const SpriteField = ({ sprites, box = FULL_FRAME, res = 1 }: { sprites: readonly SpriteState[]; box?: Box; res?: number }) => {
  const url = useAsset();
  const { interactive } = useExperience();
  const ref = useRef<HTMLCanvasElement>(null);
  const drawn = useRef("");

  useLayoutEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const imgs = sprites.map((s) => artImage(url(ART[s.name].src)));
    // nothing moved (a finished arch, a still frame): keep what is drawn
    const sig = sprites.map((s) => `${s.name}${s.x.toFixed(2)},${s.y.toFixed(2)},${s.rot ?? 0},${s.scale ?? 1},${s.sx ?? 1},${s.opacity ?? 1}`).join(";");
    if (sig === drawn.current) return;
    const draw = () => {
      drawn.current = imgs.every((img, i) => imageReady(img) || (sprites[i].opacity ?? 1) <= 0.002) ? sig : "";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sprites.forEach((s, i) => {
        const alpha = Math.min(1, s.opacity ?? 1);
        const img = imgs[i];
        if (alpha <= 0.002 || !imageReady(img)) return;
        const a = ART[s.name];
        const k = s.scale ?? 1;
        const kx = (s.sx ?? 1) * k;
        const r = ((s.rot ?? 0) * Math.PI) / 180;
        const c = Math.cos(r);
        const sn = Math.sin(r);
        // translate(x, y) · rotate(r) · scale(kx, k), as in spriteTransform
        ctx.setTransform(res * c * kx, res * sn * kx, -res * sn * k, res * c * k, res * (s.x - box.x), res * (s.y - box.y));
        ctx.globalAlpha = alpha;
        ctx.drawImage(img, a.x, a.y, a.w, a.h);
      });
      ctx.globalAlpha = 1;
    };
    draw();
    const pending = imgs.filter((img, i) => !imageReady(img) && (sprites[i].opacity ?? 1) > 0.002);
    if (pending.length === 0) return;
    // not decoded yet: a render waits for it; the website (whose loader decodes everything first) just redraws
    let live = true;
    let handle: number | null = interactive ? null : delayRender("sprite images");
    const release = () => {
      if (handle !== null) continueRender(handle);
      handle = null;
    };
    Promise.all(pending.map((img) => img.decode().catch(() => undefined))).then(() => {
      if (live) draw();
      release();
    });
    return () => {
      live = false;
      release();
    };
  });

  return (
    <canvas
      ref={ref}
      width={Math.ceil(box.w * res)}
      height={Math.ceil(box.h * res)}
      style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h }}
    />
  );
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
