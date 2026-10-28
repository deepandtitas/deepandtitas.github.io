import { BEATS, SCENE_BEATS, sceneDuration } from "../../config/timeline";
import { Sprite, SpriteField } from "../components/Art";
import { Emblem } from "../components/Emblem";
import { ARCH_BOX_GATHERED, MandapArch, MandapDiyas, MandapStructure } from "../components/FloralMandap";
import { garlandSprites } from "../components/Garland";
import { GlowDisc, Layer } from "../components/Layer";
import { GuidedHotspot } from "../components/GuidedHotspot";
import { InvitationCard } from "../components/InvitationCard";
import { Bride, figurePoints, Groom, type FigureProps } from "../components/WeddingCouple";
import { useExperience, useText } from "../experience";
import { CARD_EDGE_Y, COUPLE, GAZE_POINT, ORNAMENT_POS, ORNAMENT_SCALE } from "../layout";
import { easeInOut, easeOut, lerp, progress } from "../lib/anim";
import { useBeat } from "../lib/time";
import { lerpPt, pendulum, type PoseWeights, type Pt } from "../rig/motion";
import { meetingPose } from "./MeetingScene";

const B = BEATS.wedding;
const LAST = sceneDuration("wedding") - 1;
const STEP = 58;

/** Scene-local beats of the শুভদৃষ্টি: leaves raised to veil her face → opened aside as their eyes meet → set down. */
const LEAVES = { raise: [56, 106], open: [164, 214], release: [222, 250] } as const;

/**
 * মালাবদল, one after the other: she garlands him, then he garlands her. Each giver steps in, raises the garland to
 * the other's face, settles it around the neck, lets go, and steps back.
 */
const EXCHANGE = {
  appear: [250, 272],
  bride: { stepIn: [266, 288], lift: [278, 300], settle: [300, 312], release: [312, 332], stepBack: [318, 336] },
  groom: { stepIn: [334, 352], lift: [342, 364], settle: [364, 376], release: [376, 396], stepBack: [382, 400] },
} as const;
/** From this beat the groom is drawn in front (he garlands her); before it, she is in front. */
const SWAP = 336;

const bump = (f: number, a: number, b: number) => Math.sin(Math.PI * progress(f, [a, b], (t) => t));

const SIZE = 22 * COUPLE.scale;
/** Canvas bounds of the garlands: from the couple's chins down past their hands. */
export const GARLAND_BOX = { x: 180, y: 640, w: 720, h: 820 };

type Side = { l: PoseWeights | Pt; r: PoseWeights | Pt };
const named = (w: PoseWeights): Side => ({ l: w, r: w });
const toFigure = (p: Pt, fig: { x: number; y: number; scale?: number }): Pt => ({ x: (p.x - fig.x) / (fig.scale ?? 1), y: (p.y - fig.y) / (fig.scale ?? 1) });

interface Pose {
  groom: FigureProps;
  bride: FigureProps & { paan: number };
}

/** Both figures at a scene-local beat, before the garland exchange moves their hands. */
const basePose = (f: number, reduced: boolean): Pose => {
  const start = meetingPose(330, reduced); // the meeting scene's final tableau
  const X = EXCHANGE;
  // stepping in and back for each half of the exchange
  const xAt = (g: number) => {
    const bi = progress(g, X.bride.stepIn) * (1 - progress(g, X.bride.stepBack));
    const gi = progress(g, X.groom.stepIn) * (1 - progress(g, X.groom.stepBack));
    return { groom: COUPLE.groomX + bi * 30 + gi * 70, bride: COUPLE.brideX - bi * 70 - gi * 30 };
  };
  const xs = xAt(f);
  const prev = xAt(f - 1);
  const stepping = reduced ? 0 : Math.min(1, Math.abs(xs.groom - prev.groom) * 0.6 + Math.abs(xs.bride - prev.bride) * 0.6);

  // — groom: relaxes from his greeting, turns to her —
  const relax = 1 - progress(f, [8, 40]);
  // — bride: the betel leaves —
  const raise = progress(f, LEAVES.raise);
  const open = progress(f, LEAVES.open);
  const holding = f < LEAVES.release[0];
  // the leaves come down from her face to her chest, then out to her sides
  const lowerA = progress(f, [LEAVES.open[0], (LEAVES.open[0] + LEAVES.open[1]) / 2]);
  const lowerB = progress(f, [(LEAVES.open[0] + LEAVES.open[1]) / 2, LEAVES.open[1]]);
  // after letting the leaves fall, her arms relax to her sides before she takes up the garland
  const relaxArms = progress(f, [LEAVES.release[0] + 2, X.appear[0]]);
  // — garlands in hand: each holds one until it has been given —
  // hands come up to take the garland a little before it appears, over a longer, unhurried move
  const appear = progress(f, [X.appear[0] - 6, X.appear[1] + 4]);
  // the giver's hands return to the garland pose as they let go, then lower once the hands are free
  const brideHas = appear * (1 - progress(f, [X.bride.release[1], X.bride.release[1] + 24]));
  const groomHas = appear * (1 - progress(f, [X.groom.release[1], X.groom.release[1] + 24]));
  const groomReady = progress(f, X.groom.stepIn);

  // — faces —
  const veiled = raise * (1 - open);
  const eyesMeet = progress(f, [LEAVES.open[0] + 16, LEAVES.open[1] + 6]);
  const joy = progress(f, [LEAVES.open[0] + 26, LEAVES.open[1] + 40]);
  const tableau = progress(f, B.tableau);
  const receiveG = bump(f, X.bride.lift[0], X.bride.release[1]);
  const receiveB = bump(f, X.groom.lift[0], X.groom.release[1]);

  const groom: FigureProps = {
    ...start.groom,
    x: xs.groom,
    t: f + 330,
    vel: (xs.groom - prev.groom) / COUPLE.scale,
    walk: ((xs.groom - COUPLE.groomX) / STEP) * Math.PI,
    moving: stepping,
    turn: 0.85,
    arms: named({ namaskar: relax * (1 - appear) + tableau, low: groomHas * (1 - groomReady), hold: groomHas * groomReady }),
    bow: receiveG * 0.7,
    headTilt: receiveG * 5,
    face: { gaze: 0.9, look: 0.12 + receiveG * 0.3 + bump(f, 280, 330) * 0.1, smile: 0.35 + joy * 0.45, blush: joy * 0.25 },
  };
  const bride: Pose["bride"] = {
    ...start.bride,
    x: xs.bride,
    t: f + 330,
    vel: (xs.bride - prev.bride) / COUPLE.scale,
    walk: ((COUPLE.brideX - xs.bride) / STEP) * Math.PI + 1.4,
    moving: stepping,
    turn: -0.6 - 0.3 * eyesMeet,
    // one continuous blend for the whole scene: chest → veiling her face → leaves lowered aside → (the leaves are
    // let go) arms relax → the garland in her hands → folded hands. Weight passes from one pose to the next.
    arms: named({
      chest: 1 - raise,
      face: raise * (1 - lowerA),
      hold: lowerA * (1 - lowerB) + brideHas,
      aside: lowerB * (1 - relaxArms),
      namaskar: tableau,
    }),
    paan: holding ? lerp(0.72, 0.98, raise) - 0.2 * open : 0,
    bow: receiveB * 0.7,
    headTilt: -receiveB * 5,
    face: {
      gaze: -0.9 * eyesMeet - 0.3,
      look: lerp(0.55, 0, eyesMeet) + receiveB * 0.3,
      smile: 0.15 + joy * 0.55,
      blush: 0.3 + joy * 0.5,
      close: veiled * 0.35,
    },
  };
  return { groom, bride };
};

interface Exchange {
  pose: Pose;
  /** Garland anchors (composition coordinates) and swing. */
  garlands: { a: Pt; b: Pt; sag: number; swing: number; opacity: number; seed: number }[];
}

/** The garland exchange: givers' hands follow the garland's path; afterwards it hangs at the receiver's neck. */
export const exchangeAt = (f: number, reduced: boolean): Exchange => {
  const pose = basePose(f, reduced);
  const X = EXCHANGE;
  const appear = progress(f, X.appear);
  const garlands: Exchange["garlands"] = [];

  const give = (giver: "bride" | "groom") => {
    const receiver = giver === "bride" ? "groom" : "bride";
    const w = X[giver];
    const R = figurePoints(receiver, pose[receiver]);
    // linear here: each is eased once where it is used
    const lift = progress(f, w.lift, (t) => t);
    const settle = progress(f, w.settle, (t) => t);
    const release = progress(f, w.release, (t) => t);
    const chin = { l: { x: R.neckL.x - 6, y: R.neckL.y - 62 * COUPLE.scale }, r: { x: R.neckR.x + 6, y: R.neckR.y - 62 * COUPLE.scale } };
    const neck = { l: R.neckL, r: R.neckR };
    // the giver's hands reach out of their pose to the other's chin, settle the garland at the neck, and return to
    // the pose as they let go — one blend, so the hands never jump when the reach starts or ends
    if (lift > 0 && release < 1) {
      const giverPose = pose[giver];
      const out = (p: Pt) => toFigure(p, giverPose);
      const base = giverPose.arms as { l: PoseWeights; r: PoseWeights };
      const mix = easeInOut(lift) * (1 - easeInOut(release));
      const at = (side: "l" | "r") => out(lerpPt(chin[side], neck[side], easeInOut(settle)));
      giverPose.arms = { l: { reach: at("l"), mix, base: base.l }, r: { reach: at("r"), mix, base: base.r } };
      giverPose.lean = (giver === "bride" ? -1 : 1) * 5 * bump(f, w.lift[0], w.release[1]);
    }
    // where the garland hangs
    const H = figurePoints(giver, pose[giver]);
    const placed = settle >= 1;
    const a = placed ? R.neckL : H.handL;
    const b = placed ? R.neckR : H.handR;
    const sag = placed ? lerp(60, 118, easeOut(release)) * COUPLE.scale : lerp(64, 46, lift) * COUPLE.scale;
    const swing = reduced ? 0 : pendulum(f - w.release[0], 9) + (placed ? 0 : Math.sin((f + (giver === "bride" ? 0 : 9)) * 0.21) * 3 * (1 - lift));
    garlands.push({ a, b, sag, swing, opacity: appear, seed: giver === "bride" ? 0 : 3 });
  };
  give("bride");
  give("groom");
  return { pose, garlands };
};

/** The two leaves leaving her hands and settling flat on the floor beside her. */
const SetDownLeaves = ({ f, reduced }: { f: number; reduced: boolean }) => {
  const t = progress(f, LEAVES.release, (u) => u);
  if (t <= 0) return null;
  const at = basePose(LEAVES.release[0] - 0.5, reduced).bride;
  const P = figurePoints("bride", at);
  const fall = t * t;
  return (
    <>
      {(
        [
          [P.handL, P.handAngL, -1],
          [P.handR, P.handAngR, 1],
        ] as [Pt, number, number][]
      ).map(([h, ang, side]) => {
        const ex = COUPLE.brideX + side * 120 * COUPLE.scale;
        const ey = COUPLE.y + 22;
        const sway = Math.sin(t * Math.PI * 3) * (1 - t);
        const x = lerp(h.x, ex, easeOut(t)) + sway * 16;
        const y = lerp(h.y, ey, fall);
        const rot = lerp(ang + 90 + side * 6, side * 84, easeOut(t)) + sway * 16;
        return <Sprite key={side} name="paan" x={x} y={y} rot={rot} scale={0.72 * COUPLE.scale} />;
      })}
    </>
  );
};

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
 * Scene 3 — the sacred union. Continues exactly from the meeting scene's final tableau.
 * Bengali order: শুভদৃষ্টি (the betel leaves lowered, eyes meet) → মালাবদল (garlands exchanged).
 * It ends with a petal that turns into the gold ornament and reveals the edge of the invitation card.
 */
export const WeddingScene = () => {
  const f = useBeat();
  const g = f + SCENE_BEATS.wedding.start;
  const { reducedMotion, interactive, guided } = useExperience();
  const tx = useText();

  const build = progress(f, B.mandapBuild);
  const lights = progress(f, B.diyasLight);
  const { pose, garlands } = exchangeAt(f, reducedMotion);

  // — light —
  const meet = bump(f, LEAVES.open[0] + 22, LEAVES.open[1] + 52) * 0.6;
  const peak = Math.pow(bump(f, B.peak[0], B.peak[1] + 30), 1.4) * 0.9;
  const settle = progress(f, [B.tableau[0], B.tableau[1] + 20]) * 0.22;
  const glow = Math.max(meet * 0.5, peak, settle, lights * 0.32);

  // — closing transition —
  const hp = progress(f, B.petalCross, (t) => t);
  const petal = petalAt(hp);
  const morph = progress(hp, [0.82, 1]);
  const inScene = f <= LAST;
  const edge = progress(f, B.cardEdge);
  const cardTop = lerp(1920, CARD_EDGE_Y, easeInOut(edge));

  // who is drawn in front changes by z-index, never by reordering the DOM (moving a figure rebuilds its layers)
  const groomFirst = f < SWAP;
  const garlandField = garlands.flatMap((gl) => garlandSprites({ ...gl, size: SIZE }));

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* warm lamplight and the moment their eyes meet: GPU-composited glows */}
      <GlowDisc x={540} y={1040} r={760} opacity={glow} />

      <MandapStructure build={Math.round(build * 400) / 400} />
      <MandapArch gather={1} box={ARCH_BOX_GATHERED} />
      <MandapDiyas build={build} lights={lights} time={g} />
      <GlowDisc x={GAZE_POINT.x} y={GAZE_POINT.y + 10} r={230} opacity={meet} />

      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <div style={{ position: "absolute", inset: 0, zIndex: groomFirst ? 1 : 2 }}>
          <Groom {...pose.groom} />
        </div>
        <div style={{ position: "absolute", inset: 0, zIndex: groomFirst ? 2 : 1 }}>
          <Bride {...pose.bride} />
        </div>
      </div>
      <SpriteField sprites={garlandField} box={GARLAND_BOX} />
      <SetDownLeaves f={f} reduced={reducedMotion} />

      {/* petal → gold ornament → the card's edge. Mounted for the whole scene and hidden until needed (the card waits
          below the frame), so nothing is created mid-scene. */}
      <Sprite
        name="petal-marigold"
        x={petal.x}
        y={petal.y}
        rot={petal.rot}
        scale={lerp(1.3, 1.7, hp)}
        opacity={inScene && hp > 0 ? 1 - morph : 0}
        style={{ visibility: inScene && hp > 0 && morph < 1 ? "visible" : "hidden" }}
      />
      <div style={{ position: "absolute", inset: 0, visibility: inScene && edge > 0 ? "visible" : "hidden" }}>
        <InvitationCard frame={0} top={cardTop} border={edge} />
        <Layer>
          <Emblem x={ORNAMENT_POS.x} y={ORNAMENT_POS.y} scale={ORNAMENT_SCALE * (reducedMotion ? 1 : lerp(0.5, 1, morph))} opacity={morph} />
        </Layer>
      </div>

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
