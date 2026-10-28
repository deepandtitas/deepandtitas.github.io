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
  paper: "images/paper.svg",
  grain: "images/grain.svg",
  gardenFar: "images/garden-far.svg",
  gardenMid: "images/garden-mid.svg",
  gardenNear: "images/garden-near.svg",
} as const;

export const AUDIO_PATH = "audio/soundtrack.mp3";
