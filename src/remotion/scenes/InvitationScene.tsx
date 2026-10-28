import { BEATS } from "../../config/timeline";
import { Emblem } from "../components/Emblem";
import { CARD, InvitationCard } from "../components/InvitationCard";
import { CARD_EDGE_Y, ORNAMENT_SCALE } from "../layout";
import { Easing } from "remotion";
import { lerp, progress } from "../lib/anim";
import { useExperience } from "../experience";
import { useBeat } from "../lib/time";

const B = BEATS.invitation;

/** The card's rise: gathers pace gently, then a long, soft landing that ends as the emblem blooms and the text begins. */
const rise = Easing.bezier(0.42, 0, 0.1, 1);

/**
 * Scene 4 — the invitation. The card rises from the edge revealed at the end of the
 * wedding scene, the ornament settles into the emblem, then each element appears in turn.
 * The last frame is the fully revealed card, which stays on screen after playback ends.
 */
export const InvitationScene = () => {
  const f = useBeat();
  const { reducedMotion } = useExperience();

  const e = reducedMotion ? 1 : progress(f, B.cardUnfold, rise);
  const top = lerp(CARD_EDGE_Y, CARD.top, e);
  const emblemY = top + lerp(-30, 190, e);
  const emblemScale = lerp(ORNAMENT_SCALE, 1, e);
  const backdrop = progress(f, [0, 50]);
  const emblemBloom = progress(f, B.emblem);
  const halo = 1 - progress(f, [B.emblem[1], B.emblem[1] + 60]) * 0.6;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: backdrop,
          background: "radial-gradient(circle at 50% 28%, #62262d 0%, #3b1b1c 58%, #26110f 100%)",
        }}
      />
      <InvitationCard frame={f} top={top} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <Emblem x={540} y={emblemY} scale={emblemScale} bloom={0.55 + 0.45 * emblemBloom} halo={halo} />
      </svg>
    </div>
  );
};
