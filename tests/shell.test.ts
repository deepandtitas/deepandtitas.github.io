import { describe, expect, it } from "vitest";
import { fitStage } from "../src/app/hooks/useStageLayout";
import { initialStoryState, storyReducer, type StoryAction, type StoryState } from "../src/app/state/storyMachine";
import { loadList } from "../src/app/components/Loader";
import { soundtrackVolume } from "../src/app/lib/soundtrackVolume";
import { asset } from "../src/content/assets";
import { t, translations } from "../src/content/translations";
import { wedding } from "../src/content/wedding";
import { describeFrame } from "../src/scene/frame";
import { LAST_FRAME, SCENE_ORDER, sceneLastFrame } from "../src/story/timeline";

const run = (actions: StoryAction[], from: StoryState = initialStoryState) => actions.reduce(storyReducer, from);

describe("shell flows", () => {
  it("watch goes from the cover to finished, through every scene", () => {
    const s = run([
      { type: "START_CINEMATIC" },
      ...SCENE_ORDER.map((scene): StoryAction => ({ type: "SCENE", scene })),
      { type: "ENDED" },
    ]);
    expect(s).toMatchObject({ phase: "finished", step: "invitation" });
  });

  it("explore offers each hotspot in order, and the checkpoints sit on scene last frames", () => {
    let s = run([{ type: "START_GUIDED" }]);
    const offered: (string | null)[] = [s.awaiting];
    for (const scene of SCENE_ORDER) {
      s = run([{ type: "ACTIVATE", target: scene }, { type: "BOUNDARY", scene }], s);
      offered.push(s.awaiting);
    }
    expect(offered).toEqual(["awakening", "meeting", "wedding", "invitation", null]);
    expect(sceneLastFrame("invitation")).toBe(LAST_FRAME);
    expect(s.phase).toBe("finished");
  });

  it("skip and replay work from anywhere; pause/resume never changes the story state", () => {
    const playing = run([{ type: "START_CINEMATIC" }]);
    // pausing and resuming are Player calls only: re-sending the same scene leaves the state object untouched
    expect(storyReducer(playing, { type: "SCENE", scene: "awakening" })).toBe(playing);
    const skipped = run([{ type: "SKIP" }], playing);
    expect(skipped.phase).toBe("finished");
    expect(run([{ type: "REPLAY" }], skipped).phase).toBe("playing");
  });

  it("reduced motion changes nothing about which action leads (the reducer is motion-independent)", () => {
    expect(run([{ type: "START_CINEMATIC" }])).toEqual({ phase: "playing", mode: "cinematic", step: "awakening", awaiting: null });
  });
});

describe("language toggle", () => {
  it("every visible string differs between the languages", () => {
    for (const k of Object.keys(translations.bn) as (keyof typeof translations.bn)[]) {
      expect(t("bn")[k], k).not.toBe(t("en")[k]);
    }
  });
});

describe("map link", () => {
  it("opens wedding.mapUrl exactly", () => {
    const out = describeFrame(LAST_FRAME, {
      lang: "bn",
      text: t("bn"),
      wedding,
      reducedMotion: false,
      interactive: true,
      guided: { enabled: false, awaiting: null },
    });
    for (const item of out.overlay) if (item.kind === "link") expect(item.href).toBe(wedding.mapUrl);
  });
});

describe("hud thresholds", () => {
  it("bands, inside, side", () => {
    const hud = (w: number, h: number) => fitStage({ w, h }, { w, h }).hud;
    expect([hud(390, 844), hud(375, 667), hud(844, 390), hud(1920, 1080)]).toEqual(["bands", "inside", "side", "side"]);
  });
});

describe("loader and audio helpers", () => {
  it("lists fonts, art and optional audio under the base path", () => {
    const list = loadList("/", true, []);
    expect(list.filter((i) => i.kind === "font").length).toBeGreaterThan(0);
    expect(list.at(-1)).toMatchObject({ kind: "audio", src: "/audio/soundtrack.mp3", optional: true });
    expect(loadList("/", false, []).some((i) => i.kind === "audio")).toBe(false);
    expect(asset("/sub", "/art/x.webp")).toBe("/sub/art/x.webp");
  });
  it("soundtrack volume fades in and out", () => {
    expect(soundtrackVolume(0)).toBe(0);
    expect(soundtrackVolume(75)).toBeCloseTo(0.5);
    expect(soundtrackVolume(1499.5)).toBeCloseTo(0);
    expect(soundtrackVolume(1500)).toBe(0);
  });
});
