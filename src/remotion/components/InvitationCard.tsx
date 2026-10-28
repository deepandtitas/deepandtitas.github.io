import { ART } from "../art-manifest";
import { BEATS } from "../../config/timeline";
import { formatDate } from "../../config/dates";
import { EVENT_KEYS, hasValue, mapUrl, visibleEvents, wedding, type EventKey } from "../../config/wedding";
import { easeInOut, easeOut, progress } from "../lib/anim";
import { useAsset, useExperience, useText } from "../experience";
import { BN_PAD, bnWeight, DISPLAY_WEIGHT, FONT_BN, FONT_BN_DISPLAY, FONT_BN_UI, FONT_EN } from "../fonts";

const INK = "#30251f";
const MUTED = "#665343";
const SINDOOR = "#781f2b";
const GOLD = "#c49a52";
const GOLD_DEEP = "#8f6c2a";

export const CARD = { left: 70, width: 940, height: 1600, top: 160, radius: 26 } as const;

const B = BEATS.invitation;

const Stroke = ({ d, p, stroke, width, opacity = 1 }: { d: string; p: number; stroke: string; width: number; opacity?: number }) =>
  p <= 0.001 ? null : (
    <path
      d={d}
      pathLength={1}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={1}
      strokeDashoffset={1 - p}
      opacity={opacity}
    />
  );

/** Corner ornament, drawn for the top-left corner and mirrored for the others. */
const Corner = ({ p, mx, my }: { p: number; mx: 1 | -1; my: 1 | -1 }) => {
  const x = mx === 1 ? 0 : CARD.width;
  const y = my === 1 ? 0 : CARD.height;
  return (
    <g transform={`translate(${x} ${y}) scale(${mx} ${my})`}>
      <Stroke d="M34 100A66 66 0 0 1 100 34" p={p} stroke={GOLD} width={3.5} />
      <Stroke d="M34 76A42 42 0 0 1 76 34" p={p} stroke={SINDOOR} width={3} opacity={0.8} />
      <Stroke d="M34 130C34 90 60 60 100 54C124 52 136 66 128 80C122 90 108 88 110 76" p={p} stroke={GOLD} width={3} />
      <Stroke d="M130 34C90 34 60 60 54 100C52 124 66 136 80 128C90 122 88 108 76 110" p={p} stroke={GOLD} width={3} />
      {p > 0.5 && <circle cx={50} cy={50} r={9} fill={SINDOOR} stroke={GOLD} strokeWidth={3} opacity={(p - 0.5) * 2} />}
    </g>
  );
};

const Divider = ({ p }: { p: number }) => (
  <svg width={520} height={44} viewBox="0 0 520 44" style={{ display: "block" }}>
    <Stroke d="M10 22H220" p={p} stroke={GOLD} width={3} />
    <Stroke d="M300 22H510" p={p} stroke={GOLD} width={3} />
    <g opacity={p}>
      <path d="M260 6C272 14 272 30 260 38C248 30 248 14 260 6Z" fill={SINDOOR} stroke={GOLD} strokeWidth={2.5} />
      <circle cx={232} cy={22} r={4.5} fill={GOLD} />
      <circle cx={288} cy={22} r={4.5} fill={GOLD} />
    </g>
  </svg>
);

const Pin = () => (
  <svg width={48} height={55} viewBox="0 0 52 60" aria-hidden="true">
    <path d="M26 58C10 38 4 30 4 21C4 10 14 2 26 2C38 2 48 10 48 21C48 30 42 38 26 58Z" fill="#f8ecd2" stroke="#f8ecd2" strokeWidth={2} />
    <circle cx={26} cy={21} r={9} fill={SINDOOR} />
  </svg>
);

const CSS = `
.dt-map { transition: transform .18s ease, box-shadow .18s ease, background-color .18s ease }
.dt-map:hover { transform: translateY(-4px); background: #8f2433 !important }
.dt-map:active { transform: translateY(1px) scale(.985) }
.dt-map:focus-visible { outline: 6px solid #c49a52; outline-offset: 8px }
`;

/**
 * The final keepsake card. Rendered inside the composition so it is identical in the Player and in video renders.
 * `frame` is the invitation scene's local frame; `top` lets the scene slide the card up from the ornament;
 * `border` is how much of the ornamental border has been drawn (it is complete by the time the card rises).
 */
export const InvitationCard = ({ frame, top, border = 1 }: { frame: number; top: number; border?: number }) => {
  const { lang, interactive } = useExperience();
  const tx = useText();
  const url = useAsset();
  const bn = lang === "bn";
  const fontMain = bn ? FONT_BN : FONT_EN;
  const fontNames = bn ? FONT_BN_DISPLAY : FONT_EN;
  const fontUi = bn ? FONT_BN_UI : FONT_EN; // small labels and the map button stay crisp
  const w = (n: number) => bnWeight(lang, n);

  const heading = progress(frame, B.heading, easeOut);
  const names = progress(frame, B.names, easeOut);
  const message = progress(frame, B.message, easeOut);
  const details = progress(frame, B.details, easeOut);
  const button = progress(frame, B.mapButton, easeOut);
  const flourish = progress(frame, B.flourish, easeInOut);
  // one soft gold glow passing over the names, then it settles for good
  const shimmer = Math.sin(Math.PI * progress(frame, [B.flourish[0] - 10, B.flourish[1] + 30])) * 0.9;

  // opacity + transform only; no will-change toggling (promoting/demoting layers mid-animation makes text flicker)
  const rise = (p: number) => ({
    opacity: p,
    transform: `translateY(${((1 - p) * 26).toFixed(2)}px)`,
  });

  const events = visibleEvents();
  const venue = wedding.venue;
  const venueName = venue.name[lang];
  const venueNote = venue.note[lang];
  const address = venue.address[lang];
  const landmark = venue.landmark[lang];
  const hasVenue = hasValue(venueName) || hasValue(address);
  const eventLabel: Record<EventKey, string> = { wedding: tx.weddingLabel, reception: tx.receptionLabel };

  const Label = ({ children }: { children: string }) => (
    <div
      style={{
        fontFamily: fontUi,
        fontWeight: 600,
        fontSize: bn ? 32 : 36,
        lineHeight: 1.4,
        letterSpacing: bn ? "0.02em" : "0.2em",
        textTransform: bn ? "none" : "uppercase",
        color: GOLD_DEEP,
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  );

  const EventBlock = ({ k }: { k: EventKey }) => {
    const ev = wedding.events[k];
    const d = formatDate(ev.date, lang);
    if (!d) return null;
    const when = [d.weekday, ev.time[lang]].filter(hasValue).join(", ");
    return (
      <div style={{ textAlign: "center", flex: 1, minWidth: 0 }}>
        <Label>{eventLabel[k]}</Label>
        <div style={{ fontFamily: fontMain, fontWeight: w(600), fontSize: bn ? 42 : 46, lineHeight: 1.35, color: SINDOOR, whiteSpace: "nowrap" }}>
          {d.day}
        </div>
        {bn && hasValue(ev.bengaliDate) && (
          <div style={{ fontFamily: FONT_BN, fontWeight: w(500), fontSize: 33, lineHeight: 1.4, color: GOLD_DEEP }}>{ev.bengaliDate}</div>
        )}
        <div style={{ fontFamily: fontMain, fontWeight: w(bn ? 500 : 400), fontSize: bn ? 36 : 42, lineHeight: 1.4, color: MUTED }}>{when}</div>
      </div>
    );
  };

  const mapStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    height: 136,
    minWidth: 600,
    padding: "0 64px",
    borderRadius: 75,
    background: SINDOOR,
    border: `5px solid ${GOLD}`,
    color: "#f8ecd2",
    fontFamily: fontUi,
    fontWeight: 600,
    fontSize: bn ? 52 : 58,
    lineHeight: 1.4,
    letterSpacing: bn ? "0.01em" : "0.06em",
    textDecoration: "none",
    boxShadow: "0 10px 0 rgba(48,37,31,.18)",
    pointerEvents: "auto",
  } as const;

  return (
    <div
      style={{
        position: "absolute",
        left: CARD.left,
        top,
        width: CARD.width,
        height: CARD.height,
        borderRadius: CARD.radius,
        background: "linear-gradient(180deg,#fbf4e6 0%,#f6ecd9 100%)",
        boxShadow: "0 34px 90px rgba(20,8,8,.55), 0 0 0 2px rgba(196,154,82,.55)",
        overflow: "hidden",
        color: INK,
      }}
    >
      <style>{CSS}</style>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${url(ART.paper.src)}")`,
          backgroundSize: "cover",
          opacity: 0.55,
          pointerEvents: "none",
        }}
      />

      {/* ornamental border */}
      <svg width={CARD.width} height={CARD.height} viewBox={`0 0 ${CARD.width} ${CARD.height}`} style={{ position: "absolute", inset: 0 }}>
        <Stroke
          d={`M44 22H${CARD.width - 44}Q${CARD.width - 22} 22 ${CARD.width - 22} 44V${CARD.height - 44}Q${CARD.width - 22} ${CARD.height - 22} ${CARD.width - 44} ${CARD.height - 22}H44Q22 ${CARD.height - 22} 22 ${CARD.height - 44}V44Q22 22 44 22Z`}
          p={border}
          stroke={GOLD}
          width={4}
        />
        <Stroke
          d={`M60 40H${CARD.width - 60}Q${CARD.width - 40} 40 ${CARD.width - 40} 60V${CARD.height - 60}Q${CARD.width - 40} ${CARD.height - 40} ${CARD.width - 60} ${CARD.height - 40}H60Q40 ${CARD.height - 40} 40 ${CARD.height - 60}V60Q40 40 60 40Z`}
          p={border}
          stroke={SINDOOR}
          width={2.6}
          opacity={0.85}
        />
        <Corner p={border} mx={1} my={1} />
        <Corner p={border} mx={-1} my={1} />
        <Corner p={border} mx={1} my={-1} />
        <Corner p={border} mx={-1} my={-1} />
        {/* the settling flourish */}
        <g transform={`translate(${CARD.width / 2} ${CARD.height - 92})`}>
          <Stroke d="M-250 0C-200 -18 -150 18 -100 0C-70 -10 -50 -4 -34 0" p={flourish} stroke={GOLD} width={3.5} />
          <Stroke d="M250 0C200 -18 150 18 100 0C70 -10 50 -4 34 0" p={flourish} stroke={GOLD} width={3.5} />
          <g opacity={flourish}>
            <path d="M0 -22C14 -10 14 10 0 22C-14 10 -14 -10 0 -22Z" fill={SINDOOR} stroke={GOLD} strokeWidth={3} />
            <circle cx={0} cy={0} r={4} fill={GOLD} />
          </g>
        </g>
      </svg>

      {/* content */}
      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          top: 276,
          bottom: 132,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...rise(heading),
            fontFamily: fontMain,
            fontWeight: w(600),
            fontSize: bn ? 60 : 54,
            lineHeight: 1.4,
            letterSpacing: bn ? "0.01em" : "0.2em",
            textTransform: bn ? "none" : "uppercase",
            color: SINDOOR,
          }}
        >
          {tx.invitation}
        </div>

        <div
          style={{
            ...rise(names),
            fontFamily: fontNames,
            fontStyle: bn ? "normal" : "italic",
            fontWeight: bn ? DISPLAY_WEIGHT : 500,
            fontSize: bn ? 134 : 156,
            lineHeight: 1.3,
            padding: `${BN_PAD} 0.2em`,
            margin: `-${BN_PAD} 0`,
            color: SINDOOR,
            whiteSpace: "nowrap",
            textShadow: `0 0 ${30 * shimmer}px rgba(233,201,126,${0.9 * shimmer})`,
          }}
        >
          {tx.title}
        </div>

        <div style={{ opacity: names }}>
          <Divider p={names} />
        </div>

        <p
          style={{
            ...rise(message),
            margin: 0,
            maxWidth: 740,
            fontFamily: fontMain,
            fontStyle: bn ? "normal" : "italic",
            fontWeight: w(bn ? 500 : 400),
            fontSize: bn ? 44 : 54,
            lineHeight: bn ? 1.55 : 1.3,
            color: INK,
          }}
        >
          {tx.invitationMessage}
        </p>

        {(events.length > 0 || hasVenue) && (
          <div style={{ ...rise(details), display: "flex", flexDirection: "column", gap: 20, width: "100%", alignItems: "stretch" }}>
            {events.length > 0 && (
              <div style={{ display: "flex", gap: 20, justifyContent: "center", alignItems: "flex-start" }}>
                {EVENT_KEYS.filter((k) => events.includes(k)).flatMap((k, i) => [
                  i > 0 ? <span key={`${k}-rule`} style={{ alignSelf: "stretch", width: 3, background: `linear-gradient(${GOLD},transparent)` }} /> : null,
                  <EventBlock key={k} k={k} />,
                ])}
              </div>
            )}
            {hasVenue && (
              <div style={{ textAlign: "center" }}>
                <Label>{tx.venueLabel}</Label>
                {hasValue(venueName) && (
                  <div style={{ fontFamily: fontMain, fontWeight: w(600), fontSize: bn ? 44 : 52, lineHeight: 1.35, color: INK }}>
                    {venueName}
                    {hasValue(venueNote) && (
                      <span style={{ fontWeight: w(bn ? 500 : 400), fontSize: bn ? 34 : 40, color: MUTED }}>{` (${venueNote})`}</span>
                    )}
                  </div>
                )}
                {hasValue(address) && (
                  <div style={{ fontFamily: fontMain, fontWeight: w(500), fontSize: bn ? 36 : 40, lineHeight: 1.4, color: INK }}>{address}</div>
                )}
                {hasValue(landmark) && (
                  <div style={{ fontFamily: fontMain, fontWeight: w(bn ? 500 : 400), fontSize: bn ? 33 : 38, lineHeight: 1.4, color: MUTED }}>
                    {`${tx.landmarkLabel}: ${landmark}`}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ ...rise(button), marginTop: 6 }}>
          {interactive ? (
            <a
              className="dt-map"
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={tx.mapAria}
              style={mapStyle}
            >
              <Pin />
              <span>{tx.location}</span>
            </a>
          ) : (
            <div className="dt-map" style={mapStyle}>
              <Pin />
              <span>{tx.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
