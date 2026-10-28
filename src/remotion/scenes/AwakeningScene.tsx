import { BEATS, sceneDuration } from "../../config/timeline";
import { Alpana, ALPANA_CENTER } from "../components/Alpana";
import { GuidedHotspot } from "../components/GuidedHotspot";
import { Lotus } from "../components/Lotus";
import { RevealText } from "../components/RevealText";
import { useExperience, useText } from "../experience";
import { HOTSPOTS } from "../layout";
import { progress, ramp } from "../lib/anim";
import { useBeat } from "../lib/time";
import { LOTUS_BASE_Y, PATH_T_LOTUS, pathCenterline, pathPoint } from "../lib/path";

const B = BEATS.awakening;
const SINDOOR = "#781f2b";

/** A soft spring settle (closed form, so fractional beats interpolate smoothly): 0 → 1 with a slight overshoot. */
const settle = (t: number): number => (t <= 0 ? 0 : 1 - Math.exp(-5 * t) * Math.cos(4.2 * t));

/** Scene 1 — the awakening (beats 0–239). Rendered a little longer so the garden can dissolve over it. */
export const AwakeningScene = () => {
  const frame = useBeat();
  const { reducedMotion, interactive, guided, lang } = useExperience();
  const tx = useText();
  const dur = sceneDuration("awakening");
  const exit = progress(frame, [dur + 8, dur + 58]);

  // the tiny gold light, then the glow that warms the lotus
  const light = progress(frame, B.lightIn);
  const lightR = ramp(frame, B.lightIn, 3, 26);
  const glow = progress(frame, B.lotusBloom);

  // the lotus: in guided mode it is a closed bud from the first frame so there is something to tap
  const lotusOpacity = guided.enabled ? 1 : progress(frame, [B.lotusBloom[0] - 14, B.lotusBloom[0] + 4]);
  const bloom = reducedMotion
    ? progress(frame, [B.lotusBloom[0], B.lotusBloom[0] + 20])
    : settle((frame - B.lotusBloom[0]) / (B.lotusBloom[1] - B.lotusBloom[0]));

  // the closing alpana curve that becomes the garden path
  const pathP = progress(frame, B.pathExtend);
  const tHead = PATH_T_LOTUS + (1 - PATH_T_LOTUS) * pathP;
  const head = pathPoint(tHead);

  const showLotusHotspot = interactive && guided.awaiting === "awakening";
  const showPathHotspot = interactive && guided.awaiting === "meeting";

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - exit }}>
      <Alpana frame={reducedMotion ? Math.max(frame, B.alpanaDraw[1]) : frame} />

      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        {/* light */}
        {light > 0.001 && (
          <>
            <circle cx={ALPANA_CENTER.x} cy={ALPANA_CENTER.y} r={lightR * 5.5} fill="url(#glow-grad)" opacity={light * (1 - glow * 0.35) * 0.9} />
            <circle cx={ALPANA_CENTER.x} cy={ALPANA_CENTER.y} r={lightR * 0.45} fill="#fff3cf" opacity={light * (1 - lotusOpacity * 0.85)} />
          </>
        )}
        {/* the closing curve */}
        {pathP > 0.001 && (
          <>
            <path d={pathCenterline(PATH_T_LOTUS, tHead)} fill="none" stroke="#e7c97c" strokeWidth={14} strokeLinecap="round" opacity={0.35} />
            <path d={pathCenterline(PATH_T_LOTUS, tHead)} fill="none" stroke={SINDOOR} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
            {pathP < 0.999 && <circle cx={head.x} cy={head.y} r={11} fill="#f3d37e" opacity={0.95} />}
          </>
        )}
        <g opacity={lotusOpacity}>
          <Lotus x={540} y={LOTUS_BASE_Y} bloom={bloom} glow={glow} />
        </g>
      </svg>

      <RevealText
        text={tx.title}
        frame={frame}
        range={B.namesReveal}
        size={lang === "bn" ? 156 : 168}
        color={SINDOOR}
        italicEn
        display
        style={{ top: lang === "bn" ? 338 : 336 }}
      />
      <RevealText
        text={tx.subtitle}
        frame={frame}
        range={B.subtitleIn}
        size={lang === "bn" ? 50 : 56}
        weight={lang === "bn" ? 500 : 400}
        color="#665343"
        italicEn
        spacing={lang === "bn" ? "0.04em" : "0.08em"}
        style={{ top: lang === "bn" ? 572 : 570 }}
      />

      {showLotusHotspot && (
        <GuidedHotspot
          x={HOTSPOTS.lotus.x}
          y={HOTSPOTS.lotus.y}
          label={tx.hintLotus}
          ariaLabel={tx.hintLotus}
          labelPosition="below"
          onActivate={(e) => guided.onActivate?.("awakening", e)}
        />
      )}
      {showPathHotspot && (
        <GuidedHotspot
          x={HOTSPOTS.path.x}
          y={HOTSPOTS.path.y}
          size={300}
          label={tx.hintPath}
          ariaLabel={tx.hintPath}
          labelPosition="above"
          onActivate={(e) => guided.onActivate?.("meeting", e)}
        />
      )}
    </div>
  );
};
