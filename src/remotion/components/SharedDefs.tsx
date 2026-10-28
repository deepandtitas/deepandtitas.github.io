import { MarigoldDefs } from "./WeddingCouple";

/**
 * Hidden SVG defs referenced by id from every other SVG in the composition
 * (marigold glyphs, flame and glow gradients). Rendered once at the composition root.
 */
export const SharedDefs = () => (
  <>
    <MarigoldDefs />
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <radialGradient id="glow-grad">
          <stop offset="0" stopColor="#f9e2a0" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#f1c463" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f1c463" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="flame-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd86b" />
          <stop offset="0.6" stopColor="#f59a2a" />
          <stop offset="1" stopColor="#d9531e" />
        </linearGradient>
        <linearGradient id="dome-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6a1420" />
          <stop offset="1" stopColor="#8f2433" />
        </linearGradient>
      </defs>
    </svg>
  </>
);
