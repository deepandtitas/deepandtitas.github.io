import { describe, expect, it } from "vitest";
import { buildMapUrl, hasValue, mapUrl, visibleEvents, wedding } from "../src/config/wedding";

describe("wedding config", () => {
  it("names the couple in both languages", () => {
    expect(wedding.groom).toEqual({ en: "Deep", bn: "দীপ" });
    expect(wedding.bride).toEqual({ en: "Titas", bn: "তিতাস" });
  });

  it("keeps the exact, unrounded map coordinates", () => {
    expect(wedding.mapCoordinates.latitude).toBe(22.60760907969931);
    expect(wedding.mapCoordinates.longitude).toBe(88.37628348848713);
  });

  it("builds the exact Google Maps URL", () => {
    expect(mapUrl).toBe("https://www.google.com/maps?q=22.60760907969931,88.37628348848713");
    expect(buildMapUrl({ latitude: 1.5, longitude: 2.25 })).toBe("https://www.google.com/maps?q=1.5,2.25");
  });

  it("uses the confirmed event dates (wedding 25 Nov 2026, reception 27 Nov 2026)", () => {
    expect(wedding.events.wedding.date).toBe("2026-11-25");
    expect(wedding.events.reception.date).toBe("2026-11-27");
    expect(visibleEvents()).toEqual(["wedding", "reception"]);
  });

  it("matches the printed reception invitation (source of truth)", () => {
    expect(wedding.venue.name).toEqual({ bn: "স্থপতি", en: "Sthapati" });
    expect(wedding.venue.note).toEqual({ bn: "শম্ভু ঘোষের বাড়ি", en: "House of Sambhu Ghosh" });
    // spellings are exactly as printed ("Bagala", "বগলা") — not "corrected"
    expect(wedding.venue.address.en).toBe("15, Raja Shew Box Bagala Lane, Kolkata-700002");
    expect(wedding.venue.address.bn).toBe("১৫, রাজা শিউ বক্স বগলা লেন, কলকাতা-২");
    expect(wedding.venue.landmark).toEqual({ bn: "টালা পোস্টঅফিস", en: "Tala Post Office" });
  });

  it("carries the Bengali-calendar dates and evening timing from the invitation", () => {
    expect(wedding.events.wedding.bengaliDate).toBe("৮ই অগ্রহায়ণ ১৪৩৩");
    expect(wedding.events.reception.bengaliDate).toBe("১০ই অগ্রহায়ণ ১৪৩৩");
    expect(wedding.events.wedding.time).toEqual({ bn: "সন্ধ্যায়", en: "Evening" });
    expect(wedding.events.reception.time).toEqual({ bn: "সন্ধ্যায়", en: "Evening" });
  });

  it("shows only events that have a date", () => {
    const base = { wedding: { date: "" }, reception: { date: "2026-11-27" } };
    expect(visibleEvents({ events: base })).toEqual(["reception"]);
    expect(visibleEvents({ events: { ...base, reception: { date: "  " } } })).toEqual([]);
    expect(hasValue("   ")).toBe(false);
    expect(hasValue("a")).toBe(true);
  });
});
