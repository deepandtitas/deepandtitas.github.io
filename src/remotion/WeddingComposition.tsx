import { AbsoluteFill, Sequence } from "remotion";
import { BEATS, SCENE_BEATS, SCENE_OVERLAP, SCENES, beatsToFrames, sceneDuration, type SceneId } from "../config/timeline";
import { cameraZoom, CAMERA_FOCUS } from "./camera";
import { ArtGate } from "./components/Art";
import { FloatingPetals } from "./components/FloatingPetals";
import { GardenBack, GardenForeground } from "./components/GardenStage";
import { GoldDust } from "./components/GoldDust";
import { PaperBackground } from "./components/PaperBackground";
import { SceneHeading } from "./components/SceneHeading";
import { SharedDefs } from "./components/SharedDefs";
import { ExperienceContext, useExperience, useText } from "./experience";
import { FontGate } from "./FontGate";
import { keyframes } from "./lib/anim";
import { useBeat } from "./lib/time";
import type { WeddingProps } from "./props";
import { AwakeningScene } from "./scenes/AwakeningScene";
import { InvitationScene } from "./scenes/InvitationScene";
import { MeetingScene } from "./scenes/MeetingScene";
import { WeddingScene } from "./scenes/WeddingScene";
import { Soundtrack } from "./Soundtrack";

const S = SCENE_BEATS;
/** Frames a scene's Sequence lasts, including its cross-fade overlap. */
const span = (id: SceneId) => beatsToFrames(sceneDuration(id) + SCENE_OVERLAP[id]);
const GARDEN_FRAMES = beatsToFrames(S.invitation.start + SCENE_OVERLAP.wedding - S.meeting.start);

/** How many petals are in the air at a given global beat (0..1.2). */
const petalIntensity = (b: number): number =>
  keyframes(
    b,
    [S.meeting.start + 20, S.meeting.start + 100, S.meeting.end - 20, S.wedding.start + 300, S.wedding.start + 340, S.wedding.start + 400, S.wedding.start + 436, S.wedding.start + 466],
    [0, 0.7, 0.8, 0.3, 1.2, 0.6, 0.2, 0],
  );

const dustIntensity = (b: number): number =>
  keyframes(
    b,
    [20, 90, S.meeting.start, S.wedding.start + 200, S.wedding.start + 330, S.wedding.end, S.invitation.start + 200, S.invitation.end - 1],
    [0, 0.55, 0.4, 0.45, 1, 0.5, 0.35, 0.12],
  );

/** Global layers: floating petals and gold dust drift across scene boundaries. */
const Atmosphere = () => {
  const beat = useBeat();
  const { reducedMotion } = useExperience();
  if (reducedMotion) return null;
  const kind = beat >= S.wedding.start + 280 && beat < S.wedding.end ? "marigold" : "mixed";
  return (
    <>
      <GoldDust beat={beat} intensity={dustIntensity(beat)} />
      <FloatingPetals beat={beat} intensity={petalIntensity(beat)} kind={kind} />
    </>
  );
};

/** Scene titles, drawn above the garden foreground so leaves can never hide them. */
const Headings = () => {
  const beat = useBeat();
  const tx = useText();
  return (
    <>
      <SceneHeading text={tx.opening} frame={beat} fadeIn={BEATS.awakening.headingIn} fadeOutAt={S.awakening.end + 4} />
      <SceneHeading
        text={tx.meeting}
        frame={beat - S.meeting.start}
        fadeIn={BEATS.meeting.headingIn}
        fadeOutAt={sceneDuration("meeting") - 70}
      />
      <SceneHeading
        text={tx.wedding}
        frame={beat - S.wedding.start}
        fadeIn={BEATS.wedding.headingIn}
        fadeOutAt={BEATS.wedding.tableau[0] + 20}
        tone="light"
      />
    </>
  );
};

/** The stage the camera moves: garden, couple, mandap and foreground. One transform; nothing inside repaints. */
const Camera = ({ children }: { children: React.ReactNode }) => {
  const beat = useBeat();
  const { reducedMotion } = useExperience();
  const z = cameraZoom(beat, reducedMotion);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: `${CAMERA_FOCUS.x}px ${CAMERA_FOCUS.y}px`,
        transform: `scale(${z.toFixed(5)})`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
};

/**
 * The cinematic: 1080×1920 at 60 FPS. Pacing is authored in beats (1/30 s); everything below derives from the
 * current frame (no timers), so any frame renders identically whenever it is asked for.
 */
export const WeddingComposition = (props: WeddingProps) => (
  <ExperienceContext.Provider value={props}>
    <FontGate>
      <AbsoluteFill style={{ backgroundColor: "#f5ebdd", overflow: "hidden", pointerEvents: "none", fontSynthesis: "none" }}>
        <SharedDefs />
        {/* renders only: the website's loader has already fetched and decoded every image */}
        {!props.interactive && <ArtGate />}
        <PaperBackground />

        <Sequence name="1 · Awakening" from={SCENES.awakening.start} durationInFrames={span("awakening")} layout="none">
          <AwakeningScene />
        </Sequence>

        <Camera>
          <Sequence name="Garden" from={SCENES.meeting.start} durationInFrames={GARDEN_FRAMES} layout="none">
            <GardenBack />
          </Sequence>

          <Sequence name="2 · Meeting" from={SCENES.meeting.start} durationInFrames={span("meeting")} layout="none">
            <MeetingScene />
          </Sequence>

          <Sequence name="3 · Union" from={SCENES.wedding.start} durationInFrames={span("wedding")} layout="none">
            <WeddingScene />
          </Sequence>

          <Sequence name="Foreground" from={SCENES.meeting.start} durationInFrames={GARDEN_FRAMES} layout="none">
            <GardenForeground />
          </Sequence>
        </Camera>

        <Headings />

        <Sequence name="4 · Invitation" from={SCENES.invitation.start} durationInFrames={span("invitation")} layout="none">
          <InvitationScene />
        </Sequence>

        <Atmosphere />
        <Soundtrack src={props.audioSrc} />
      </AbsoluteFill>
    </FontGate>
  </ExperienceContext.Provider>
);
