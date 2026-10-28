import { Lotus } from "./Lotus";

const SINDOOR = "#781f2b";
const GOLD = "#c49a52";

interface Props {
  x: number;
  y: number;
  scale?: number;
  bloom?: number;
  opacity?: number;
  /** 0..1 — ring dots and outer sparkle ring, drawn as the ornament "wakes". */
  halo?: number;
}

/** The gold-on-sindoor lotus medallion: the "gold ornament" that opens the invitation. */
export const Emblem = ({ x, y, scale = 1, bloom = 1, opacity = 1, halo = 1 }: Props) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    {halo > 0.01 && <circle r={150} fill="url(#glow-grad)" opacity={0.7 * halo} />}
    <circle r={92} fill={SINDOOR} stroke={GOLD} strokeWidth={6} />
    <circle r={78} fill="none" stroke={GOLD} strokeWidth={2.4} strokeDasharray="1 10" strokeLinecap="round" />
    <circle r={66} fill="none" stroke="#e6c880" strokeWidth={1.6} strokeOpacity={0.7} />
    <Lotus x={0} y={50} scale={0.33} bloom={bloom} tone="gold" />
  </g>
);
