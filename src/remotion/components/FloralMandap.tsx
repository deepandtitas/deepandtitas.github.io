import { MEET_Y } from "../lib/path";
import { easeOut, lerp, progress, seeded } from "../lib/anim";
import { Diya } from "./Diya";

const INK = "#30251f";
const GOLD = "#c49a52";
const SINDOOR = "#781f2b";

/** Geometry shared by the meeting scene (gathering flowers) and the wedding scene (finished mandap). */
export const MANDAP = {
  cx: 540,
  baseY: MEET_Y,
  postX: [205, 875] as const,
  archCy: 700,
  archRx: 330,
  archRy: 235,
  /** Centre of the gathered flowers — where the guided hotspot sits. */
  hotspot: { x: 540, y: 560 },
} as const;

const ARCH_COUNT = 36;

const archPoint = (i: number) => {
  const a = Math.PI - (i / (ARCH_COUNT - 1)) * Math.PI;
  return {
    x: MANDAP.cx + MANDAP.archRx * Math.cos(a),
    y: MANDAP.archCy - MANDAP.archRy * Math.sin(a),
  };
};

const Marigold = ({ x, y, r, variant, rot = 0 }: { x: number; y: number; r: number; variant: number; rot?: number }) => (
  <use
    href={variant % 3 === 1 ? "#mg-b" : "#mg-a"}
    transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(r / 20).toFixed(3)}) rotate(${rot})`}
  />
);

const DIYA_SPOTS = [
  { x: 120, y: 1540 },
  { x: 215, y: 1585 },
  { x: 345, y: 1600 },
  { x: 460, y: 1612 },
  { x: 620, y: 1612 },
  { x: 735, y: 1600 },
  { x: 865, y: 1585 },
  { x: 960, y: 1540 },
] as const;

export const DIYA_COUNT = DIYA_SPOTS.length;

interface FloralMandapProps {
  /** Arch flowers flying in and settling: 0 scattered → 1 formed. */
  gather: number;
  /** The rest of the structure: posts, canopy, strings, floor. */
  build: number;
  /** Diyas lighting up one by one. */
  lights: number;
  /** Global frame, for gentle sway and flame flicker (deterministic). */
  time: number;
  /** Warm gold bloom around the couple (the emotional peak). */
  glow?: number;
}

export const FloralMandap = ({ gather, build, lights, time, glow = 0 }: FloralMandapProps) => {
  const { cx, baseY, postX, archCy, archRx, archRy } = MANDAP;
  const sway = Math.sin(time * 0.045) * 1.6;
  const domeA = progress(build, [0.08, 0.6]);
  const postH = (baseY - 705) * easeOut(progress(build, [0, 0.55]));
  const valance = progress(build, [0.3, 0.72]);
  const strings = progress(build, [0.5, 1]);
  const floor = progress(build, [0, 0.6]);

  return (
    <g>
      {/* gold bloom behind everything */}
      {glow > 0.001 && (
        <circle cx={cx} cy={1090} r={760} fill="url(#glow-grad)" opacity={glow} />
      )}

      {/* alpana floor */}
      <g opacity={floor} transform={`translate(${cx} ${baseY + 38})`}>
        <ellipse rx={430} ry={78} fill="#f1e2c4" fillOpacity={0.55} stroke={SINDOOR} strokeOpacity={0.55} strokeWidth={4} />
        <ellipse rx={380} ry={64} fill="none" stroke={GOLD} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
        <ellipse rx={300} ry={48} fill="none" stroke={SINDOOR} strokeOpacity={0.5} strokeWidth={3} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <ellipse key={i} cx={Math.cos(a) * 250} cy={Math.sin(a) * 40} rx={22} ry={9} transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * 250} ${Math.sin(a) * 40})`} fill="none" stroke={SINDOOR} strokeOpacity={0.6} strokeWidth={3} />;
        })}
        {[-120, 120].map((dx) => (
          <path key={dx} d={`M${dx - 40} 0Q${dx} -20 ${dx + 40} 0Q${dx} 20 ${dx - 40} 0Z`} fill="none" stroke={GOLD} strokeWidth={3} />
        ))}
      </g>

      {/* dome canopy */}
      <g opacity={domeA}>
        <path
          d={`M${cx - archRx} ${archCy}A${archRx} ${archRy} 0 0 1 ${cx + archRx} ${archCy}Z`}
          fill="url(#dome-grad)"
          stroke={INK}
          strokeOpacity={0.6}
          strokeWidth={3}
        />
        {Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI - ((i + 1) / 10) * Math.PI;
          return (
            <path
              key={i}
              d={`M${cx} ${archCy}L${(cx + archRx * Math.cos(a)).toFixed(1)} ${(archCy - archRy * Math.sin(a)).toFixed(1)}`}
              stroke={GOLD}
              strokeWidth={2.4}
              strokeOpacity={0.55}
            />
          );
        })}
        <path d={`M${cx - 290} ${archCy - 6}A290 190 0 0 1 ${cx + 290} ${archCy - 6}`} fill="none" stroke={GOLD} strokeWidth={3} strokeOpacity={0.6} strokeDasharray="2 12" strokeLinecap="round" />
      </g>

      {/* posts: banana-stem pillars wrapped in marigold */}
      {postX.map((px, pi) => (
        <g key={px}>
          <path
            d={`M${px - 20} ${baseY}L${px - 15} ${baseY - postH}L${px + 15} ${baseY - postH}L${px + 20} ${baseY}Z`}
            fill="#8a6a3c"
            stroke={INK}
            strokeWidth={3}
          />
          {[0.2, 0.5, 0.8].map((f) => (
            <rect key={f} x={px - 19 + f * 4} y={baseY - postH * f - 5} width={38 - f * 8} height={10} fill={GOLD} stroke={INK} strokeOpacity={0.5} strokeWidth={1.6} />
          ))}
          {Array.from({ length: 14 }, (_, i) => {
            const f = i / 13;
            if (f * 0.9 > postH / (baseY - 705)) return null;
            return (
              <Marigold
                key={i}
                x={px + Math.sin(f * Math.PI * 5 + pi) * 24}
                y={baseY - 30 - f * (baseY - 760) * (postH / (baseY - 705))}
                r={15}
                variant={i + pi}
                rot={i * 40}
              />
            );
          })}
          {/* banana leaves at the foot of each post */}
          <g opacity={floor}>
            {[-62, -34, -8, 20, 48].map((ang, i) => (
              <path
                key={ang}
                transform={`translate(${px} ${baseY + 2}) rotate(${ang * (pi === 0 ? 1 : -1)})`}
                d={`M0 0C${-30 - i * 2} -90 ${-26} -180 0 ${-230 + (i % 2) * 24}C${26} -180 ${30 + i * 2} -90 0 0Z`}
                fill={i % 2 ? "#4f6b4a" : "#60794f"}
                stroke={INK}
                strokeOpacity={0.5}
                strokeWidth={2}
               
              />
            ))}
          </g>
        </g>
      ))}

      {/* valance with scalloped fringe */}
      <g opacity={valance} transform={`translate(${cx} ${archCy}) scale(${lerp(0.7, 1, valance)} 1) translate(${-cx} ${-archCy})`}>
        <rect x={cx - archRx - 8} y={archCy - 2} width={archRx * 2 + 16} height={46} fill={SINDOOR} stroke={INK} strokeWidth={3} />
        <rect x={cx - archRx - 8} y={archCy + 4} width={archRx * 2 + 16} height={8} fill={GOLD} />
        <rect x={cx - archRx - 8} y={archCy + 32} width={archRx * 2 + 16} height={6} fill={GOLD} />
        {Array.from({ length: 24 }, (_, i) => {
          const w = (archRx * 2 + 16) / 24;
          const x = cx - archRx - 8 + i * w;
          return (
            <path
              key={i}
              d={`M${x.toFixed(1)} ${archCy + 44}q${(w / 2).toFixed(1)} 34 ${w.toFixed(1)} 0Z`}
              fill={i % 2 ? GOLD : SINDOOR}
              stroke={INK}
              strokeOpacity={0.6}
              strokeWidth={1.8}
            />
          );
        })}
      </g>

      {/* hanging marigold strings */}
      <g opacity={strings}>
        {Array.from({ length: 13 }, (_, i) => {
          const x = cx - archRx + 20 + (i * (archRx * 2 - 40)) / 12;
          const len = (90 + seeded(i + 4) * 120) * strings;
          const n = Math.floor(len / 24);
          return Array.from({ length: n }, (_, j) => (
            <Marigold key={`${i}-${j}`} x={x + Math.sin(time * 0.05 + i) * 2.5 * (j / 8)} y={archCy + 70 + j * 24} r={11} variant={i + j} rot={j * 50} />
          ));
        })}
      </g>

      {/* the gathered arch of flowers (formed during the meeting scene) */}
      <g transform={`translate(${sway.toFixed(2)} 0)`}>
        {Array.from({ length: ARCH_COUNT }, (_, i) => {
          const fin = archPoint(i);
          const sx = fin.x + (seeded(i * 3 + 1) - 0.5) * 1000;
          const sy = fin.y - 120 + (seeded(i * 3 + 2) - 0.2) * 700;
          const g = easeOut(Math.min(1, Math.max(0, gather * 1.7 - (i / ARCH_COUNT) * 0.7)));
          return (
            <Marigold
              key={i}
              x={lerp(sx, fin.x, g)}
              y={lerp(sy, fin.y, g)}
              r={lerp(10, 21, g)}
              variant={i}
              rot={i * 33 + (1 - g) * 160}
            />
          );
        })}
      </g>

      {/* diyas */}
      {build > 0.02 && DIYA_SPOTS.map((d, i) => (
        <Diya key={i} x={d.x} y={d.y} lit={progress(lights, [(i / DIYA_COUNT) * 0.7, (i / DIYA_COUNT) * 0.7 + 0.3])} time={time + i * 11} scale={0.95 + (d.y - 1540) / 600} />
      ))}
    </g>
  );
};
