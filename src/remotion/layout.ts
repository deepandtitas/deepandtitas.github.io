import { MEET_Y } from "./lib/path";

/** Where the couple stands (feet line) — shared by the meeting and wedding scenes. */
export const COUPLE = {
  y: MEET_Y,
  scale: 0.84,
  groomX: 415,
  brideX: 665,
} as const;

/** Face level of the couple, for the shubhodrishti glow. */
export const GAZE_POINT = { x: 540, y: MEET_Y - 598 * COUPLE.scale } as const;

/** Card edge peeking into frame at the very end of the wedding scene (and where the ornament lands). */
export const CARD_EDGE_Y = 1575;
export const ORNAMENT_POS = { x: 540, y: 1545 } as const;
export const ORNAMENT_SCALE = 0.62;

/** Hotspot anchors for guided mode (composition coordinates). */
export const HOTSPOTS = {
  lotus: { x: 540, y: 1010 },
  path: { x: 478, y: 1560 },
  ornament: ORNAMENT_POS,
} as const;
