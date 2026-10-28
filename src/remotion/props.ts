import type { SyntheticEvent } from "react";
import type { SceneId } from "../config/timeline";
import type { Lang } from "../config/translations";

export interface GuidedProps {
  /** true while the guest is exploring in guided mode (a lotus bud is visible from the first frame). */
  enabled: boolean;
  /** The scene whose start the guest can trigger right now (hotspot is shown), or null. */
  awaiting: SceneId | null;
  onActivate?: (target: SceneId, event: SyntheticEvent) => void;
}

/**
 * Props of the composition. Everything except the callback is serialisable, so the same
 * composition works in Remotion Studio, in renders (defaults) and in the website Player.
 */
export type WeddingProps = {
  lang: Lang;
  /** Public base path of the website. null → use Remotion's staticFile() (Studio / renders). */
  assetBase: string | null;
  /** URL of the soundtrack, or null for a silent experience. */
  audioSrc: string | null;
  reducedMotion: boolean;
  /** true in the website (real links/hotspots); false for video renders. */
  interactive: boolean;
  guided: GuidedProps;
};

export const defaultWeddingProps: WeddingProps = {
  lang: "bn",
  assetBase: null,
  audioSrc: null,
  reducedMotion: false,
  interactive: false,
  guided: { enabled: false, awaiting: null },
};
