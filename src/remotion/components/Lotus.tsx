import { useId } from "react";

const INK = "#30251f";

interface LotusProps {
  /** Centre-bottom of the lotus (its stem point) in canvas coordinates. */
  x: number;
  y: number;
  /** 0 = closed bud, 1 = fully open. */
  bloom: number;
  /** Overall scale (1 = 250px petals). */
  scale?: number;
  /** Warm gold glow behind the flower, 0..1. */
  glow?: number;
  /** Tint of the petals: "pink" (sindoor-rose) or "gold" (ornament). */
  tone?: "pink" | "gold";
}

const petalPath = (len: number, wid: number): string =>
  `M0 0C${wid} ${-len * 0.28} ${wid * 0.78} ${-len * 0.8} 0 ${-len}C${-wid * 0.78} ${-len * 0.8} ${-wid} ${-len * 0.28} 0 0Z`;

interface Layer {
  count: number;
  spread: number; // total fan angle at full bloom
  len: number;
  wid: number;
  open: number; // extra lateral opening multiplier
}

const LAYERS: Layer[] = [
  { count: 7, spread: 168, len: 235, wid: 62, open: 1 },
  { count: 6, spread: 120, len: 205, wid: 56, open: 0.85 },
  { count: 5, spread: 78, len: 170, wid: 50, open: 0.6 },
  { count: 3, spread: 36, len: 130, wid: 42, open: 0.35 },
];

/** A stylised lotus whose petals fan open with `bloom`. Pure function of its props. */
export const Lotus = ({ x, y, bloom, scale = 1, glow = 0, tone = "pink" }: LotusProps) => {
  const uid = useId().replace(/:/g, "");
  const gid = `lotus-${uid}`;
  const pink = tone === "pink";
  const base = pink ? "#fbeee6" : "#f6e2a8";
  const tip = pink ? "#c4566a" : "#b98a36";
  const edge = pink ? "#781f2b" : "#8a6422";

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={base} />
          <stop offset="0.55" stopColor={pink ? "#eaa3a8" : "#e0bf6e"} />
          <stop offset="1" stopColor={tip} />
        </linearGradient>
        <radialGradient id={`${gid}-glow`}>
          <stop offset="0" stopColor="#f7dc98" stopOpacity="0.85" />
          <stop offset="1" stopColor="#f7dc98" stopOpacity="0" />
        </radialGradient>
      </defs>
      {glow > 0 && <circle cx={0} cy={-130} r={330} fill={`url(#${gid}-glow)`} opacity={glow} />}
      {/* sepals / leaf pair under the flower */}
      <path d="M0 6C-70 8 -150 -4 -190 -40C-120 -52 -50 -34 0 6Z" fill="#4f6b4a" fillOpacity={0.85} stroke={INK} strokeOpacity={0.4} strokeWidth={2} />
      <path d="M0 6C70 8 150 -4 190 -40C120 -52 50 -34 0 6Z" fill="#4f6b4a" fillOpacity={0.85} stroke={INK} strokeOpacity={0.4} strokeWidth={2} />
      {LAYERS.map((layer, li) =>
        Array.from({ length: layer.count }, (_, i) => {
          const f = layer.count === 1 ? 0 : i / (layer.count - 1) - 0.5;
          const angle = f * layer.spread * (0.18 + 0.82 * bloom);
          const len = layer.len * (0.62 + 0.38 * bloom);
          const wid = layer.wid * (0.7 + 0.3 * layer.open * bloom);
          return (
            <g key={`${li}-${i}`} transform={`rotate(${angle.toFixed(2)})`}>
              <path d={petalPath(len, wid)} fill={`url(#${gid})`} stroke={edge} strokeOpacity={0.55} strokeWidth={2.2} />
              <path d={`M0 -8L0 ${-len * 0.78}`} stroke={edge} strokeOpacity={0.3} strokeWidth={1.6} fill="none" />
              <path d={`M${-wid * 0.3} -20C${-wid * 0.35} ${-len * 0.4} ${-wid * 0.22} ${-len * 0.65} 0 ${-len * 0.86}`} stroke={edge} strokeOpacity={0.18} strokeWidth={1.4} fill="none" />
            </g>
          );
        }),
      )}
      {/* gold stamens */}
      <g opacity={0.4 + 0.6 * bloom}>
        {Array.from({ length: 9 }, (_, i) => {
          const a = (i / 8 - 0.5) * 70;
          return (
            <g key={i} transform={`rotate(${a})`}>
              <path d="M0 -4L0 -62" stroke="#c49a52" strokeWidth={3} strokeLinecap="round" />
              <circle cx={0} cy={-66} r={5} fill="#c49a52" />
            </g>
          );
        })}
      </g>
    </g>
  );
};
