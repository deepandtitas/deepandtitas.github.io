/** Scene 2: the marigolds that rise from the garden into an arch once the couple have greeted, and the guided hotspot. */
import { I, apply, type Mat } from "../render/mat";
import type { OverlayItem } from "../render/overlay";
import { archSprites, flowerGather } from "../story/choreography";
import { HOTSPOT_SIZE, MANDAP } from "../story/layout";
import { sceneDuration } from "../story/timeline";
import type { FrameContext, FrameOutput } from "./frame";
import { spriteOps } from "./sprites";

/**
 * The meeting scene's own drawing (the couple is drawn by `couple`) and its tap target.
 * @param beat SCENE-LOCAL beat (0 at the meeting's start); out of range nothing is drawn
 * @param cam camera matrix (default identity): applied to the flowers; the hotspot moves and grows with it
 */
export const meeting = (beat: number, ctx: FrameContext, cam: Mat = I): FrameOutput => {
  const mounted = beat >= 0 && beat < sceneDuration("meeting");
  const at = apply(cam, MANDAP.hotspot);
  const hotspot: OverlayItem = {
    kind: "hotspot",
    id: "hotspot-wedding",
    x: at.x,
    y: at.y,
    size: HOTSPOT_SIZE.mandap * cam[0],
    label: ctx.text.hintMandap,
    ariaLabel: ctx.text.hintMandap,
    labelPosition: "above",
    visible: mounted && ctx.interactive && ctx.guided.awaiting === "wedding",
    action: "wedding",
  };
  const draw = mounted ? spriteOps(archSprites(flowerGather(beat, ctx.reducedMotion)), cam) : [];
  return { draw, overlay: [hotspot] };
};
