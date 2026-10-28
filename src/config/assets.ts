/**
 * Asset URL helper.
 * `base` is the public base path of the deployed site (Vite's BASE_URL, e.g. "/" for the production site).
 * Remotion code receives it through the `assetBase` input prop (never via import.meta.env, because
 * Remotion Studio uses webpack). When `base` is null the caller should fall back to staticFile().
 */
export const asset = (path: string, base: string): string => {
  const b = base.endsWith("/") ? base : `${base}/`;
  return `${b}${path.replace(/^\/+/, "")}`;
};

export const IMAGES = {
  paper: "images/paper.webp",
  grainTile: "images/grain-tile.webp",
  gardenFar: "images/garden-far.webp",
  gardenMid: "images/garden-mid.webp",
  gardenNear: "images/garden-near.webp",
} as const;

export const AUDIO_PATH = "audio/soundtrack.mp3";
