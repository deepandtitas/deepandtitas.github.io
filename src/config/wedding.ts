/**
 * Editable wedding details. Anything left blank is simply not shown to guests — there are no placeholders.
 * Dates are ISO (YYYY-MM-DD) and are rendered in Bengali or English by src/config/dates.ts.
 */
export const wedding = {
  groom: {
    en: "Deep",
    bn: "দীপ",
  },
  bride: {
    en: "Titas",
    bn: "তিতাস",
  },
  events: {
    wedding: { date: "2026-11-25", time: "" },
    reception: { date: "2026-11-27", time: "" },
  },
  /** Both events are at the same venue. Left blank until a venue name is confirmed (the address below is shown regardless). */
  venueName: "",
  /** Exactly as provided — spelling and punctuation are intentional. */
  venueAddress: "15, Raja Shew Box Bagla Ln, Tala, Bidhan Sarani, Kolkata, West Bengal 700002",
  /** Exact map pin. Never round or alter these values. */
  mapCoordinates: {
    latitude: 22.60760907969931,
    longitude: 88.37628348848713,
  },
} as const;

export type Wedding = typeof wedding;

export const buildMapUrl = (c: { latitude: number; longitude: number }): string =>
  `https://www.google.com/maps?q=${c.latitude},${c.longitude}`;

export const mapUrl = buildMapUrl(wedding.mapCoordinates);

export type EventKey = "wedding" | "reception";
export const EVENT_KEYS: readonly EventKey[] = ["wedding", "reception"];

export const hasValue = (v: string): boolean => v.trim().length > 0;

type EventsLike = { events: Record<EventKey, { date: string; time: string }> };

/** Events that have a date (those are the ones shown on the card). */
export const visibleEvents = (w: EventsLike = wedding): EventKey[] =>
  EVENT_KEYS.filter((k) => hasValue(w.events[k].date));
