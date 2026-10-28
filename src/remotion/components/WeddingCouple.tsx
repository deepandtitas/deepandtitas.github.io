import { memo, type ReactNode } from "react";

/**
 * The single source of truth for how Deep and Titas look. Every scene draws them through
 * <Groom/> and <Bride/>, so their faces, clothing and proportions never drift between scenes.
 *
 * Coordinates are local: origin at the centre of the feet, y grows downward, so the head is at y ≈ -545.
 * Everything is a pure function of props (no timers), so a frame renders identically every time.
 */

const INK = "#30251f";
const GOLD = "#c49a52";
const GOLD_DEEP = "#9a7430";
const SINDOOR = "#781f2b";
const SAREE = "#8f1d2c";
const HAIR = "#1d1512";

export const SKIN = { groom: "#d09a6a", bride: "#dcab7e" } as const;
const SKIN_SHADE = { groom: "#b57f52", bride: "#c4916a" } as const;

export const FIGURE_HEIGHT = 770;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface Pt {
  x: number;
  y: number;
}

/* ------------------------------------------------------------------ arms (keypoint poses) */

export interface ArmPose {
  /** Hands raised in front of the chest (garland). */
  hold: number;
  /** Hands up before the face (betel leaves). */
  face: number;
  /** Palms together at the chest (namaskar). */
  namaskar: number;
}

interface Joint {
  E: Pt; // elbow
  H: Pt; // hand
}

/**
 * Each pose is a hand-tuned pair of keypoints (elbow, hand) for the figure's right arm; the left arm is its mirror.
 * Poses blend by simple interpolation, so an elbow can never flip sides and motion stays smooth.
 */
const SHOULDER: Pt = { x: 64, y: -438 };
const POSES: Record<"rest" | keyof ArmPose, Joint> = {
  rest: { E: { x: 76, y: -321 }, H: { x: 82, y: -216 } },
  hold: { E: { x: 112, y: -338 }, H: { x: 34, y: -380 } },
  face: { E: { x: 108, y: -352 }, H: { x: 52, y: -440 } },
  namaskar: { E: { x: 100, y: -338 }, H: { x: 5, y: -392 } },
};

const blendJoint = (from: Joint, to: Joint, t: number): Joint => ({
  E: { x: lerp(from.E.x, to.E.x, t), y: lerp(from.E.y, to.E.y, t) },
  H: { x: lerp(from.H.x, to.H.x, t), y: lerp(from.H.y, to.H.y, t) },
});

const solveArm = (side: 1 | -1, pose: ArmPose) => {
  let j = POSES.rest;
  j = blendJoint(j, POSES.hold, clamp01(pose.hold));
  j = blendJoint(j, POSES.face, clamp01(pose.face));
  j = blendJoint(j, POSES.namaskar, clamp01(pose.namaskar));
  return {
    S: { x: side * SHOULDER.x, y: SHOULDER.y },
    E: { x: side * j.E.x, y: j.E.y },
    H: { x: side * j.H.x, y: j.H.y },
  };
};

/** Where a relaxed hand hangs (figure coordinates). */
export const restHand = (side: 1 | -1): Pt => solveArm(side, { hold: 0, face: 0, namaskar: 0 }).H;

const Limb = ({
  from,
  to,
  width,
  color,
}: {
  from: Pt;
  to: Pt;
  width: number;
  color: string;
}) => (
  <>
    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={INK} strokeWidth={width + 5} strokeLinecap="round" />
    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={width} strokeLinecap="round" />
  </>
);

const along = (a: Pt, b: Pt, t: number): Pt => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

const GroomArm = ({ side, pose }: { side: 1 | -1; pose: ArmPose }) => {
  const { S, E, H } = solveArm(side, pose);
  const cuffA = along(E, H, 0.8);
  const cuffB = along(E, H, 0.9);
  return (
    <g>
      <Limb from={S} to={E} width={33} color="#f1e4c6" />
      <Limb from={E} to={H} width={29} color="#f1e4c6" />
      <line x1={cuffA.x} y1={cuffA.y} x2={cuffB.x} y2={cuffB.y} stroke={GOLD} strokeWidth={31} strokeLinecap="butt" />
      <circle cx={H.x} cy={H.y} r={16} fill={SKIN.groom} stroke={INK} strokeWidth={2.5} />
    </g>
  );
};

const BrideArm = ({ side, pose }: { side: 1 | -1; pose: ArmPose }) => {
  const { S, E, H } = solveArm(side, pose);
  const dir = { x: H.x - E.x, y: H.y - E.y };
  const len = Math.hypot(dir.x, dir.y) || 1;
  const n = { x: -dir.y / len, y: dir.x / len };
  const bangle = (t: number, color: string, key: string) => {
    const c = along(E, H, t);
    return (
      <line
        key={key}
        x1={c.x - n.x * 15}
        y1={c.y - n.y * 15}
        x2={c.x + n.x * 15}
        y2={c.y + n.y * 15}
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
      />
    );
  };
  return (
    <g>
      <Limb from={S} to={along(S, E, 0.92)} width={30} color="#e2c27b" />
      <Limb from={along(S, E, 0.9)} to={E} width={25} color={SKIN.bride} />
      <Limb from={E} to={H} width={23} color={SKIN.bride} />
      {bangle(0.62, "#f8f4ea", "b1")}
      {bangle(0.7, SINDOOR, "b2")}
      {bangle(0.78, GOLD, "b3")}
      {bangle(0.86, "#f8f4ea", "b4")}
      <circle cx={H.x} cy={H.y} r={14} fill={SKIN.bride} stroke={INK} strokeWidth={2.5} />
      {/* palm dye */}
      <circle cx={H.x} cy={H.y} r={5.5} fill={SINDOOR} opacity={0.55} />
    </g>
  );
};

/* ------------------------------------------------------------------ betel (paan) leaves */

/** A betel leaf with its stalk at the origin and its tip pointing up (negative y). */
export const PaanLeaf = () => (
  <g>
    <path d="M0 4V-10" stroke="#3a5a30" strokeWidth={4.5} strokeLinecap="round" />
    <path
      d="M0 -8C-16 0 -50 -18 -48 -56C-46 -88 -14 -98 0 -114C14 -98 46 -88 48 -56C50 -18 16 0 0 -8Z"
      fill="#4f7a43"
      stroke={INK}
      strokeWidth={2.4}
      strokeLinejoin="round"
    />
    <path d="M0 -10V-100M0 -34L-24 -52M0 -34L24 -52M0 -58L-26 -76M0 -58L26 -76" stroke="#2f4d2a" strokeWidth={1.8} fill="none" strokeLinecap="round" />
  </g>
);

/** Leaf angle (degrees clockwise from "tip up") for each arm pose; hands blend them exactly like the arms do. */
const leafAngle = (side: 1 | -1, pose: ArmPose): number => {
  let a = side * 168; // hanging from the fingers
  a = lerp(a, -side * 24, clamp01(pose.face)); // tips lean in to veil the face
  a = lerp(a, side * 14, clamp01(pose.namaskar)); // fanned between the palms
  return a;
};

/** The two betel leaves, held by the stalk in each hand. They move with the hands: nothing appears from thin air. */
const HeldLeaves = ({ pose }: { pose: ArmPose }) => (
  <>
    {([-1, 1] as const).map((s) => {
      const { H } = solveArm(s, pose);
      // brought up toward the viewer to veil the face (larger), tucked between the palms (smaller)
      const sc = lerp(lerp(1, 1.38, clamp01(pose.face)), 0.85, clamp01(pose.namaskar));
      return (
        <g key={s}>
          <g transform={`translate(${H.x.toFixed(1)} ${H.y.toFixed(1)}) rotate(${leafAngle(s, pose).toFixed(2)}) scale(${sc.toFixed(3)})`}>
            <PaanLeaf />
          </g>
          {/* fingers gripping the stalk */}
          <circle cx={H.x} cy={H.y} r={13} fill={SKIN.bride} stroke={INK} strokeWidth={2.4} />
        </g>
      );
    })}
  </>
);

/* ------------------------------------------------------------------ garlands */

/** Points of a quadratic/cubic loop where marigolds sit. */
const sampleCubic = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, n: number): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    };
  });

const Flowers = ({ pts, size }: { pts: Pt[]; size: number }) => (
  <>
    {pts.map((p, i) => (
      <use
        key={i}
        href={i % 3 === 1 ? "#mg-b" : "#mg-a"}
        transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${size / 20}) rotate(${i * 37})`}
      />
    ))}
  </>
);

const WORN_LOOP = [
  { x: -42, y: -466 },
  { x: -72, y: -400 },
  { x: -52, y: -336 },
  { x: 0, y: -318 },
] as const;

const WornGarland = ({ worn }: { worn: number }) => {
  if (worn <= 0.01) return null;
  const drop = (1 - worn) * -170;
  const left = sampleCubic(WORN_LOOP[0], WORN_LOOP[1], WORN_LOOP[2], WORN_LOOP[3], 10);
  const right = left.map((p) => ({ x: -p.x, y: p.y })).reverse();
  return (
    <g transform={`translate(0 ${drop.toFixed(1)})`} opacity={clamp01(worn * 1.8)}>
      <Flowers pts={[...left, ...right.slice(1)]} size={13} />
    </g>
  );
};

const HeldGarland = ({ pose, held }: { pose: ArmPose; held: number }) => {
  if (held <= 0.01) return null;
  const hl = solveArm(-1, pose).H;
  const hr = solveArm(1, pose).H;
  const sag = 78;
  const pts = sampleCubic(hl, { x: hl.x, y: hl.y + sag }, { x: hr.x, y: hr.y + sag }, hr, 13);
  return (
    <g opacity={clamp01(held)}>
      <Flowers pts={pts} size={13} />
    </g>
  );
};

/* ------------------------------------------------------------------ face */

const Face = ({
  who,
  turn,
  lookDown,
}: {
  who: "groom" | "bride";
  turn: number;
  lookDown: number;
}) => {
  const skin = SKIN[who];
  const shade = SKIN_SHADE[who];
  const dx = turn * 5;
  const gaze = turn * 4.5;
  const bride = who === "bride";
  return (
    <g>
      {/* ears */}
      <ellipse cx={-48} cy={-545} rx={7} ry={12} fill={skin} stroke={INK} strokeWidth={2} />
      <ellipse cx={48} cy={-545} rx={7} ry={12} fill={skin} stroke={INK} strokeWidth={2} />
      {/* face */}
      <path
        d="M-47 -560C-47 -595 -27 -607 0 -607C27 -607 47 -595 47 -560C47 -520 28 -490 0 -486C-28 -490 -47 -520 -47 -560Z"
        fill={skin}
        stroke={INK}
        strokeWidth={2.6}
      />
      <path d="M-30 -508C-14 -494 14 -494 30 -508" stroke={shade} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.5} />
      <g transform={`translate(${dx} 0)`}>
        <circle cx={-27} cy={-524} r={10} fill="#d4676a" opacity={bride ? 0.28 : 0.16} />
        <circle cx={27} cy={-524} r={10} fill="#d4676a" opacity={bride ? 0.28 : 0.16} />
        {/* brows */}
        <path d={bride ? "M-37 -573Q-23 -583 -9 -575" : "M-37 -574Q-22 -582 -8 -575"} stroke={HAIR} strokeWidth={bride ? 3.2 : 4.4} fill="none" strokeLinecap="round" />
        <path d={bride ? "M37 -573Q23 -583 9 -575" : "M37 -574Q22 -582 8 -575"} stroke={HAIR} strokeWidth={bride ? 3.2 : 4.4} fill="none" strokeLinecap="round" />
        {/* eyes */}
        {[-1, 1].map((s) => (
          <g key={s} transform={`translate(${s * 21} -553)`}>
            <path d="M-13 0Q0 -11 13 0Q0 8 -13 0Z" fill="#fffaf0" stroke={INK} strokeWidth={1.8} />
            <circle cx={gaze} cy={lookDown * 2} r={5.6} fill="#2a1b14" />
            <circle cx={gaze + 1.6} cy={lookDown * 2 - 1.8} r={1.5} fill="#fff" />
            <path d="M-14 0Q0 -12 14 0" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
            {bride && <path d={`M${s * 13} -1l${s * 6} -4`} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />}
          </g>
        ))}
        {/* nose */}
        <path d="M1 -548Q-6 -530 2 -525" stroke={shade} strokeWidth={2.8} fill="none" strokeLinecap="round" />
        {bride && (
          <>
            <circle cx={9} cy={-526} r={5} fill="none" stroke={GOLD} strokeWidth={2.2} />
            <circle cx={9} cy={-519} r={2.2} fill={GOLD} />
          </>
        )}
        {/* mouth */}
        {bride ? (
          <path d="M-13 -508Q-6 -514 0 -511Q6 -514 13 -508Q0 -496 -13 -508Z" fill="#a8323a" stroke="#6e1c24" strokeWidth={1.4} />
        ) : (
          <>
            <path d="M-14 -504Q0 -491 14 -504" stroke="#7a3030" strokeWidth={3.2} fill="none" strokeLinecap="round" />
            <path d="M-15 -515Q-8 -520 0 -515Q8 -520 15 -515Q8 -510 0 -512Q-8 -510 -15 -515Z" fill={HAIR} />
          </>
        )}
        {/* chandan dots across the brow */}
        {[-34, -22, -11, 0, 11, 22, 34].map((x, i) => (
          <circle key={x} cx={x} cy={-586 + Math.abs(x) * 0.12 + (i % 2) * 2} r={2.1} fill="#fff8ea" stroke={GOLD} strokeWidth={0.8} />
        ))}
        {bride ? (
          <circle cx={0} cy={-566} r={4.2} fill={SINDOOR} />
        ) : (
          <path d="M0 -574V-562" stroke="#f3e6c8" strokeWidth={4.5} strokeLinecap="round" />
        )}
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ headgear */

const petal = (len: number, wid: number) =>
  `M0 0C${wid} ${-len * 0.3} ${wid * 0.8} ${-len * 0.8} 0 ${-len}C${-wid * 0.8} ${-len * 0.8} ${-wid} ${-len * 0.3} 0 0Z`;

/** The groom's tall sholapith topor. */
const Topor = () => (
  <g>
    <path
      d="M-50 -598C-62 -650 -34 -716 0 -772C34 -716 62 -650 50 -598Z"
      fill="#fbf6ea"
      stroke={INK}
      strokeWidth={2.6}
    />
    {[0, 1, 2, 3].map((r) => (
      <g key={r}>
        {[-1, 0, 1].map((c) => (
          <path
            key={c}
            d={`M${c * (30 - r * 5) - (22 - r * 4)} ${-612 - r * 36}q${22 - r * 4} ${-26} ${44 - r * 8} 0`}
            stroke={GOLD_DEEP}
            strokeWidth={2}
            fill="none"
            opacity={0.8}
          />
        ))}
      </g>
    ))}
    <path d="M0 -768V-606" stroke={GOLD} strokeWidth={2.4} opacity={0.7} />
    <circle cx={0} cy={-774} r={7} fill={GOLD} stroke={INK} strokeWidth={1.6} />
    <path d="M0 -781V-796" stroke={GOLD} strokeWidth={2.4} />
    <path d="M-54 -600Q0 -586 54 -600L52 -614Q0 -602 -52 -614Z" fill={GOLD} stroke={INK} strokeWidth={2} />
    {[-36, -18, 0, 18, 36].map((x) => (
      <circle key={x} cx={x} cy={-603 + Math.abs(x) * 0.05} r={3} fill={SINDOOR} />
    ))}
  </g>
);

/** The bride's sholapith mukut: a fan of lotus-like petals. */
const Mukut = () => {
  const fan = [
    { a: -66, len: 84, wid: 22 },
    { a: -46, len: 112, wid: 26 },
    { a: -24, len: 138, wid: 30 },
    { a: 24, len: 138, wid: 30 },
    { a: 46, len: 112, wid: 26 },
    { a: 66, len: 84, wid: 22 },
    { a: 0, len: 156, wid: 34 },
  ];
  return (
    <g transform="translate(0 -606)">
      {fan.map((f, i) => (
        <g key={i} transform={`rotate(${f.a})`}>
          <path d={petal(f.len, f.wid)} fill="#fbf6ea" stroke={INK} strokeWidth={2.4} />
          <path d={`M0 -10L0 ${-f.len * 0.8}`} stroke={GOLD_DEEP} strokeWidth={1.8} opacity={0.7} />
          <path d={`M${-f.wid * 0.4} ${-f.len * 0.4}q${f.wid * 0.4} ${-14} ${f.wid * 0.8} 0`} stroke={GOLD_DEEP} strokeWidth={1.6} fill="none" opacity={0.7} />
        </g>
      ))}
      <path d="M-54 6Q0 20 54 6L52 -10Q0 2 -52 -10Z" fill={GOLD} stroke={INK} strokeWidth={2} />
      {[-34, -17, 0, 17, 34].map((x) => (
        <circle key={x} cx={x} cy={2 + Math.abs(x) * 0.05} r={3} fill={SINDOOR} />
      ))}
      <circle cx={0} cy={-150} r={6} fill={GOLD} stroke={INK} strokeWidth={1.4} />
    </g>
  );
};

/* ------------------------------------------------------------------ figures */

export interface FigureProps {
  /** Feet position on the canvas. */
  x: number;
  y: number;
  scale?: number;
  /** -1 looks to screen-left, +1 looks to screen-right, 0 straight ahead. */
  turn?: number;
  /** Walk cycle phase in radians (only used while `moving` > 0). */
  walk?: number;
  /** 0..1 how strongly the walk bob/sway is applied. */
  moving?: number;
  pose?: Partial<ArmPose>;
  /** Garland being held between the hands (0..1) / worn at the neck (0..1). */
  garlandHeld?: number;
  garlandWorn?: number;
  /** Head tilt in degrees (a respectful bow is a small positive/negative tilt). */
  headTilt?: number;
  /** 0 = eyes level, 1 = eyes cast down. */
  lookDown?: number;
  opacity?: number;
}

const fullPose = (p?: Partial<ArmPose>): ArmPose => ({
  hold: p?.hold ?? 0,
  face: p?.face ?? 0,
  namaskar: p?.namaskar ?? 0,
});

const Shell = ({
  x,
  y,
  scale = 1,
  walk = 0,
  moving = 0,
  opacity = 1,
  children,
}: Pick<FigureProps, "x" | "y" | "scale" | "walk" | "moving" | "opacity"> & {
  children: ReactNode;
}) => {
  const bob = Math.abs(Math.sin(walk)) * 7 * moving;
  const sway = Math.sin(walk) * 1.3 * moving;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale})`} opacity={opacity}>
      <ellipse cx={0} cy={4} rx={118} ry={15} fill={INK} opacity={0.18} />
      <g transform={`translate(0 ${(-bob).toFixed(1)}) rotate(${sway.toFixed(2)})`}>{children}</g>
    </g>
  );
};

const GroomImpl = ({
  x,
  y,
  scale = 1,
  turn = 0,
  walk = 0,
  moving = 0,
  pose,
  garlandHeld = 0,
  garlandWorn = 0,
  headTilt = 0,
  lookDown = 0.15,
  opacity = 1,
}: FigureProps) => {
  const arms = fullPose(pose);
  const stepL = Math.max(0, Math.sin(walk)) * 7 * moving;
  const stepR = Math.max(0, -Math.sin(walk)) * 7 * moving;
  return (
    <Shell {...{ x, y, scale, walk, moving, opacity }}>
      {/* feet: pointed golden mojari */}
      <path d={`M-62 ${-6 - stepL}Q-40 ${-20 - stepL} -14 ${-6 - stepL}Q-30 2 -62 ${-6 - stepL}Z`} fill={GOLD} stroke={INK} strokeWidth={2} />
      <path d={`M62 ${-6 - stepR}Q40 ${-20 - stepR} 14 ${-6 - stepR}Q30 2 62 ${-6 - stepR}Z`} fill={GOLD} stroke={INK} strokeWidth={2} />
      {/* dhoti with kochano pleats */}
      <path d="M-82 -236L-98 -10Q0 4 98 -10L82 -236Z" fill="#f7f1e3" stroke={INK} strokeWidth={3} />
      {[-62, -42, -22, 0, 22, 42, 62].map((px, i) => (
        <path key={i} d={`M${px * 0.35} -236Q${px * 0.8} -120 ${px} -14`} stroke={INK} strokeOpacity={0.28} strokeWidth={2} fill="none" />
      ))}
      <path d="M-98 -34L-96 -10Q0 4 96 -10L98 -34Q0 -20 -98 -34Z" fill={GOLD} stroke={INK} strokeWidth={2} />
      <path d="M-97 -26Q0 -12 97 -26" stroke={SINDOOR} strokeWidth={3} fill="none" />
      {/* neck */}
      <rect x={-17} y={-492} width={34} height={42} fill={SKIN.groom} stroke={INK} strokeWidth={2.4} />
      {/* kurta */}
      <path
        d="M-70 -452C-82 -440 -88 -400 -86 -332L-94 -226Q0 -208 94 -226L86 -332C88 -400 82 -440 70 -452C42 -464 -42 -464 -70 -452Z"
        fill="#f1e4c6"
        stroke={INK}
        strokeWidth={3}
      />
      <path d="M-18 -460L0 -424L18 -460" fill="none" stroke={INK} strokeWidth={2.4} />
      <path d="M0 -424V-232" stroke={GOLD} strokeWidth={5} />
      <path d="M-7 -424V-232M7 -424V-232" stroke={SINDOOR} strokeWidth={1.4} />
      {[-390, -345, -300, -255].map((by) => (
        <circle key={by} cx={0} cy={by} r={4} fill={SINDOOR} stroke={GOLD_DEEP} strokeWidth={1} />
      ))}
      <path d="M-94 -230Q0 -212 94 -230" stroke={GOLD} strokeWidth={6} fill="none" />
      {/* uttariya stole over both shoulders */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path
            d={`M${s * 74} -452L${s * 36} -446L${s * 44} -180L${s * 86} -188Z`}
            fill="#d6a53c"
            stroke={INK}
            strokeWidth={2.6}
          />
          <path d={`M${s * 40} -444L${s * 48} -184`} stroke={SINDOOR} strokeWidth={5} />
          <path d={`M${s * 80} -450L${s * 90} -190`} stroke={SINDOOR} strokeWidth={5} />
          {[0, 1, 2, 3, 4, 5].map((f) => (
            <path key={f} d={`M${s * (46 + f * 8)} -186V-166`} stroke={GOLD_DEEP} strokeWidth={2.4} strokeLinecap="round" />
          ))}
        </g>
      ))}
      {/* arms */}
      <GroomArm side={-1} pose={arms} />
      <GroomArm side={1} pose={arms} />
      <HeldGarland pose={arms} held={garlandHeld} />
      <WornGarland worn={garlandWorn} />
      {/* head */}
      <g transform={`rotate(${headTilt} 0 -470)`}>
        <Face who="groom" turn={turn} lookDown={lookDown} />
        <path
          d="M-50 -560C-55 -602 -30 -614 0 -614C30 -614 55 -602 50 -560C47 -584 30 -596 0 -596C-30 -596 -47 -584 -50 -560Z"
          fill={HAIR}
        />
        <Topor />
      </g>
    </Shell>
  );
};

const BrideImpl = ({
  x,
  y,
  scale = 1,
  turn = 0,
  walk = 0,
  moving = 0,
  pose,
  garlandHeld = 0,
  garlandWorn = 0,
  headTilt = 0,
  lookDown = 0.35,
  opacity = 1,
  paan = false,
}: FigureProps & {
  /** Whether she is carrying the two betel (paan) leaves of the শুভদৃষ্টি in her hands. */
  paan?: boolean;
}) => {
  const arms = fullPose(pose);
  const stepL = Math.max(0, Math.sin(walk)) * 6 * moving;
  const stepR = Math.max(0, -Math.sin(walk)) * 6 * moving;
  return (
    <Shell {...{ x, y, scale, walk, moving, opacity }}>
      {/* feet with alta */}
      <ellipse cx={-34} cy={-7 - stepL} rx={24} ry={9} fill={SKIN.bride} stroke={INK} strokeWidth={2} />
      <ellipse cx={34} cy={-7 - stepR} rx={24} ry={9} fill={SKIN.bride} stroke={INK} strokeWidth={2} />
      <path d={`M-50 ${-5 - stepL}Q-34 ${2 - stepL} -18 ${-5 - stepL}`} stroke="#b8242f" strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d={`M50 ${-5 - stepR}Q34 ${2 - stepR} 18 ${-5 - stepR}`} stroke="#b8242f" strokeWidth={5} fill="none" strokeLinecap="round" />
      {/* veil behind the head */}
      <path
        d="M0 -636C-62 -636 -98 -592 -100 -522C-102 -480 -112 -448 -128 -404L-92 -394C-70 -426 -58 -456 -52 -484L52 -484C58 -456 70 -426 92 -394L128 -404C112 -448 102 -480 100 -522C98 -592 62 -636 0 -636Z"
        fill={SAREE}
        stroke={INK}
        strokeWidth={3}
      />
      <path
        d="M-86 -520C-86 -470 -94 -440 -108 -408M86 -520C86 -470 94 -440 108 -408"
        stroke={GOLD}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      {/* saree skirt */}
      <path d="M-78 -312C-92 -210 -112 -100 -120 -8Q0 8 120 -8C112 -100 92 -210 78 -312Z" fill={SAREE} stroke={INK} strokeWidth={3} />
      {[-70, -46, -22, 2, 26, 50, 72].map((px, i) => (
        <path key={i} d={`M${px * 0.5} -310Q${px * 0.9} -150 ${px * 1.1} -26`} stroke="#5a1019" strokeOpacity={0.32} strokeWidth={2.2} fill="none" />
      ))}
      <path d="M-119 -44L-121 -8Q0 8 121 -8L119 -44Q0 -30 -119 -44Z" fill={GOLD} stroke={INK} strokeWidth={2.2} />
      <path d="M-120 -36Q0 -20 120 -36" stroke="#f7e6b0" strokeWidth={3} fill="none" strokeDasharray="2 9" strokeLinecap="round" />
      <path d="M-116 -60Q0 -46 116 -60" stroke={GOLD} strokeWidth={3.5} fill="none" />
      {/* neck */}
      <rect x={-16} y={-492} width={32} height={42} fill={SKIN.bride} stroke={INK} strokeWidth={2.4} />
      {/* blouse */}
      <path
        d="M-58 -454C-66 -424 -60 -380 -54 -326L54 -326C60 -380 66 -424 58 -454C36 -466 -36 -466 -58 -454Z"
        fill="#e2c27b"
        stroke={INK}
        strokeWidth={3}
      />
      <path d="M-30 -462Q0 -440 30 -462" stroke={INK} strokeWidth={2.2} fill="none" />
      {/* pallu across the chest and over the left shoulder */}
      <path d="M-58 -454L-24 -464L66 -318L24 -300Z" fill={SAREE} stroke={INK} strokeWidth={2.6} />
      <path d="M-58 -454L24 -300M-24 -464L66 -318" stroke={GOLD} strokeWidth={5} fill="none" />
      <path d="M-66 -448C-96 -420 -102 -300 -98 -150L-62 -150C-64 -280 -60 -400 -52 -452Z" fill={SAREE} stroke={INK} strokeWidth={2.6} />
      <path d="M-98 -156L-62 -156" stroke={GOLD} strokeWidth={9} />
      {[0, 1, 2, 3, 4].map((f) => (
        <path key={f} d={`M${-96 + f * 8} -150V-132`} stroke={GOLD_DEEP} strokeWidth={2.4} strokeLinecap="round" />
      ))}
      {/* necklaces */}
      <path d="M-30 -482Q0 -464 30 -482" stroke={GOLD} strokeWidth={8} fill="none" strokeLinecap="round" />
      {[-22, -11, 0, 11, 22].map((nx) => (
        <circle key={nx} cx={nx} cy={-472 + (22 - Math.abs(nx)) * 0.28 - 6} r={2.8} fill={SINDOOR} />
      ))}
      <path d="M-36 -474C-58 -422 -32 -382 0 -366C32 -382 58 -422 36 -474" stroke={GOLD} strokeWidth={5} fill="none" strokeLinecap="round" />
      <circle cx={0} cy={-362} r={9} fill={SINDOOR} stroke={GOLD} strokeWidth={3} />
      {/* arms */}
      <BrideArm side={-1} pose={arms} />
      <BrideArm side={1} pose={arms} />
      <HeldGarland pose={arms} held={garlandHeld} />
      <WornGarland worn={garlandWorn} />
      {/* head */}
      <g transform={`rotate(${headTilt} 0 -470)`}>
        <Face who="bride" turn={turn} lookDown={lookDown} />
        {/* hairline under the crown */}
        <path
          d="M-48 -562C-52 -604 -28 -616 0 -616C28 -616 52 -604 48 -562C44 -584 28 -596 0 -596C-28 -596 -44 -584 -48 -562Z"
          fill={HAIR}
        />
        {/* maang tikka */}
        <path d="M0 -598V-584" stroke={GOLD} strokeWidth={2} />
        <path d="M0 -584C-6 -578 -5 -572 0 -568C5 -572 6 -578 0 -584Z" fill={SINDOOR} stroke={GOLD} strokeWidth={2} />
        {/* earrings */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <circle cx={s * 51} cy={-532} r={5} fill={GOLD} />
            <path d={`M${s * 51} -528l${s * 0} 16`} stroke={GOLD} strokeWidth={2} />
            <circle cx={s * 51} cy={-510} r={5.5} fill={SINDOOR} stroke={GOLD} strokeWidth={2} />
          </g>
        ))}
        <Mukut />
      </g>
      {paan && <HeldLeaves pose={arms} />}
    </Shell>
  );
};

/** Props equality that treats the `pose` object by value, so a figure whose pose did not change is not re-rendered. */
const sameFigure = (a: Record<string, unknown>, b: Record<string, unknown>): boolean => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (k === "pose") {
      const pa = (a.pose ?? {}) as Partial<ArmPose>;
      const pb = (b.pose ?? {}) as Partial<ArmPose>;
      if ((pa.hold ?? 0) !== (pb.hold ?? 0) || (pa.face ?? 0) !== (pb.face ?? 0) || (pa.namaskar ?? 0) !== (pb.namaskar ?? 0)) return false;
    } else if (a[k] !== b[k]) return false;
  }
  return true;
};

export const Groom = memo(GroomImpl, sameFigure);
export const Bride = memo(BrideImpl, sameFigure);

/** Hidden SVG defs for the marigold glyph shared by garlands, mandap strings and arches. */
export const MarigoldDefs = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden="true">
    <defs>
      {[
        ["mg-a", "#e8a33a", "#c9701a"],
        ["mg-b", "#f1bb4c", "#d98a1f"],
      ].map(([id, outer, inner]) => (
        <g id={id} key={id}>
          {Array.from({ length: 10 }, (_, i) => (
            <ellipse key={i} cx={0} cy={-10} rx={5.6} ry={9.5} transform={`rotate(${i * 36})`} fill={outer} stroke={INK} strokeOpacity={0.4} strokeWidth={1} />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <ellipse key={i} cx={0} cy={-5.5} rx={4} ry={6} transform={`rotate(${i * 51 + 12})`} fill={inner} fillOpacity={0.9} />
          ))}
          <circle r={3} fill="#8f4a14" />
        </g>
      ))}
    </defs>
  </svg>
);
