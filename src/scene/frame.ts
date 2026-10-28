// STUB by the orchestrator — owned by **scenes-b**, who replaces the body (keep these exports and types exactly).
import { ART, type ArtName } from "../art/manifest";
import type { Dictionary } from "../content/translations";
import type { WeddingDetails } from "../content/wedding";
import type { DrawOp } from "../render/ops";
import { about, I, scale, type Mat } from "../render/mat";
import type { HotspotAction, OverlayItem } from "../render/overlay";
import { atmosphereSprites } from "../story/choreography";
import { CAMERA_FOCUS, cameraZoom } from "../story/camera";
import { FRAMES_PER_BEAT, SCENE_BEATS } from "../story/timeline";
import { couple } from "./figure";
import { gardenBack, gardenForeground } from "./garden";
import { meeting } from "./meeting";
import { awakening } from "./awakening";
import { invitationScene } from "./invitation";
import { headings } from "./text";
import { spriteOps } from "./sprites";
import { weddingBack, weddingFront } from "./wedding";

export interface FrameContext {
  lang: "bn" | "en";
  /** The dictionary for `lang` (src/content/translations.ts). */
  text: Dictionary;
  /** src/content/wedding.ts */
  wedding: WeddingDetails;
  reducedMotion: boolean;
  /** Website (true) vs video render (false). */
  interactive: boolean;
  guided: { enabled: boolean; awaiting: HotspotAction | null };
}

export interface FrameOutput {
  draw: DrawOp[];
  overlay: OverlayItem[];
}

/** Everything on screen at a 60 FPS frame (0...2999). Pure. */
export const describeFrame = (frame: number, ctx: FrameContext): FrameOutput => {
  const beat = frame / FRAMES_PER_BEAT;
  const z = cameraZoom(beat, ctx.reducedMotion);
  const cam: Mat = z === 1 ? I : about(CAMERA_FOCUS.x, CAMERA_FOCUS.y, scale(z));

  const opening = awakening(beat - SCENE_BEATS.awakening.start, ctx);
  const titles = headings(beat, ctx);
  const meet = meeting(beat - SCENE_BEATS.meeting.start, ctx, cam);
  const union = weddingFront(beat - SCENE_BEATS.wedding.start, ctx, cam);
  const invite = invitationScene(beat - SCENE_BEATS.invitation.start, ctx);

  const draw: DrawOp[] = [{ kind: "image", art: "paper", m: I, alpha: 1 }];
  draw.push(...opening.draw);
  // the camera group: one persistent couple between the mandap and everything that hangs in front of it
  draw.push(...gardenBack(beat, ctx, cam));
  draw.push(...meet.draw);
  draw.push(...weddingBack(beat - SCENE_BEATS.wedding.start, ctx, cam));
  draw.push(...couple(beat, ctx, cam));
  draw.push(...union.draw);
  draw.push(...gardenForeground(beat, ctx, cam));
  draw.push(...titles.draw);
  draw.push(...invite.draw);
  draw.push(...spriteOps(atmosphereSprites(beat, ctx.reducedMotion)));

  const overlay: OverlayItem[] = [...opening.overlay, ...titles.overlay, ...meet.overlay, ...union.overlay, ...invite.overlay];
  return { draw, overlay };
};

/** Every image any frame can draw (the loader preloads these; renders wait for them). */
export const ALL_ART: readonly ArtName[] = Object.keys(ART) as ArtName[];
