// STUB by the orchestrator — owned by **scenes-b**, who replaces the body (keep these exports and types exactly).
import type { ArtName } from "../art/manifest";
import type { Dictionary } from "../content/translations";
import type { WeddingDetails } from "../content/wedding";
import type { DrawOp } from "../render/ops";
import type { HotspotAction, OverlayItem } from "../render/overlay";

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

/** Everything on screen at a 60 FPS frame (0…2999). Pure. */
export const describeFrame = (_frame: number, _ctx: FrameContext): FrameOutput => ({ draw: [], overlay: [] });

/** Every image any frame can draw (the loader preloads these; renders wait for them). */
export const ALL_ART: readonly ArtName[] = [];
