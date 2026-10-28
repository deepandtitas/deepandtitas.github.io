import type { ReactNode } from "react";

/**
 * A full-frame SVG that gets its own compositor layer. Content that changes every frame (people, flames, petals) lives in
 * different layers from content that does not (canopy, garden), so the browser repaints only what actually changed.
 */
export const Layer = ({ children }: { children: ReactNode }) => (
  <svg
    width={1080}
    height={1920}
    viewBox="0 0 1080 1920"
    style={{ position: "absolute", inset: 0, pointerEvents: "none", willChange: "transform" }}
  >
    {children}
  </svg>
);

/** A soft gold disc as a CSS gradient: only its opacity changes, which the GPU composites for free. */
export const GlowDisc = ({ x, y, r, opacity }: { x: number; y: number; r: number; opacity: number }) =>
  opacity > 0.005 ? (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        opacity,
        willChange: "opacity",
        pointerEvents: "none",
        background: "radial-gradient(circle, rgba(249,226,160,.9) 0%, rgba(241,196,99,.35) 45%, rgba(241,196,99,0) 70%)",
      }}
    />
  ) : null;
