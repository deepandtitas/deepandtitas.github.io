import { memo } from "react";
import { ART, type ArtName } from "../art-manifest";
import { easeOut, lerp, progress, seeded } from "../lib/anim";
import { MEET_Y } from "../lib/path";
import { Art, SpriteField, type SpriteState } from "./Art";

/** Geometry shared by the meeting scene (gathering flowers) and the wedding scene (finished mandap). */
export const MANDAP = {
  cx: 540,
  baseY: MEET_Y,
  postX: [205, 875] as const,
  archCy: 650,
  archRx: 330,
  archRy: 235,
  /** Centre of the gathered flowers — where the guided hotspot sits. */
  hotspot: { x: 540, y: 510 },
} as const;

const ARCH_COUNT = 34;

const archPoint = (i: number) => {
  const a = Math.PI - (i / (ARCH_COUNT - 1)) * Math.PI;
  return { x: MANDAP.cx + MANDAP.archRx * Math.cos(a), y: MANDAP.archCy - MANDAP.archRy * Math.sin(a) - 8 };
};

/** Where the arch flowers fly (from the bushes, up and over into the arch) and where the diyas glow: canvas bounds. */
export const ARCH_BOX = { x: 0, y: 160, w: 1080, h: 1160 };
/** The gathered arch alone (once every flower is in place). */
export const ARCH_BOX_GATHERED = { x: 160, y: 330, w: 760, h: 400 };
export const DIYA_BOX = { x: 0, y: 1360, w: 1080, h: 400 };

/** Flowering bushes in the garden (composition coordinates) where the arch flowers rise from. */
const BUSHES = [
  { x: 190, y: 1010 },
  { x: 40, y: 1150 },
  { x: 890, y: 1000 },
  { x: 1050, y: 1120 },
] as const;

/** An image revealed by sliding inside a clip, so only a transform changes (no repaint of the art). */
const Reveal = ({ name, p, from }: { name: ArtName; p: number; from: "bottom" | "top" }) => {
  const a = ART[name];
  const off = (1 - p) * a.h * (from === "bottom" ? 1 : -1);
  return (
    <div style={{ position: "absolute", left: a.x, top: a.y, width: a.w, height: a.h, overflow: "hidden", visibility: p > 0.001 ? "visible" : "hidden" }}>
      <Art name={name} moving style={{ left: 0, top: 0, transform: `translateY(${off.toFixed(1)}px)` }} />
    </div>
  );
};

/**
 * The mandap, built from baked parts during the first seconds of the wedding scene: posts rise, the canopy and valance
 * open, the marigold strings drop. Every motion is a transform or opacity of a pre-decoded image.
 */
export const MandapStructure = memo(function MandapStructure({ build }: { build: number }) {
  const posts = easeOut(progress(build, [0, 0.55], (t) => t));
  const dome = progress(build, [0.12, 0.62]);
  const valance = progress(build, [0.3, 0.72]);
  const strings = progress(build, [0.5, 1]);
  const floor = progress(build, [0, 0.6]);
  const domeA = ART["mandap-dome"];
  const valA = ART["mandap-valance"];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Art name="mandap-floor" style={{ opacity: floor }} />
      <Art
        name="mandap-dome"
        moving
        style={{
          opacity: dome,
          transformOrigin: `${domeA.w / 2}px ${domeA.h}px`,
          transform: `scale(${lerp(0.86, 1, dome).toFixed(4)})`,
        }}
      />
      <Reveal name="mandap-strings" p={strings} from="top" />
      <Art
        name="mandap-valance"
        moving
        style={{ opacity: valance, transformOrigin: `${valA.w / 2}px 0px`, transform: `scaleX(${lerp(0.6, 1, valance).toFixed(4)})` }}
      />
      <Reveal name="mandap-post-l" p={posts} from="bottom" />
      <Reveal name="mandap-post-r" p={posts} from="bottom" />
      {(["mandap-leaves-l", "mandap-leaves-r"] as const).map((n) => (
        <Art key={n} name={n} moving style={{ opacity: floor, transformOrigin: "50% 100%", transform: `scale(${lerp(0.7, 1, floor).toFixed(4)})` }} />
      ))}
    </div>
  );
});

/**
 * The arch of marigolds above the couple. The flowers are invisible until `gather` begins: each one appears in a
 * flowering bush of the garden and flies up into its place in the arch, one after another.
 */
export const archSprites = (gather: number): SpriteState[] =>
  Array.from({ length: ARCH_COUNT }, (_, i): SpriteState => {
    const fin = archPoint(i);
    const order = (i % 2 === 0 ? i / 2 : (ARCH_COUNT - 1 - i) / 2 + 0.5) / (ARCH_COUNT / 2); // the two ends first
    const g = Math.min(1, Math.max(0, gather * 1.65 - order * 0.65));
    const bush = BUSHES[(i % 2) * 2 + (i % 3 === 0 ? 1 : 0)];
    const sx = bush.x + (seeded(i * 3 + 1) - 0.5) * 120;
    const sy = bush.y + (seeded(i * 3 + 2) - 0.5) * 80;
    const e = easeOut(g);
    // an arc: up and over toward its place
    return {
      name: i % 4 === 3 ? "tuberose" : i % 3 === 1 ? "marigold-b" : "marigold-a",
      x: lerp(sx, fin.x, e),
      y: lerp(sy, fin.y, e) - Math.sin(Math.PI * e) * 160,
      rot: i * 33 + (1 - e) * 260,
      scale: lerp(0.45, i % 4 === 3 ? 0.85 : 1.05, e),
      opacity: g > 0 ? Math.min(1, g * 5) : 0,
    };
  });

/** `box`: ARCH_BOX while flowers fly in; a scene that only shows the finished arch passes ARCH_BOX_GATHERED. */
export const MandapArch = ({ gather, box = ARCH_BOX }: { gather: number; box?: typeof ARCH_BOX }) => (
  <SpriteField sprites={archSprites(gather)} box={box} />
);

const DIYA_SPOTS = [
  { x: 120, y: 1560 },
  { x: 215, y: 1605 },
  { x: 345, y: 1622 },
  { x: 460, y: 1632 },
  { x: 620, y: 1632 },
  { x: 735, y: 1622 },
  { x: 865, y: 1605 },
  { x: 960, y: 1560 },
] as const;

export const DIYA_COUNT = DIYA_SPOTS.length;

/** Clay lamps along the front of the mandap: baked bowl, flame and glow sprites; the flame flickers by transform. */
export const diyaSprites = (build: number, lights: number, time: number): SpriteState[] => {
  const sprites: SpriteState[] = [];
  const fade = build > 0.02 ? Math.min(1, build * 3) : 0;
  DIYA_SPOTS.forEach((d, i) => {
    const lit = progress(lights, [(i / DIYA_COUNT) * 0.7, (i / DIYA_COUNT) * 0.7 + 0.3]);
    const tt = time + i * 11;
    const flick = 1 + 0.09 * Math.sin(tt * 0.72) + 0.05 * Math.sin(tt * 1.93 + 1.3);
    const s = 0.95 + (d.y - 1560) / 600;
    sprites.push(
      { name: "glow", x: d.x, y: d.y - 22 * s, scale: Math.max(0.001, 0.7 * s * lit * (0.95 + 0.05 * flick)), opacity: 0.85 * lit * fade },
      { name: "diya", x: d.x, y: d.y, scale: s, opacity: fade },
      { name: "flame", x: d.x, y: d.y - 20 * s, rot: Math.sin(tt * 0.41) * 3, scale: Math.max(0.001, s * lit * flick), opacity: lit > 0.01 ? fade : 0 },
    );
  });
  return sprites;
};

export const MandapDiyas = ({ build, lights, time }: { build: number; lights: number; time: number }) => (
  <SpriteField sprites={diyaSprites(build, lights, time)} box={DIYA_BOX} />
);
