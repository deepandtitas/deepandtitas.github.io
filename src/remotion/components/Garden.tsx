import type { CSSProperties, ReactNode } from "react";
import type { ArtName } from "../art-manifest";
import { Art } from "./Art";

/**
 * A parallax plane: the garden art is painted on a 1200-wide canvas (60 px spare each side), so the plane sits at
 * x = -60 and drifts horizontally by a transform only.
 */
const Plane = ({ x, opacity = 1, style, children }: { x: number; opacity?: number; style?: CSSProperties; children: ReactNode }) => (
  <div
    style={{
      position: "absolute",
      left: -60,
      top: 0,
      width: 1200,
      height: 1920,
      transform: `translate3d(${x.toFixed(2)}px,0,0)`,
      opacity,
      visibility: opacity > 0.002 ? "visible" : "hidden",
      willChange: "transform, opacity",
      ...style,
    }}
  >
    {children}
  </div>
);

export const GardenFar = ({ drift = 0, opacity = 1 }: { drift?: number; opacity?: number }) => (
  <Plane x={drift * 0.35} opacity={opacity}>
    <Art name="garden-far" />
  </Plane>
);

export const GardenMid = ({ drift = 0, opacity = 1 }: { drift?: number; opacity?: number }) => (
  <Plane x={drift * 0.8} opacity={opacity}>
    <Art name="garden-mid-l" />
    <Art name="garden-mid-r" />
  </Plane>
);

/** Evening string lights in the trees, revealed with the dusk. */
export const GardenLights = ({ drift = 0, opacity = 1 }: { drift?: number; opacity?: number }) => (
  <Plane x={drift * 0.8} opacity={opacity}>
    <Art name="garden-lights" />
  </Plane>
);

/** Foreground foliage; `part` (0..1) slides the two sides apart, opening the view. */
export const GardenNear = ({ drift = 0, opacity = 1, part = 0 }: { drift?: number; opacity?: number; part?: number }) => {
  const names: [ArtName, number][] = [
    ["garden-near-l", -1],
    ["garden-near-r", 1],
  ];
  return (
    <Plane x={drift * 1.5} opacity={opacity}>
      {names.map(([n, side]) => (
        <Art key={n} name={n} moving style={{ transform: `translate3d(${(side * part * 360).toFixed(1)}px,${(part * 120).toFixed(1)}px,0)` }} />
      ))}
    </Plane>
  );
};
