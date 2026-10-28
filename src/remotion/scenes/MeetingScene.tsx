import { BEATS } from "../../config/timeline";
import { MANDAP, MandapArch } from "../components/FloralMandap";
import { GuidedHotspot } from "../components/GuidedHotspot";
import { Bride, Groom, type FigureProps } from "../components/WeddingCouple";
import { useExperience, useText } from "../experience";
import { COUPLE } from "../layout";
import { easeInOut, lerp, progress } from "../lib/anim";
import { useBeat } from "../lib/time";

const B = BEATS.meeting;
/** Screen distance of half a walk cycle (one step). */
const STEP = 58;

const START = { groom: -230, bride: 1310 } as const;

/** Where each of them stands at a scene-local beat (walking in along the path, easing to a stop). */
const posAt = (who: "groom" | "bride", f: number, reduced: boolean): number => {
  const p = reduced ? 1 : progress(f, who === "groom" ? B.groomWalk : B.brideWalk, easeInOut);
  return lerp(START[who], who === "groom" ? COUPLE.groomX : COUPLE.brideX, p);
};

/** Pose of both figures at a scene-local beat. Pure, so the end of this scene is exactly the wedding's first frame. */
export const meetingPose = (f: number, reduced: boolean): { groom: FigureProps; bride: FigureProps & { paan: number } } => {
  const walkP = reduced ? 1 : progress(f, B.groomWalk, easeInOut);
  const depth = lerp(0.93, 1, walkP) * COUPLE.scale;
  const y = lerp(COUPLE.y - 26, COUPLE.y, walkP);
  const moving = reduced ? 0 : progress(f, [B.groomWalk[0], B.groomWalk[0] + 12]) * (1 - progress(walkP, [0.9, 1]));
  const vel = (who: "groom" | "bride") => (posAt(who, f, reduced) - posAt(who, f - 1, reduced)) / depth;
  const gx = posAt("groom", f, reduced);
  const bx = posAt("bride", f, reduced);

  // they slow, turn to each other, and greet with folded hands and a small bow
  const greet = progress(f, B.meetPause, easeInOut);
  const bow = Math.sin(Math.PI * progress(f, [B.meetPause[0] + 6, B.meetPause[1] + 18]));
  const smile = progress(f, [B.meetPause[0] - 10, B.meetPause[1]]);

  return {
    groom: {
      x: gx,
      y,
      scale: depth,
      t: f,
      walk: ((gx - START.groom) / STEP) * Math.PI,
      moving,
      vel: vel("groom"),
      turn: 0.7,
      arms: { l: { namaskar: greet }, r: { namaskar: greet } },
      bow: bow * 0.6,
      headTilt: bow * 4,
      face: { gaze: 0.8, look: 0.1 + greet * 0.3, smile: 0.25 + smile * 0.45 },
      reduced,
    },
    bride: {
      x: bx,
      y,
      scale: depth,
      t: f,
      walk: ((START.bride - bx) / STEP) * Math.PI + 1.4,
      moving,
      vel: vel("bride"),
      turn: -0.7,
      // she carries the two betel leaves of the শুভদৃষ্টি before her, between her palms
      arms: { l: { chest: 1 }, r: { chest: 1 } },
      paan: 0.72,
      bow: bow * 0.6,
      headTilt: -bow * 4,
      face: { gaze: -0.8, look: 0.35 + greet * 0.25, smile: 0.2 + smile * 0.35, blush: smile * 0.6 },
      reduced,
    },
  };
};

/**
 * Scene 2 — two paths meet. The garden lives in <GardenStage/>; this scene adds the couple walking in, their
 * greeting, and — only once they have greeted — the marigolds that rise from the garden into an arch above them.
 */
export const MeetingScene = () => {
  const f = useBeat();
  const { reducedMotion, interactive, guided } = useExperience();
  const tx = useText();
  const pose = meetingPose(f, reducedMotion);
  const fade = reducedMotion ? progress(f, [B.groomWalk[0], B.groomWalk[0] + 40]) : 1;
  const gather = reducedMotion ? progress(f, [B.flowersGather[0], B.flowersGather[0] + 20]) : progress(f, B.flowersGather, (t) => t);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <MandapArch gather={gather} />
      <Groom {...pose.groom} opacity={fade} />
      <Bride {...pose.bride} opacity={fade} />

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
