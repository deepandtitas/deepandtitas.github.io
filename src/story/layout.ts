/**
 * Every position in the composition (1080 x 1920 px, y down) lives here. Scenes read these; nothing else hard-codes
 * a coordinate.
 */
import { MEET_Y } from "./path";

/** Where the couple stands (feet line, px) — shared by the meeting and wedding scenes. */
export const COUPLE = {
  y: MEET_Y,
  scale: 0.84,
  groomX: 415,
  brideX: 665,
} as const;

/** Face level of the couple (px), for the শুভদৃষ্টি glow. */
export const GAZE_POINT = { x: 540, y: MEET_Y - 598 * COUPLE.scale } as const;

/** Card edge peeking into frame at the very end of the wedding scene (px) and where the ornament lands. */
export const CARD_EDGE_Y = 1575;
export const ORNAMENT_POS = { x: 540, y: 1545 } as const;
export const ORNAMENT_SCALE = 0.62;

/** Geometry shared by the meeting scene (gathering flowers) and the wedding scene (finished mandap), px. */
export const MANDAP = {
  cx: 540,
  baseY: MEET_Y,
  postX: [205, 875] as const,
  archCy: 650,
  archRx: 330,
  archRy: 235,
  /** Centre of the gathered flowers — where the guided hotspot sits. */
  hotspot: { x: 540, y: 510 },
} as const;

/** Hotspot anchors for guided mode (composition px) and their tap-target sizes. */
export const HOTSPOTS = {
  lotus: { x: 540, y: 1010 },
  path: { x: 478, y: 1560 },
  ornament: ORNAMENT_POS,
  mandap: MANDAP.hotspot,
} as const;
export const HOTSPOT_SIZE = { path: 300, mandap: 340, ornament: 300 } as const;

/** Canvas bounds (px) of the sprite groups: garlands, arch while flowers fly in, arch gathered, diyas. */
export const GARLAND_BOX = { x: 180, y: 640, w: 720, h: 820 };
export const ARCH_BOX = { x: 0, y: 160, w: 1080, h: 1160 };
export const ARCH_BOX_GATHERED = { x: 160, y: 330, w: 760, h: 400 };
export const DIYA_BOX = { x: 0, y: 1360, w: 1080, h: 400 };

/** Flowering bushes in the garden (px) where the arch flowers rise from. */
export const BUSHES = [
  { x: 190, y: 1010 },
  { x: 40, y: 1150 },
  { x: 890, y: 1000 },
  { x: 1050, y: 1120 },
] as const;

/** Clay lamps along the front of the mandap (px, feet of each diya). */
export const DIYA_SPOTS = [
  { x: 120, y: 1560 },
  { x: 215, y: 1605 },
  { x: 345, y: 1622 },
  { x: 460, y: 1632 },
  { x: 620, y: 1632 },
  { x: 735, y: 1622 },
  { x: 865, y: 1605 },
  { x: 960, y: 1560 },
] as const;

/** Sun glow and mandap light discs: centre and radius (px). */
export const MANDAP_GLOW = { x: 540, y: 1040, r: 760 } as const;
export const GAZE_GLOW = { x: GAZE_POINT.x, y: GAZE_POINT.y + 10, r: 230 } as const;
