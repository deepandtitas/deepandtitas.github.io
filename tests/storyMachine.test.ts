import { describe, expect, it } from "vitest";
import { SCENE_ORDER } from "../src/config/timeline";
import {
  initialStoryState,
  storyReducer,
  type StoryAction,
  type StoryState,
} from "../src/app/state/storyMachine";

const run = (actions: StoryAction[], from: StoryState = initialStoryState) =>
  actions.reduce(storyReducer, from);

describe("storyMachine", () => {
  it("starts on the intro screen", () => {
    expect(initialStoryState.phase).toBe("intro");
    expect(initialStoryState.mode).toBeNull();
  });

  it("cinematic: plays straight through and ends on the invitation", () => {
    const playing = run([{ type: "START_CINEMATIC" }]);
    expect(playing).toMatchObject({ phase: "playing", mode: "cinematic", step: "awakening" });
    const scenes = run([{ type: "SCENE", scene: "meeting" }, { type: "SCENE", scene: "wedding" }], playing);
    expect(scenes.step).toBe("wedding");
    const done = run([{ type: "ENDED" }], scenes);
    expect(done).toMatchObject({ phase: "finished", step: "invitation" });
  });

  it("cinematic never pauses at scene boundaries", () => {
    const playing = run([{ type: "START_CINEMATIC" }]);
    expect(storyReducer(playing, { type: "BOUNDARY", scene: "awakening" })).toBe(playing);
  });

  it("guided: advances lotus → path → mandap → ornament in order", () => {
    let s = run([{ type: "START_GUIDED" }]);
    expect(s).toMatchObject({ phase: "awaiting", awaiting: "awakening" });

    const seen: string[] = [];
    for (const scene of SCENE_ORDER) {
      expect(s.awaiting).toBe(scene);
      s = storyReducer(s, { type: "ACTIVATE", target: scene });
      expect(s).toMatchObject({ phase: "playing", step: scene, awaiting: null });
      seen.push(scene);
      s = storyReducer(s, { type: "BOUNDARY", scene });
    }
    expect(seen).toEqual([...SCENE_ORDER]);
    expect(s.phase).toBe("finished"); // after the final scene's boundary there is nothing left to offer
  });

  it("guided: pauses at each boundary and offers exactly the next scene", () => {
    let s = run([{ type: "START_GUIDED" }, { type: "ACTIVATE", target: "awakening" }]);
    s = storyReducer(s, { type: "BOUNDARY", scene: "awakening" });
    expect(s).toMatchObject({ phase: "awaiting", awaiting: "meeting" });
    s = run([{ type: "ACTIVATE", target: "meeting" }, { type: "BOUNDARY", scene: "meeting" }], s);
    expect(s).toMatchObject({ phase: "awaiting", awaiting: "wedding" });
    s = run([{ type: "ACTIVATE", target: "wedding" }, { type: "BOUNDARY", scene: "wedding" }], s);
    expect(s).toMatchObject({ phase: "awaiting", awaiting: "invitation" });
  });

  it("guided: taps cannot skip ahead or repeat", () => {
    const s = run([{ type: "START_GUIDED" }]);
    // trying to jump straight to the wedding or invitation is ignored
    expect(storyReducer(s, { type: "ACTIVATE", target: "wedding" })).toBe(s);
    expect(storyReducer(s, { type: "ACTIVATE", target: "invitation" })).toBe(s);
    // while a scene is playing, further taps do nothing
    const playing = storyReducer(s, { type: "ACTIVATE", target: "awakening" });
    expect(storyReducer(playing, { type: "ACTIVATE", target: "awakening" })).toBe(playing);
    expect(storyReducer(playing, { type: "ACTIVATE", target: "meeting" })).toBe(playing);
  });

  it("guided: a stale boundary for a different scene is ignored", () => {
    const playing = run([{ type: "START_GUIDED" }, { type: "ACTIVATE", target: "awakening" }]);
    expect(storyReducer(playing, { type: "BOUNDARY", scene: "meeting" })).toBe(playing);
  });

  it("skip goes straight to the finished invitation from any phase", () => {
    for (const from of [
      initialStoryState,
      run([{ type: "START_CINEMATIC" }]),
      run([{ type: "START_GUIDED" }]),
    ]) {
      expect(storyReducer(from, { type: "SKIP" })).toMatchObject({
        phase: "finished",
        step: "invitation",
        awaiting: null,
      });
    }
  });

  it("replay restarts the cinematic from the beginning", () => {
    const finished = run([{ type: "SKIP" }]);
    expect(storyReducer(finished, { type: "REPLAY" })).toMatchObject({
      phase: "playing",
      mode: "cinematic",
      step: "awakening",
    });
  });

  it("ignores an 'ended' event while still on the intro screen", () => {
    expect(storyReducer(initialStoryState, { type: "ENDED" })).toBe(initialStoryState);
  });

  it("ignores scene updates unless playing", () => {
    const awaiting = run([{ type: "START_GUIDED" }]);
    expect(storyReducer(awaiting, { type: "SCENE", scene: "wedding" })).toBe(awaiting);
  });

  it("guided: a scene update from a skipped frame cannot advance the step past the checkpoint", () => {
    const playing = run([{ type: "START_GUIDED" }, { type: "ACTIVATE", target: "awakening" }]);
    // the Player jumped from frame 1048 straight to 1050 etc. — step must stay put until the boundary logic runs
    expect(storyReducer(playing, { type: "SCENE", scene: "meeting" })).toBe(playing);
    expect(storyReducer(playing, { type: "BOUNDARY", scene: "awakening" })).toMatchObject({
      phase: "awaiting",
      awaiting: "meeting",
    });
  });
});
