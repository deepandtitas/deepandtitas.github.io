import type { ReactNode } from "react";

/**
 * A full-frame SVG for the few remaining vector drawings (alpana, lotus, emblem). Kept as one layer so the browser
 * repaints only what changed; it is promoted once and never toggled.
 */
export const Layer = ({ children }: { children: ReactNode }) => (
  <svg
    width={1080}
    height={1920}
    viewBox="0 0 1080 1920"
    style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
  >
    {children}
  </svg>
);

/**
 * A soft gold disc as a CSS gradient: only its opacity changes, which the GPU composites for free.
 * It stays mounted (hidden, not removed, at zero opacity) so the compositor layer is never created mid-story.
 */
export const GlowDisc = ({ x, y, r, opacity }: { x: number; y: number; r: number; opacity: number }) => (
  <div
    style={{
      position: "absolute",
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      opacity,
      visibility: opacity > 0.004 ? "visible" : "hidden",
      willChange: "opacity",
      pointerEvents: "none",
      background: "radial-gradient(circle, rgba(249,226,160,.9) 0%, rgba(241,196,99,.35) 45%, rgba(241,196,99,0) 70%)",
    }}
  />
);
