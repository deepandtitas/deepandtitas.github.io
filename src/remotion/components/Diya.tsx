const INK = "#30251f";

interface DiyaProps {
  x: number;
  y: number;
  /** 0 = unlit, 1 = fully lit. */
  lit: number;
  /** Frame-derived time for a deterministic flicker. */
  time: number;
  scale?: number;
}

/** A small clay oil lamp with a flickering flame and a soft glow. */
export const Diya = ({ x, y, lit, time, scale = 1 }: DiyaProps) => {
  const flick = 1 + 0.09 * Math.sin(time * 0.72) + 0.05 * Math.sin(time * 1.93 + 1.3);
  const lean = Math.sin(time * 0.41) * 1.6;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {lit > 0.01 && <circle cx={0} cy={-26} r={78 * lit} fill="url(#glow-grad)" opacity={0.85 * lit} />}
      {/* bowl */}
      <path d="M-30 -10C-24 12 24 12 30 -10C16 -16 -16 -16 -30 -10Z" fill="#b5603a" stroke={INK} strokeWidth={2.4} />
      <path d="M-30 -10Q0 -22 30 -10" fill="#8f4528" stroke={INK} strokeWidth={2} />
      <path d="M-18 4Q0 10 18 4" stroke="#e0a874" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.8} />
      <path d="M-34 -10Q-44 -14 -42 -22Q-34 -18 -30 -12" fill="#b5603a" stroke={INK} strokeWidth={2} />
      {/* wick + flame */}
      <path d="M-1 -14L1 -22" stroke="#2a1b14" strokeWidth={2.4} strokeLinecap="round" />
      {lit > 0.01 && (
        <g transform={`translate(${lean.toFixed(2)} -22) scale(${(lit * flick).toFixed(3)} ${(lit * flick * 1.08).toFixed(3)})`}>
          <path d="M0 0C-13 -10 -10 -28 0 -50C10 -28 13 -10 0 0Z" fill="url(#flame-grad)" />
          <path d="M0 -3C-5 -9 -4 -18 0 -28C4 -18 5 -9 0 -3Z" fill="#fff3c4" opacity={0.9} />
        </g>
      )}
    </g>
  );
};
