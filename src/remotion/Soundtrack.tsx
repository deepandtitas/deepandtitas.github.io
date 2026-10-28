import { Html5Audio } from "remotion";
import { SCENE_BEATS } from "../config/timeline";
import { keyframes } from "./lib/anim";
import { useBeat } from "./lib/time";

const W = SCENE_BEATS.wedding;
const END = SCENE_BEATS.invitation.end;

/**
 * Volume envelope as a pure function of the beat: gentle fade-in, a swell through the wedding scene's
 * emotional peak, a soft resolve, and a fade-out over the final seconds. Never abrupt.
 */
export const soundtrackVolume = (beat: number): number =>
  keyframes(
    beat,
    [0, 75, W.start + 150, W.start + 270, W.start + 330, W.start + 400, W.end + 20, END - 100, END - 0.5],
    [0, 0.5, 0.58, 0.88, 0.9, 0.62, 0.55, 0.5, 0],
  );

/**
 * Renders nothing unless a soundtrack URL was provided, so a missing file never breaks playback.
 * A native <audio> element (decoded by the browser, off the main thread) rather than a JS decoder: the story's
 * animation keeps the main thread to itself on phones.
 */
export const Soundtrack = ({ src }: { src: string | null }) => {
  const beat = useBeat();
  if (!src) return null;
  return <Html5Audio src={src} volume={soundtrackVolume(beat)} />;
};
