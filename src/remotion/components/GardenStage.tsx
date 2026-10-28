import { useCurrentFrame } from "remotion";
import { BEATS, SCENES } from "../../config/timeline";
import { progress, ramp } from "../lib/anim";
import { PATH_T_LOTUS, pathCenterline, pathPoint, pathPolygon } from "../lib/path";
import { useExperience } from "../experience";
import { GardenFar, GardenMid, GardenNear } from "./Garden";

const GOLD = "#c49a52";

/** Parallax drift as a pure function of the GLOBAL frame, so meeting → wedding stays continuous. */
export const gardenDrift = (globalFrame: number, reduced: boolean): number =>
  reduced ? 0 : ramp(globalFrame, [SCENES.meeting.start, SCENES.wedding.end], 22, -22, (t) => t);

/** Dusk amount 0..1 (the garden warms and darkens as the wedding scene begins). */
export const duskAt = (globalFrame: number): number =>
  progress(globalFrame, [SCENES.wedding.start + BEATS.wedding.dusk[0], SCENES.wedding.start + BEATS.wedding.dusk[1]]);

/**
 * The garden behind the couple: far sky/trees/meadow, the winding pathway, and the mid-ground trees,
 * plus the dusk wash. Mounted by the composition from the meeting scene onward.
 * `frame` here is local to a Sequence starting at SCENES.meeting.start.
 */
export const GardenBack = () => {
  const local = useCurrentFrame();
  const g = local + SCENES.meeting.start;
  const { reducedMotion } = useExperience();
  const B = BEATS.meeting;
  const gardenIn = progress(local, B.gardenIn);
  const grow = progress(local, B.pathWiden);
  const drift = gardenDrift(g, reducedMotion);
  const dusk = duskAt(g);
  const centre = pathPoint(0.5);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <GardenFar drift={drift} opacity={gardenIn} />
      {/* sun warmth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: gardenIn * (1 - dusk * 0.8),
          background: "radial-gradient(circle at 76% 24%, rgba(255,236,170,.55) 0, rgba(255,236,170,0) 52%)",
        }}
      />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        {/* the alpana curve still drawn for the first frames, then it becomes the path */}
        <path
          d={pathCenterline(PATH_T_LOTUS, 1)}
          fill="none"
          stroke="#781f2b"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={(1 - gardenIn) * 0.85}
        />
        <g opacity={gardenIn}>
          <path d={pathPolygon(grow)} fill="#e2cb98" fillOpacity={0.96} />
          <path d={pathPolygon(grow, -26)} fill="#efdcae" fillOpacity={0.9} />
          <path d={pathPolygon(grow)} fill="none" stroke={GOLD} strokeWidth={3} strokeOpacity={0.75} />
          <path
            d={pathCenterline(0, 1)}
            fill="none"
            stroke="#fff3cf"
            strokeWidth={10}
            strokeOpacity={0.55}
            strokeLinecap="round"
            strokeDasharray="2 26"
          />
        </g>
        <circle cx={centre.x} cy={centre.y} r={0} fill="none" />
      </svg>
      <GardenMid drift={drift} opacity={gardenIn} />
      {/* dusk wash: the garden turns into an evening wedding setting */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: dusk,
          background:
            "linear-gradient(180deg, rgba(70,28,48,.66) 0%, rgba(150,62,38,.36) 52%, rgba(112,40,26,.46) 100%)",
        }}
      />
    </div>
  );
};

/** Foreground leaves and blooms drawn over the couple. */
export const GardenForeground = () => {
  const local = useCurrentFrame();
  const g = local + SCENES.meeting.start;
  const { reducedMotion } = useExperience();
  const gardenIn = progress(local, BEATS.meeting.gardenIn);
  const dusk = duskAt(g);
  const drift = gardenDrift(g, reducedMotion);
  // the foliage parts just before the invitation card's edge slides into view
  const parting = 1 - progress(g, [SCENES.wedding.end - 40, SCENES.wedding.end + 10]);
  return <GardenNear drift={drift} push={1} opacity={gardenIn * (1 - dusk * 0.18) * parting} />;
};
