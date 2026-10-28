import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { SCENES, SCENE_OVERLAP, sceneDuration } from "../config/timeline";
import { GardenBack, GardenForeground } from "./components/GardenStage";
import { FloatingPetals } from "./components/FloatingPetals";
import { GoldDust } from "./components/GoldDust";
import { GrainOverlay, PaperBackground } from "./components/PaperBackground";
import { SharedDefs } from "./components/SharedDefs";
import { ExperienceContext } from "./experience";
import { FontGate } from "./FontGate";
import { keyframes } from "./lib/anim";
import type { WeddingProps } from "./props";
import { AwakeningScene } from "./scenes/AwakeningScene";
import { InvitationScene } from "./scenes/InvitationScene";
import { MeetingScene } from "./scenes/MeetingScene";
import { WeddingScene } from "./scenes/WeddingScene";
import { Soundtrack } from "./Soundtrack";

const S = SCENES;
const span = (id: keyof typeof SCENES) => sceneDuration(id) + SCENE_OVERLAP[id];

/** How many petals are in the air at a given global frame (0..1.2). */
const petalIntensity = (f: number): number =>
  keyframes(
    f,
    [S.meeting.start + 20, S.meeting.start + 100, S.meeting.end - 20, S.wedding.start + 200, S.wedding.start + 300, S.wedding.start + 390, S.wedding.start + 430, S.wedding.start + 460],
    [0, 0.8, 0.9, 0.3, 1.2, 0.5, 0.15, 0],
  );

const dustIntensity = (f: number): number =>
  keyframes(
    f,
    [20, 90, S.meeting.start, S.wedding.start + 200, S.wedding.start + 330, S.wedding.end, S.invitation.start + 200, S.invitation.end - 1],
    [0, 0.55, 0.4, 0.45, 1, 0.5, 0.35, 0.12],
  );

/** Global-frame layers: floating petals and gold dust drift across scene boundaries. */
const Atmosphere = ({ reduced }: { reduced: boolean }) => {
  const frame = useCurrentFrame();
  if (reduced) return null;
  const kind = frame >= S.wedding.start + 200 && frame < S.wedding.end ? "marigold" : "mixed";
  return (
    <>
      <GoldDust frame={frame} intensity={dustIntensity(frame)} />
      <FloatingPetals frame={frame} intensity={petalIntensity(frame)} kind={kind} />
    </>
  );
};

/**
 * The cinematic: 1080×1920, 30 FPS, 1500 frames. Everything below derives from the current frame
 * (no timers), so any frame renders identically whenever it is asked for.
 */
export const WeddingComposition = (props: WeddingProps) => (
  <ExperienceContext.Provider value={props}>
    <FontGate>
      <AbsoluteFill style={{ backgroundColor: "#f5ebdd", overflow: "hidden", pointerEvents: "none" }}>
        <SharedDefs />
        <PaperBackground />

        <Sequence name="1 · Awakening" from={S.awakening.start} durationInFrames={span("awakening")} layout="none">
          <AwakeningScene />
        </Sequence>

        <Sequence name="Garden" from={S.meeting.start} durationInFrames={S.invitation.start + SCENE_OVERLAP.wedding - S.meeting.start} layout="none">
          <GardenBack />
        </Sequence>

        <Sequence name="2 · Meeting" from={S.meeting.start} durationInFrames={span("meeting")} layout="none">
          <MeetingScene />
        </Sequence>

        <Sequence name="3 · Union" from={S.wedding.start} durationInFrames={span("wedding")} layout="none">
          <WeddingScene />
        </Sequence>

        <Sequence name="Foreground" from={S.meeting.start} durationInFrames={S.invitation.start + SCENE_OVERLAP.wedding - S.meeting.start} layout="none">
          <GardenForeground />
        </Sequence>

        <Sequence name="4 · Invitation" from={S.invitation.start} durationInFrames={span("invitation")} layout="none">
          <InvitationScene />
        </Sequence>

        <Atmosphere reduced={props.reducedMotion} />
        <GrainOverlay />
        <Soundtrack src={props.audioSrc} />
      </AbsoluteFill>
    </FontGate>
  </ExperienceContext.Provider>
);
