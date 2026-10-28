import { describe, expect, it } from "vitest";
import { blinkAt, pendulum, poseTarget, restArm, solveArm, solveFigure } from "../src/remotion/rig/motion";

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe("character rig", () => {
  it("rests exactly in the painted pose", () => {
    for (const who of ["groom", "bride"] as const) {
      const s = solveFigure(who, { reduced: true });
      for (const xf of [s.upperL, s.upperR, s.foreL, s.foreR]) expect(Math.abs(xf.rot)).toBeLessThan(0.01);
      expect(dist(s.handR, restArm(who, 1).H)).toBeLessThan(0.01);
    }
  });

  it("keeps bone lengths and bends elbows outward", () => {
    const { S, upper, lower } = restArm("groom", 1);
    for (const T of [
      { x: 10, y: -450 },
      { x: 120, y: -600 },
      { x: -40, y: -300 },
    ]) {
      const { E, H } = solveArm(S, T, upper, lower, 1);
      expect(dist(S, E)).toBeCloseTo(upper, 3);
      expect(dist(E, H)).toBeCloseTo(lower, 3);
      expect(E.x).toBeGreaterThan(Math.min(S.x, H.x) - 1);
    }
  });

  it("reaches toward unreachable targets without breaking", () => {
    const { S, upper, lower } = restArm("bride", -1);
    const { H } = solveArm(S, { x: -900, y: -490 }, upper, lower, -1);
    expect(dist(S, H)).toBeLessThanOrEqual(upper + lower);
    expect(H.x).toBeLessThan(S.x);
  });

  it("blends poses continuously", () => {
    let prev = poseTarget("bride", 1, { namaskar: 0 });
    for (let i = 1; i <= 20; i++) {
      const p = poseTarget("bride", 1, { namaskar: i / 20 });
      expect(dist(p, prev)).toBeLessThan(15);
      prev = p;
    }
  });

  it("blinks deterministically and only briefly", () => {
    const samples = Array.from({ length: 1500 }, (_, t) => blinkAt(t, 3));
    expect(samples).toEqual(Array.from({ length: 1500 }, (_, t) => blinkAt(t, 3)));
    const closed = samples.filter((b) => b > 0.5).length;
    expect(closed).toBeGreaterThan(0);
    expect(closed / samples.length).toBeLessThan(0.08);
  });

  it("damps the garland swing", () => {
    expect(pendulum(0, 9)).toBe(0);
    expect(pendulum(-5, 9)).toBe(0);
    const early = Math.max(...Array.from({ length: 40 }, (_, i) => Math.abs(pendulum(i, 9))));
    const late = Math.max(...Array.from({ length: 40 }, (_, i) => Math.abs(pendulum(200 + i, 9))));
    expect(late).toBeLessThan(early * 0.1);
  });
});
