import { describe, expect, it } from "vitest";
import { sceneDuration } from "../src/config/timeline";
import { figurePoints } from "../src/remotion/components/WeddingCouple";
import { exchangeAt } from "../src/remotion/scenes/WeddingScene";

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/** How far each hand moves per 60 FPS frame through the whole wedding scene (composition px). */
const handSpeeds = () => {
  const step = 0.5; // beats per frame
  const out: { who: string; side: string; f: number; d: number }[][] = [];
  let prev = exchangeAt(0, false).pose;
  for (let f = step; f < sceneDuration("wedding"); f += step) {
    const pose = exchangeAt(f, false).pose;
    const row: { who: string; side: string; f: number; d: number }[] = [];
    for (const who of ["groom", "bride"] as const) {
      const a = figurePoints(who, prev[who]);
      const b = figurePoints(who, pose[who]);
      row.push({ who, side: "left", f, d: dist(a.handL, b.handL) }, { who, side: "right", f, d: dist(a.handR, b.handR) });
    }
    out.push(row);
    prev = pose;
  }
  return out;
};

describe("wedding choreography", () => {
  const speeds = handSpeeds();

  it("never jumps a hand (e.g. when the betel leaves are let go or a garland is placed)", () => {
    for (let i = 1; i < speeds.length - 1; i++) {
      for (let k = 0; k < speeds[i].length; k++) {
        const { who, side, f, d } = speeds[i][k];
        const around = Math.max(speeds[i - 1][k].d, speeds[i + 1][k].d);
        // a jump is a sudden spike against the neighbouring frames, not merely a quick, smooth gesture
        expect(d > 4 && d > 2.5 * around, `${who} ${side} hand jumps ${d.toFixed(1)} px at beat ${f}`).toBe(false);
      }
    }
  });

  it("keeps every gesture unhurried", () => {
    const fastest = speeds.flat().reduce((m, s) => (s.d > m.d ? s : m));
    expect(fastest.d, `${fastest.who} ${fastest.side} hand at beat ${fastest.f}`).toBeLessThan(16);
  });
});
