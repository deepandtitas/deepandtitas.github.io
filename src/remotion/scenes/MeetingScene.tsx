import { useCurrentFrame } from "remotion";
import { BEATS, SCENES } from "../../config/timeline";
import { MANDAP, MandapArch } from "../components/FloralMandap";
import { Layer } from "../components/Layer";
import { GuidedHotspot } from "../components/GuidedHotspot";
import { SceneHeading } from "../components/SceneHeading";
import { Bride, Groom } from "../components/WeddingCouple";
import { useExperience, useText } from "../experience";
import { COUPLE } from "../layout";
import { easeInOut, lerp, progress } from "../lib/anim";

const B = BEATS.meeting;
const SCENE_FRAMES = SCENES.meeting.end - SCENES.meeting.start;

/**
 * Scene 2 — two paths meet (frames 240–569). The garden itself lives in <GardenStage/>;
 * this scene adds the couple walking in, the gathering flowers and the heading.
 */
export const MeetingScene = () => {
  const frame = useCurrentFrame();
  const { reducedMotion, interactive, guided } = useExperience();
  const tx = useText();

  const walkP = reducedMotion ? 1 : progress(frame, B.groomWalk, easeInOut);
  const moving = reducedMotion ? 0 : 1 - progress(walkP, [0.9, 1]);
  const walk = frame * 0.3;
  const fade = reducedMotion ? progress(frame, [B.groomWalk[0], B.groomWalk[0] + 40]) : 1;

  const groomX = lerp(-230, COUPLE.groomX, walkP);
  const brideX = lerp(1310, COUPLE.brideX, walkP);
  // a slight approach in depth: they start a touch smaller/farther
  const depth = lerp(0.93, 1, walkP) * COUPLE.scale;
  const y = lerp(COUPLE.y - 26, COUPLE.y, walkP);

  // respectful greeting once they meet: palms together, a small bow
  const greet = progress(frame, B.meetPause, easeInOut);
  const bow = Math.sin(Math.PI * progress(frame, [B.meetPause[0] + 6, B.meetPause[1] + 18])) * 5;

  const gather = reducedMotion ? progress(frame, [B.flowersGather[0], B.flowersGather[0] + 20]) : progress(frame, B.flowersGather);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <SceneHeading text={tx.meeting} frame={frame} fadeIn={B.headingIn} fadeOutAt={SCENE_FRAMES - 70} />

      <Layer>
        <MandapArch gather={gather} />
        <Groom
          x={groomX}
          y={y}
          scale={depth}
          turn={0.7}
          walk={walk}
          moving={moving}
          pose={{ namaskar: greet }}
          headTilt={bow}
          lookDown={0.1 + greet * 0.35}
          opacity={fade}
        />
        <Bride
          x={brideX}
          y={y}
          scale={depth}
          turn={-0.7}
          walk={walk + 1.4}
          moving={moving}
          pose={{ namaskar: 1 }}
          paan
          headTilt={-bow}
          lookDown={0.3 + greet * 0.3}
          opacity={fade}
        />
      </Layer>

      {interactive && guided.awaiting === "wedding" && (
        <GuidedHotspot
          x={MANDAP.hotspot.x}
          y={MANDAP.hotspot.y}
          size={340}
          label={tx.hintMandap}
          ariaLabel={tx.hintMandap}
          labelPosition="above"
          onActivate={(e) => guided.onActivate?.("wedding", e)}
        />
      )}
    </div>
  );
};
