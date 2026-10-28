import { Easing, interpolate } from "remotion";

/** A [from, to] frame range, as used by BEATS in the timeline config. */
export type Range = readonly [number, number];

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const easeSoft = Easing.bezier(0.22, 0.61, 0.36, 1);

/** Clamped 0→1 progress of `frame` through `range`, optionally eased. */
export const progress = (
  frame: number,
  range: Range,
  easing: (t: number) => number = easeInOut,
): number => interpolate(frame, [range[0], range[1]], [0, 1], { ...CLAMP, easing });

/** Clamped linear map of `frame` across `range` to [a, b]. */
export const ramp = (
  frame: number,
  range: Range,
  a: number,
  b: number,
  easing: (t: number) => number = easeInOut,
): number => interpolate(frame, [range[0], range[1]], [a, b], { ...CLAMP, easing });

/** Multi-stop clamped interpolation. */
export const keyframes = (frame: number, inputs: number[], outputs: number[]): number =>
  interpolate(frame, inputs, outputs, CLAMP);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Deterministic pseudo-random in [0,1) from an integer seed (no Math.random: renders must be repeatable). */
export const seeded = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
