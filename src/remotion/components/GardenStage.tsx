import { memo } from "react";
import { BEATS, SCENE_BEATS } from "../../config/timeline";
import { progress, ramp } from "../lib/anim";
import { PATH_T_LOTUS, pathCenterline, pathPolygon } from "../lib/path";
import { useBeat } from "../lib/time";
import { useExperience } from "../experience";
import { GardenFar, GardenLights, GardenMid, GardenNear } from "./Garden";

const GOLD = "#c49a52";

/** The winding path. Memoised: its geometry only changes while the path widens (the first ~70 beats of the garden). */
const GardenPath = memo(function GardenPath({ grow, gardenIn }: { grow: number; gardenIn: number }) {
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      {/* the alpana curve still drawn for the first frames, then it becomes the path */}
      <path d={pathCenterline(PATH_T_LOTUS, 1)} fill="none" stroke="#781f2b" strokeWidth={5} strokeLinecap="round" opacity={(1 - gardenIn) * 0.85} />
      <g opacity={gardenIn}>
        <path d={pathPolygon(grow)} fill="#e2cb98" fillOpacity={0.96} />
        <path d={pathPolygon(grow, -26)} fill="#efdcae" fillOpacity={0.9} />
        <path d={pathPolygon(grow)} fill="none" stroke={GOLD} strokeWidth={3} strokeOpacity={0.75} />
        <path d={pathCenterline(0, 1)} fill="none" stroke="#fff3cf" strokeWidth={10} strokeOpacity={0.55} strokeLinecap="round" strokeDasharray="2 26" />
      </g>
    </svg>
  );
});

const q = (n: number) => Math.round(n * 200) / 200;

/** Parallax drift as a pure function of the GLOBAL beat, so meeting → wedding stays continuous. */
export const gardenDrift = (globalBeat: number, reduced: boolean): number =>
  reduced ? 0 : ramp(globalBeat, [SCENE_BEATS.meeting.start, SCENE_BEATS.wedding.end], 22, -22, (t) => t);

/** Dusk amount 0..1 (the garden warms and darkens as the wedding scene begins). */
export const duskAt = (globalBeat: number): number =>
  progress(globalBeat, [SCENE_BEATS.wedding.start + BEATS.wedding.dusk[0], SCENE_BEATS.wedding.start + BEATS.wedding.dusk[1]]);

/**
 * The garden behind the couple: far sky/meadow, the winding pathway, the framing trees, the dusk wash and the string
 * lights that come on with it. Mounted by the composition from the meeting scene onward.
 * The beat here is local to a Sequence starting at the meeting scene.
 */
export const GardenBack = () => {
  const local = useBeat();
  const g = local + SCENE_BEATS.meeting.start;
  const { reducedMotion } = useExperience();
  const B = BEATS.meeting;
  const gardenIn = progress(local, B.gardenIn);
  const grow = q(progress(local, B.pathWiden));
  const drift = gardenDrift(g, reducedMotion);
  const dusk = duskAt(g);
  const lights = progress(g, [SCENE_BEATS.wedding.start + 90, SCENE_BEATS.wedding.start + 200]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <GardenFar drift={drift} opacity={gardenIn} />
      {/* sun warmth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: gardenIn * (1 - dusk * 0.8),
          willChange: "opacity",
          background: "radial-gradient(circle at 76% 24%, rgba(255,236,170,.5) 0, rgba(255,236,170,0) 52%)",
        }}
      />
      <GardenPath grow={grow} gardenIn={q(gardenIn)} />
      <GardenMid drift={drift} opacity={gardenIn} />
      {/* dusk wash: the garden turns into an evening wedding setting */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: dusk,
          visibility: dusk > 0.002 ? "visible" : "hidden",
          willChange: "opacity",
          background: "linear-gradient(180deg, rgba(64,24,46,.68) 0%, rgba(150,62,38,.36) 52%, rgba(112,40,26,.46) 100%)",
        }}
      />
      <GardenLights drift={drift} opacity={lights} />
    </div>
  );
};

/** Foreground leaves and blooms drawn over the couple. They part just before the invitation card rises. */
export const GardenForeground = () => {
  const local = useBeat();
  const g = local + SCENE_BEATS.meeting.start;
  const { reducedMotion } = useExperience();
  const gardenIn = progress(local, BEATS.meeting.gardenIn);
  const dusk = duskAt(g);
  const drift = gardenDrift(g, reducedMotion);
  const part = progress(g, [SCENE_BEATS.wedding.end - 50, SCENE_BEATS.wedding.end + 20]);
  return <GardenNear drift={drift} part={part} opacity={gardenIn * (1 - dusk * 0.15)} />;
};
