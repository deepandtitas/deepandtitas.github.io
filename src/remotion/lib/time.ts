import { useCurrentFrame } from "remotion";
import { FRAMES_PER_BEAT } from "../../config/timeline";

/**
 * The current (Sequence-local) time in beats (1/30 s), fractional at 60 FPS.
 * All pacing in BEATS is authored in beats, so animation reads this instead of the raw frame.
 */
export const useBeat = (): number => useCurrentFrame() / FRAMES_PER_BEAT;
