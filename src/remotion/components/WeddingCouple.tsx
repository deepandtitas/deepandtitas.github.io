import { memo, useId, useMemo, type CSSProperties } from "react";
import { ART } from "../art-manifest";
import type { ArtName } from "../art-manifest";
import { useAsset } from "../experience";
import { useLiveStyles, type LiveStyle } from "../lib/live";
import { blinkAt, SKELETON, solveFigure, type FigurePose, type PartXf, type Pt, type SolvedFigure, type Who } from "../rig/motion";
import { artBox, partOrigin, partTransform, spriteTransform } from "./Art";

/**
 * The single source of truth for how Deep and Titas look. Every scene draws them through <Groom/> and <Bride/>.
 * Each figure is a cut-out puppet of baked parts (scripts/art/characters.mjs) moved only by CSS transforms solved in
 * rig/motion.ts, plus a small vector face so expressions stay alive. Everything is a pure function of props.
 *
 * Figure coordinates: origin between the feet, y grows downward; a figure is ~650 units tall without headgear.
 */

const INK = "#30251f";
export const SKIN = { groom: "#c98d5e", bride: "#dba27a" } as const;
const SKIN_SHADE = { groom: "#a26a42", bride: "#b77e56" } as const;

export interface Expression {
  /** -1 looks to screen-left … +1 to screen-right. */
  gaze?: number;
  /** 0 = eyes level, 1 = cast down. */
  look?: number;
  /** 0..1 */
  smile?: number;
  blush?: number;
  /** 0 = open, 1 = closed; added to the natural blinks. */
  close?: number;
}

export interface FigureProps extends FigurePose {
  /** Feet position on the canvas, and scale. */
  x: number;
  y: number;
  scale?: number;
  /** -1..1 head turn (features shift toward that side). */
  turn?: number;
  face?: Expression;
  opacity?: number;
}

const FACE = {
  groom: { eyeY: -601, eyeX: 17, browY: -613, mouthY: -556, cheekY: -574 },
  bride: { eyeY: -594, eyeX: 16, browY: -607, mouthY: -553, cheekY: -569 },
} as const;

const q = (n: number) => Math.round(n * 100) / 100;

/** Eyes, brows, mouth and blush. Memoised on rounded values: it re-renders only when the expression changes. */
const Face = memo(function Face({ who, dx, gx, gy, blink, smile, blush }: { who: Who; dx: number; gx: number; gy: number; blink: number; smile: number; blush: number }) {
  const id = useId().replace(/:/g, "");
  const f = FACE[who];
  const bride = who === "bride";
  const skin = SKIN[who];
  const lidY = -7 + 12.5 * blink;
  return (
    <svg
      width={100}
      height={110}
      viewBox="-50 -650 100 110"
      style={{ position: "absolute", left: -50, top: -650, overflow: "visible" }}
    >
      <g transform={`translate(${dx} 0)`}>
        {blush > 0.01 && (
          <>
            <ellipse cx={-25} cy={f.cheekY} rx={8} ry={5} fill="#e0607a" opacity={blush * 0.42} />
            <ellipse cx={25} cy={f.cheekY} rx={8} ry={5} fill="#e0607a" opacity={blush * 0.42} />
          </>
        )}
        {([-1, 1] as const).map((s) => (
          <g key={s} transform={`translate(${s * f.eyeX} ${f.eyeY})`}>
            <clipPath id={`${id}e${s}`}>
              <path d="M-10 0Q-1 -7 10 -0.5Q1 5.5 -10 0Z" />
            </clipPath>
            <path d="M-10 0Q-1 -7 10 -0.5Q1 5.5 -10 0Z" fill="#fffaf0" />
            <g clipPath={`url(#${id}e${s})`}>
              <circle cx={gx * 3.4} cy={gy * 1.8 - 0.5} r={4.6} fill="#3a2316" />
              <circle cx={gx * 3.4} cy={gy * 1.8 - 0.5} r={2.4} fill="#120a07" />
              <circle cx={gx * 3.4 + 1.5} cy={gy * 1.8 - 2.2} r={1.3} fill="#ffffff" />
            </g>
            {/* upper lid, closing with the blink */}
            {blink > 0.02 && <path d={`M-11 0Q-1 -8 11 -0.5Q1 ${q(lidY)} -11 0Z`} fill={skin} />}
            <path d={`M-11 0.5Q-1 ${q(lidY - 0.5)} 11 -1`} stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
            {bride && <path d={`M${s * 10} -1l${s * 5} -3.4`} stroke={INK} strokeWidth={2.2} strokeLinecap="round" />}
            <path d="M-8 3.4Q0 6 8 2.6" stroke={INK} strokeOpacity={0.35} strokeWidth={1} fill="none" />
            <path d="M-8 -7Q0 -11 8 -7" stroke={SKIN_SHADE[who]} strokeWidth={1.2} fill="none" opacity={0.7} />
          </g>
        ))}
        {/* brows */}
        {([-1, 1] as const).map((s) => (
          <path
            key={s}
            d={`M${s * 6} ${f.browY + 2 - smile * 1.2}Q${s * 16} ${f.browY - 4 - smile * 1.5} ${s * 27} ${f.browY + 1}`}
            stroke="#1b1210"
            strokeWidth={bride ? 2.6 : 3.6}
            fill="none"
            strokeLinecap="round"
          />
        ))}
        {/* mouth */}
        {bride ? (
          <g transform={`translate(0 ${f.mouthY})`}>
            <path d={`M${-7.5 - smile * 1.5} ${-smile * 1.6}Q-3.5 -3.6 0 -2.2Q3.5 -3.6 ${7.5 + smile * 1.5} ${-smile * 1.6}Q0 ${q(-0.6 + smile)} ${-7.5 - smile * 1.5} ${-smile * 1.6}Z`} fill="#a52a37" />
            <path d={`M${-7.5 - smile * 1.5} ${-smile * 1.6}Q0 ${q(5.5 + smile * 1.5)} ${7.5 + smile * 1.5} ${-smile * 1.6}Q0 ${q(-0.6 + smile)} ${-7.5 - smile * 1.5} ${-smile * 1.6}Z`} fill="#c23a48" />
            <path d="M-2.5 2.4Q0 3.4 2.5 2.4" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={1} fill="none" />
          </g>
        ) : (
          <g transform={`translate(0 ${f.mouthY})`}>
            <path d={`M${-8.5 - smile * 1.5} ${-smile * 2}Q0 ${q(2.4 + smile * 3)} ${8.5 + smile * 1.5} ${-smile * 2}`} stroke="#7a3030" strokeWidth={2.4} fill="none" strokeLinecap="round" />
            <path d="M-4 4.2Q0 5.6 4 4.2" stroke={SKIN_SHADE[who]} strokeWidth={1.4} fill="none" />
          </g>
        )}
      </g>
    </svg>
  );
});

type XfKey = "lower" | "torso" | "drape" | "footL" | "footR" | "upperL" | "upperR" | "foreL" | "foreR";
type Slot = readonly [ArtName, XfKey];

/** Draw order of each figure's body parts (back to front), and which solved transform moves each. */
const BODY: Record<Who, readonly Slot[]> = {
  groom: [
    ["groom-foot-l", "footL"],
    ["groom-foot-r", "footR"],
    ["groom-dhoti", "lower"],
    ["groom-torso", "torso"],
    ["groom-stole", "drape"],
    ["groom-arm-l", "upperL"],
    ["groom-arm-r", "upperR"],
    ["groom-fore-l", "foreL"],
    ["groom-fore-r", "foreR"],
  ],
  bride: [
    ["bride-veil", "drape"],
    ["bride-foot-l", "footL"],
    ["bride-foot-r", "footR"],
    ["bride-saree", "lower"],
    ["bride-torso", "torso"],
    ["bride-arm-l", "upperL"],
    ["bride-arm-r", "upperR"],
    ["bride-fore-l", "foreL"],
    ["bride-fore-r", "foreR"],
  ],
};
const HEAD: Record<Who, { base: ArtName; crown: ArtName; front?: ArtName }> = {
  groom: { base: "groom-head", crown: "groom-topor" },
  bride: { base: "bride-head", crown: "bride-mukut", front: "bride-veil-front" },
};

/** The crown relative to the head group (it wobbles a little on top of the head's own motion). */
const crownLocal = (s: SolvedFigure): PartXf => ({ pivot: s.crown.pivot, at: s.crown.pivot, rot: s.crown.rot - s.head.rot });

const SHELL_STYLE = { position: "absolute", left: 0, top: 0, width: 0, height: 0, transformOrigin: "0 0", willChange: "transform, opacity" } as const;
const SHADOW = (
  <div style={{ position: "absolute", left: -120, top: -16, width: 240, height: 32, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(48,37,31,.32), rgba(48,37,31,0))" }} />
);

/**
 * One figure as a cut-out puppet. The part images are rendered once; every frame the solved transforms are written
 * straight to them (see useLiveStyles), so React only re-diffs the small vector face, and only when it changes.
 * With betel leaves in her hands, the bride's forearms and the leaves are drawn in front of her face.
 */
const Figure = ({ who, props, paan = 0 }: { who: Who; props: FigureProps; paan?: number }) => {
  const { x, y, scale = 1, opacity = 1, turn = 0, face = {}, t = 0 } = props;
  const s = solveFigure(who, props);
  const leaves = paan > 0;
  const all = BODY[who];
  const body = leaves ? all.filter(([, k]) => k !== "foreL" && k !== "foreR") : all;
  const front = leaves ? all.filter(([, k]) => k === "foreL" || k === "foreR") : [];
  const head = HEAD[who];

  // live styles, in a fixed order: shell, body parts, head group, crown, [leaves, front forearms]
  const styles: LiveStyle[] = [
    { transform: `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${scale.toFixed(4)})`, opacity },
    ...body.map(([, k]): LiveStyle => ({ transform: partTransform(s[k]) })),
    { transform: `translate(${(s.head.at.x - s.head.pivot.x).toFixed(2)}px,${(s.head.at.y - s.head.pivot.y).toFixed(2)}px) rotate(${s.head.rot.toFixed(3)}deg)` },
    { transform: partTransform(crownLocal(s)) },
  ];
  if (leaves) {
    styles.push(
      { transform: spriteTransform({ name: "paan", x: s.handL.x, y: s.handL.y, rot: s.handAngL + 90 - 6, scale: paan }) },
      { transform: spriteTransform({ name: "paan", x: s.handR.x, y: s.handR.y, rot: s.handAngR + 90 + 6, scale: paan }) },
      ...front.map(([, k]): LiveStyle => ({ transform: partTransform(s[k]) })),
    );
  }
  const ref = useLiveStyles(styles);
  const url = useAsset();
  const skin = SKELETON[who];

  const statics = useMemo(() => {
    const img = (name: ArtName, i: number, origin: string, extra?: CSSProperties) => (
      <img key={name + i} ref={ref(i)} src={url(ART[name].src)} alt="" draggable={false} decoding="sync" style={{ ...artBox(name), transformOrigin: origin, willChange: "transform", ...extra }} />
    );
    const nBody = body.length;
    const iHead = 1 + nBody;
    return {
      body: body.map(([name, k], i) => img(name, 1 + i, partOrigin(name, pivotOf(who, k)))),
      headIndex: iHead,
      headStyle: { position: "absolute", left: 0, top: 0, width: 0, height: 0, transformOrigin: `${skin.neck.x}px ${skin.neck.y}px`, willChange: "transform" } as const,
      headBase: <img src={url(ART[head.base].src)} alt="" draggable={false} decoding="sync" style={artBox(head.base)} />,
      headFront: head.front ? <img src={url(ART[head.front].src)} alt="" draggable={false} decoding="sync" style={artBox(head.front)} /> : null,
      crown: img(head.crown, iHead + 1, partOrigin(head.crown, skin.crown), { willChange: undefined }),
      leaves: leaves
        ? [
            img("paan", iHead + 2, `${-ART.paan.x}px ${-ART.paan.y}px`),
            img("paan", iHead + 3, `${-ART.paan.x}px ${-ART.paan.y}px`),
            ...front.map(([name, k], i) => img(name, iHead + 4 + i, partOrigin(name, pivotOf(who, k)))),
          ]
        : null,
    };
    // the structure only changes with who and whether she holds the leaves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [who, leaves, url, ref]);

  const blink = Math.min(1, (face.close ?? 0) + blinkAt(t, who === "groom" ? 3 : 8));
  return (
    <div ref={ref(0)} style={SHELL_STYLE}>
      {SHADOW}
      {statics.body}
      <div ref={ref(statics.headIndex)} style={statics.headStyle}>
        {statics.headBase}
        <Face who={who} dx={q(turn * 4)} gx={q(face.gaze ?? turn)} gy={q(face.look ?? 0)} blink={q(blink)} smile={q(face.smile ?? 0)} blush={q(face.blush ?? 0)} />
        {statics.headFront}
        {statics.crown}
      </div>
      {statics.leaves}
    </div>
  );
};

/** Rest pivot of the part moved by each solved transform. */
const pivotOf = (who: Who, k: XfKey): Pt => {
  const kk = SKELETON[who];
  const m = (p: Pt, side: number): Pt => ({ x: p.x * side, y: p.y });
  switch (k) {
    case "lower":
    case "torso":
      return kk.hip;
    case "drape":
      return kk.drape;
    case "footL":
      return m(kk.foot, -1);
    case "footR":
      return kk.foot;
    case "upperL":
      return m(kk.shoulder, -1);
    case "upperR":
      return kk.shoulder;
    case "foreL":
      return m(kk.elbow, -1);
    case "foreR":
      return kk.elbow;
  }
};

const GroomImpl = (props: FigureProps) => <Figure who="groom" props={props} />;
const BrideImpl = (props: FigureProps & { /** Size of the betel leaves in her hands (0 = none). */ paan?: number }) => (
  <Figure who="bride" props={props} paan={props.paan} />
);

/** Props equal to within what can be seen (0.01 units), compared deeply: pose objects are rebuilt every frame. */
const near = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 0.01;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every((k) => near((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
};

const GroomMemo = memo(GroomImpl, near);
const BrideMemo = memo(BrideImpl, near);

/**
 * Idle life (breathing, blinks, cloth in the breeze) advances in whole beats (30 Hz): those motions are sub-pixel per
 * frame, so a figure standing still re-renders on every other frame at most, while real motion stays at 60 Hz.
 */
export const Groom = (props: FigureProps) => <GroomMemo {...props} t={Math.floor(props.t ?? 0)} />;
export const Bride = (props: FigureProps & { paan?: number }) => <BrideMemo {...props} t={Math.floor(props.t ?? 0)} />;

/** Where a figure's hands and neck are, in composition coordinates (for garlands and leaves set down). */
export const figurePoints = (who: Who, props: FigureProps) => {
  const s = solveFigure(who, props);
  const k = props.scale ?? 1;
  const toWorld = (p: Pt): Pt => ({ x: props.x + p.x * k, y: props.y + p.y * k });
  return {
    handL: toWorld(s.handL),
    handR: toWorld(s.handR),
    neckL: toWorld(s.neckL),
    neckR: toWorld(s.neckR),
    headTop: toWorld(s.headTop),
    handAngL: s.handAngL,
    handAngR: s.handAngR,
  };
};
