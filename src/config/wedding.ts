/**
 * Editable wedding details. Source of truth: the printed reception invitation ("DEEP RECEPTION.pdf").
 * Anything left blank is simply not shown to guests — there are no placeholders.
 * Dates are ISO (YYYY-MM-DD) and are rendered in Bengali or English by src/config/dates.ts.
 */
type Bilingual = { readonly bn: string; readonly en: string };

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
    // শুভবিবাহ — ৮ই অগ্রহায়ণ ১৪৩৩, বুধবার সন্ধ্যায়
    wedding: {
      date: "2026-11-25",
      bengaliDate: "৮ই অগ্রহায়ণ ১৪৩৩",
      time: { bn: "সন্ধ্যায়", en: "Evening" },
    },
    // প্রীতিভোজ (Wedding Reception) — ১০ই অগ্রহায়ণ ১৪৩৩, শুক্রবার সন্ধ্যায়
    reception: {
      date: "2026-11-27",
      bengaliDate: "১০ই অগ্রহায়ণ ১৪৩৩",
      time: { bn: "সন্ধ্যায়", en: "Evening" },
    },
  },
  /** Spellings exactly as printed on the invitation (e.g. "Bagala", "বগলা") — do not "correct" them. */
  venue: {
    name: { bn: "স্থপতি", en: "Sthapati" },
    note: { bn: "শম্ভু ঘোষের বাড়ি", en: "House of Sambhu Ghosh" },
    address: {
      bn: "১৫, রাজা শিউ বক্স বগলা লেন, কলকাতা-২",
      en: "15, Raja Shew Box Bagala Lane, Kolkata-700002",
    },
    landmark: { bn: "টালা পোস্টঅফিস", en: "Tala Post Office" },
  },
  /** The venue's Google Maps listing (resolves to "Sthapati, 15, Bidhan Sarani, Shyam Bazar, Kolkata 700002"). Use as given. */
  mapUrl: "https://maps.app.goo.gl/BGgvu48u6NbyY9xN8?g_st=aw",
} as const satisfies {
  groom: Bilingual;
  bride: Bilingual;
  events: Record<string, { date: string; bengaliDate: string; time: Bilingual }>;
  venue: Record<"name" | "note" | "address" | "landmark", Bilingual>;
  mapUrl: string;
};

export type Wedding = typeof wedding;

export const mapUrl: string = wedding.mapUrl;

export type EventKey = "wedding" | "reception";
export const EVENT_KEYS: readonly EventKey[] = ["wedding", "reception"];

export const hasValue = (v: string): boolean => v.trim().length > 0;

type EventsLike = { events: Record<EventKey, { date: string }> };

/** Events that have a date (those are the ones shown on the card). */
export const visibleEvents = (w: EventsLike = wedding): EventKey[] =>
  EVENT_KEYS.filter((k) => hasValue(w.events[k].date));
