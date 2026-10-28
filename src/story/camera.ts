import { BEATS, SCENE_BEATS } from "./timeline";
import { smoothKeyframes } from "./anim";
import { GAZE_POINT } from "./layout";

const M = SCENE_BEATS.meeting.start;
const W = SCENE_BEATS.wedding.start;

/** Where the camera pushes toward (composition px): just below the couple's faces. */
export const CAMERA_FOCUS = { x: GAZE_POINT.x, y: GAZE_POINT.y + 60 } as const;

/**
 * The "camera": a slow push toward the couple while they greet, a closer push for the শুভদৃষ্টি (when their eyes
 * meet), a gentler one for the মালাবদল, and back to the full frame before the invitation. A pure function of the
 * GLOBAL beat; the scale is applied about CAMERA_FOCUS.
 */
export const cameraZoom = (beat: number, reduced: boolean): number =>
  reduced
    ? 1
    : smoothKeyframes(
        beat,
        [M + 200, M + 300, W + 20, W + 70, W + 130, W + 200, W + 236, W + 262, W + 300, W + 380, W + BEATS.wedding.tableau[1]],
        [1, 1.04, 1.04, 1, 1, 1.15, 1.15, 1.04, 1.06, 1.06, 1],
      );
