import { describe, expect, it } from "vitest";
import { fitStage } from "../src/app/hooks/useStageLayout";

describe("stage layout", () => {
  it("keeps the frame 9:16 and inside the room", () => {
    for (const [w, h] of [[390, 844], [375, 667], [844, 390], [1920, 1080], [280, 653]]) {
      const fit = fitStage({ w, h }, { w, h });
      expect(fit.width).toBeLessThanOrEqual(w);
      expect(fit.height).toBeLessThanOrEqual(h + 0.01);
      expect(fit.height / fit.width).toBeCloseTo(16 / 9, 5);
      expect(fit.scale).toBeCloseTo(fit.width / 1080, 8);
    }
  });

  it("does not rescale or move the controls while a toolbar slides (room fixed, visible box changes)", () => {
    const room = { w: 390, h: 664 };
    const shown = fitStage(room, { w: 390, h: 664 });
    const hidden = fitStage(room, { w: 390, h: 750 });
    expect(hidden.width).toBe(shown.width);
    expect(hidden.hud).toBe(shown.hud);
    const tall = { w: 412, h: 839 };
    expect(fitStage(tall, tall).hud).toBe(fitStage(tall, { w: 412, h: 915 }).hud);
  });

  it("puts the controls in the bands on tall phones and beside the picture when wide", () => {
    expect(fitStage({ w: 390, h: 844 }, { w: 390, h: 844 }).hud).toBe("bands");
    expect(fitStage({ w: 375, h: 667 }, { w: 375, h: 667 }).hud).toBe("inside");
    expect(fitStage({ w: 844, h: 390 }, { w: 844, h: 390 }).hud).toBe("side");
    expect(fitStage({ w: 1920, h: 1080 }, { w: 1920, h: 1080 }).hud).toBe("side");
  });
});
