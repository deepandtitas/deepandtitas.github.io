import { Img } from "remotion";
import { IMAGES } from "../../config/assets";
import { useAsset } from "../experience";

/** Warm handmade-paper base. */
export const PaperBackground = () => {
  const url = useAsset();
  return <Img src={url(IMAGES.paper)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />;
};

export const GRAIN_TILE = 256;

/**
 * Paper grain: a small tile repeated with CSS and laid over everything with NORMAL blending.
 * (A full-frame image with mix-blend-mode forces the browser to composite the whole frame on every change.)
 * A hidden <Img> makes Remotion wait for the tile to load before rendering a frame.
 */
export const GrainOverlay = ({ opacity = 0.42 }: { opacity?: number }) => {
  const url = useAsset();
  const src = url(IMAGES.grainTile);
  return (
    <>
      <Img src={src} style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${src}")`,
          backgroundSize: `${GRAIN_TILE}px ${GRAIN_TILE}px`,
          opacity,
          pointerEvents: "none",
          willChange: "transform",
        }}
      />
    </>
  );
};
