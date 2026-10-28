import type { Lang } from "./translations";

const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  bn: ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"],
} as const;

const WEEKDAYS = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  bn: ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"],
} as const;

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export const toBengaliDigits = (s: string): string => s.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

export interface FormattedDate {
  weekday: string;
  /** e.g. "২৫ নভেম্বর ২০২৬" / "25 November 2026" */
  day: string;
}

/**
 * Formats an ISO date (YYYY-MM-DD) without depending on the browser's locale data, so Bengali output is
 * identical everywhere (and in video renders). Returns null for anything that is not a real calendar date.
 */
export const formatDate = (iso: string, lang: Lang): FormattedDate | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  const day = `${d} ${MONTHS[lang][mo - 1]} ${y}`;
  return {
    weekday: WEEKDAYS[lang][date.getUTCDay()],
    day: lang === "bn" ? toBengaliDigits(day) : day,
  };
};
