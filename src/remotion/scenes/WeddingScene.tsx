import { useCurrentFrame } from "remotion";
import { BEATS, SCENES, sceneDuration } from "../../config/timeline";
import { Emblem } from "../components/Emblem";
import { MandapArch, MandapDiyas, MandapStructure } from "../components/FloralMandap";
import { GlowDisc, Layer } from "../components/Layer";
import { GuidedHotspot } from "../components/GuidedHotspot";
import { InvitationCard } from "../components/InvitationCard";
import { SceneHeading } from "../components/SceneHeading";
import { Bride, Groom, PaanLeaf, restHand } from "../components/WeddingCouple";
import { useExperience, useText } from "../experience";
import { CARD_EDGE_Y, COUPLE, GAZE_POINT, ORNAMENT_POS, ORNAMENT_SCALE } from "../layout";
import { easeInOut, easeOut, lerp, progress } from "../lib/anim";

const B = BEATS.wedding;

/** Frames (scene-local) of the betel-leaf sequence: carried → raised to the face → opened aside → set down. */
const LEAVES = { raise: [56, 106], open: [164, 214], release: [220, 252] } as const;

/** The two leaves leaving her hands (hanging from the fingers, as the rig shows them) and settling flat on the floor. */
const SetDownLeaves = ({ t }: { t: number }) => {
  const s = COUPLE.scale;
  const fall = t * t;
  const flat = progress(t, [0.7, 1], (u) => u);
  return (
    <>
      {([-1, 1] as const).map((side) => {
        const hand = restHand(side);
        const sx = COUPLE.brideX + hand.x * s;
        const sy = COUPLE.y + hand.y * s;
        const ex = COUPLE.brideX + side * 128 * s;
        const ey = COUPLE.y + 26;
        const sway = Math.sin(t * Math.PI * 3) * (1 - t);
        const x = lerp(sx, ex, easeOut(t)) + sway * 16;
        const y = lerp(sy, ey, fall);
        const ang = lerp(side * 168, side * 84, easeOut(t)) + sway * 16;
        return (
          <g key={side} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${s} ${(s * (1 - 0.6 * flat)).toFixed(3)})`}>
            <PaanLeaf />
          </g>
        );
      })}
    </>
  );
};
const LAST = sceneDuration("wedding") - 1;

const bump = (f: number, a: number, b: number) => Math.sin(Math.PI * progress(f, [a, b], (t) => t));

/** Position of the drifting petal: crosses from the left, then settles down the centre between the couple. */
const petalAt = (t: number) => {
  const e = easeInOut(t);
  return {
    x: lerp(-90, 540, e) + Math.sin(t * Math.PI * 2.4) * 130 * (1 - t),
    y: lerp(560, ORNAMENT_POS.y, easeOut(t) * 0.55 + t * 0.45),
    rot: t * 540 - 40,
  };
};

/**
 * Scene 3 — the sacred union (frames 570–1049). Continues exactly from the meeting scene's final tableau.
 * Order of events follows Bengali custom: শুভদৃষ্টি (the lowered betel leaves, eyes meet) → মালাবদল (garlands).
 * It ends with a petal that turns into the gold ornament and reveals the edge of the invitation card.
 */
export const WeddingScene = () => {
  const f = useCurrentFrame();
  const g = f + SCENES.wedding.start;
  const { reducedMotion, interactive, guided } = useExperience();
  const tx = useText();

  const build = progress(f, B.mandapBuild);
  const lights = progress(f, B.diyasLight);

  // — hands and gaze —
  // Groom: relaxes from his greeting. Bride: still carries the two betel leaves between her palms (as she did on
  // arrival), raises them to veil her face, opens them aside once the groom looks, and sets them on the floor.
  const namaskar = 1 - progress(f, [8, 40]);
  const raise = progress(f, LEAVES.raise);
  const open = progress(f, LEAVES.open);
  const brideFace = raise * (1 - open);
  const brideNamaskar = 1 - raise;
  const release = progress(f, LEAVES.release, (t) => t);
  const garlandHold = progress(f, [250, 282]) * (1 - progress(f, [322, 346]));
  const held = progress(f, [254, 280]) * (1 - progress(f, [290, 304]));
  const worn = progress(f, [288, 324], easeOut);
  const bow = bump(f, 286, 322) * 5;
  const brideLook = 0.4 * (1 - progress(f, [LEAVES.open[0] + 24, LEAVES.open[1] + 22]));
  const brideTurn = -0.55 - 0.35 * progress(f, [LEAVES.open[0] + 14, LEAVES.open[1]]);

  // — light —
  const meet = bump(f, LEAVES.open[0] + 22, LEAVES.open[1] + 52) * 0.6;
  const peak = Math.pow(bump(f, B.peak[0], B.peak[1] + 30), 1.4) * 0.95;
  const settle = progress(f, [B.tableau[0], B.tableau[1] + 20]) * 0.22;
  const glow = Math.max(meet * 0.5, peak, settle, lights * 0.32);

  // — closing transition —
  const hp = progress(f, B.petalCross, (t) => t);
  const petal = petalAt(hp);
  const morph = progress(hp, [0.82, 1]);
  const inScene = f <= LAST;
  const edge = progress(f, B.cardEdge);
  const cardTop = lerp(1920, CARD_EDGE_Y, easeInOut(edge));
  const petalFill = hp < 0.8 ? "#f0a936" : "#d7ad58";

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <SceneHeading text={tx.wedding} frame={f} fadeIn={B.headingIn} fadeOutAt={B.tableau[0] + 20} tone="light" />

      {/* warm lamplight and the moment their eyes meet: GPU-composited glows */}
      <GlowDisc x={540} y={1090} r={760} opacity={glow} />
      <GlowDisc x={GAZE_POINT.x} y={GAZE_POINT.y + 10} r={230} opacity={meet} />

      {/* the mandap, in layers that change at different rates */}
      <Layer>
        <MandapStructure build={build} />
        <MandapArch gather={1} />
      </Layer>

      <Layer>
        <MandapDiyas build={build} lights={lights} time={g} />
        <Groom
          x={COUPLE.groomX}
          y={COUPLE.y}
          scale={COUPLE.scale}
          turn={0.85}
          pose={{ namaskar, hold: garlandHold }}
          garlandHeld={held}
          garlandWorn={worn}
          headTilt={bow}
          lookDown={0.08 + 0.25 * bump(f, 286, 322)}
        />
        <Bride
          x={COUPLE.brideX}
          y={COUPLE.y}
          scale={COUPLE.scale}
          turn={brideTurn}
          pose={{ namaskar: brideNamaskar, face: brideFace, hold: garlandHold }}
          paan={release <= 0}
          garlandHeld={held}
          garlandWorn={worn}
          headTilt={-bow}
          lookDown={brideLook + 0.25 * bump(f, 286, 322)}
        />

        {/* the betel leaves, set down on the floor beside her */}
        {release > 0 && <SetDownLeaves t={release} />}

        {/* petal → gold ornament */}
        {inScene && hp > 0 && (
          <g
            transform={`translate(${petal.x.toFixed(1)} ${petal.y.toFixed(1)}) rotate(${petal.rot.toFixed(1)}) scale(${lerp(26, 34, hp)} ${lerp(40, 52, hp)})`}
            opacity={1 - morph}
          >
            <path d="M0 -1C0.95 -0.7 0.9 0.5 0 1C-0.9 0.5 -0.95 -0.7 0 -1Z" fill={petalFill} stroke="#8f4a14" strokeWidth={0.06} />
            <path d="M0 -0.8V0.7" stroke="#30251f" strokeOpacity={0.3} strokeWidth={0.04} />
          </g>
        )}
      </Layer>

      {inScene && edge > 0 && (
        <>
          <InvitationCard frame={0} top={cardTop} border={edge} />
          <Layer>
            <Emblem x={ORNAMENT_POS.x} y={ORNAMENT_POS.y} scale={ORNAMENT_SCALE * (reducedMotion ? 1 : lerp(0.5, 1, morph))} opacity={morph} />
          </Layer>
        </>
      )}

      {interactive && guided.awaiting === "invitation" && (
        <GuidedHotspot
          x={ORNAMENT_POS.x}
          y={ORNAMENT_POS.y}
          size={300}
          label={tx.hintOrnament}
          ariaLabel={tx.hintOrnament}
          labelPosition="below"
          onActivate={(e) => guided.onActivate?.("invitation", e)}
        />
      )}
    </div>
  );
};
