import { SCENE_BEATS } from "../../story/timeline";

const W = SCENE_BEATS.wedding;
const END = SCENE_BEATS.invitation.end;
const AT = [0, 75, W.start + 150, W.start + 270, W.start + 330, W.start + 400, W.end + 20, END - 100, END - 0.5];
const VOL = [0, 0.5, 0.58, 0.88, 0.9, 0.62, 0.55, 0.5, 0];

/**
 * Volume envelope as a pure function of the beat: gentle fade-in, a swell through the wedding peak, a soft
 * resolve and a fade-out over the final seconds. Linear between stops, clamped outside.
 */
export const soundtrackVolume = (beat: number): number => {
  if (beat <= AT[0]) return VOL[0];
  for (let i = 1; i < AT.length; i++) {
    if (beat <= AT[i]) return VOL[i - 1] + ((VOL[i] - VOL[i - 1]) * (beat - AT[i - 1])) / (AT[i] - AT[i - 1]);
  }
  return VOL[VOL.length - 1];
};
