import { Audio } from "@remotion/media";
import { useCurrentFrame } from "remotion";
import { DURATION, SCENES } from "../config/timeline";
import { keyframes } from "./lib/anim";

const W = SCENES.wedding;

/**
 * Volume envelope as a pure function of the frame: gentle fade-in, a swell through the wedding scene's
 * emotional peak, a soft resolve, and a fade-out over the final seconds. Never abrupt.
 */
export const soundtrackVolume = (frame: number): number =>
  keyframes(
    frame,
    [0, 75, W.start + 150, W.start + 270, W.start + 330, W.start + 400, W.end + 20, DURATION - 100, DURATION - 1],
    [0, 0.5, 0.58, 0.88, 0.9, 0.62, 0.55, 0.5, 0],
  );

/** Renders nothing unless a soundtrack URL was provided, so a missing file never breaks playback. */
export const Soundtrack = ({ src }: { src: string | null }) => {
  const frame = useCurrentFrame();
  if (!src) return null;
  return <Audio src={src} volume={soundtrackVolume(frame)} />;
};
