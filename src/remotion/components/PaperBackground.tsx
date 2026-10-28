import { Img } from "remotion";
import { IMAGES } from "../../config/assets";
import { useAsset } from "../experience";

/** Warm handmade-paper base. */
export const PaperBackground = () => {
  const url = useAsset();
  return <Img src={url(IMAGES.paper)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />;
};

/** Paper grain laid over everything to unify the painted layers. Never intercepts clicks. */
export const GrainOverlay = ({ opacity = 0.4 }: { opacity?: number }) => {
  const url = useAsset();
  return (
    <Img
      src={url(IMAGES.grain)}
      style={{
        position: "absolute",
        inset: 0,
        width: 1080,
        height: 1920,
        mixBlendMode: "multiply",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};
