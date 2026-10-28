import { Html5Audio, useCurrentFrame } from "remotion";
import { keyframes } from "../story/anim";
import { FRAMES_PER_BEAT, SCENE_BEATS } from "../story/timeline";

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
 * Video renders only: renders nothing unless a soundtrack URL was provided, so a missing file never breaks a render.
 * The website plays the track from the shell with a plain audio element.
 */
export const Soundtrack = ({ src }: { src: string | null }) => {
  const beat = useCurrentFrame() / FRAMES_PER_BEAT;
  if (!src) return null;
  return <Html5Audio src={src} volume={soundtrackVolume(beat)} />;
};
