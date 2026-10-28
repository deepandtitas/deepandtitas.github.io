import { Img } from "remotion";
import { IMAGES } from "../../config/assets";
import { useAsset } from "../experience";

interface Props {
  /** Horizontal parallax drift in px; far/mid/near layers scale it differently. */
  drift?: number;
  /** Subtle zoom of the foreground layer (1 = none). */
  push?: number;
  opacity?: number;
}

const layer = (x: number, scale = 1) => ({
  position: "absolute" as const,
  left: -60,
  top: 0,
  width: 1200,
  height: 1920,
  transform: `translateX(${x.toFixed(2)}px) scale(${scale})`,
  transformOrigin: "50% 100%",
  willChange: "transform" as const,
});

export const GardenFar = ({ drift = 0, opacity = 1 }: Props) => {
  const url = useAsset();
  return <Img src={url(IMAGES.gardenFar)} style={{ ...layer(drift * 0.35), opacity }} />;
};

export const GardenMid = ({ drift = 0, opacity = 1 }: Props) => {
  const url = useAsset();
  return <Img src={url(IMAGES.gardenMid)} style={{ ...layer(drift * 0.8), opacity }} />;
};

export const GardenNear = ({ drift = 0, push = 1, opacity = 1 }: Props) => {
  const url = useAsset();
  return <Img src={url(IMAGES.gardenNear)} style={{ ...layer(drift * 1.5, push), opacity }} />;
};
