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

  it("keeps the venue address exactly as provided (not 'corrected')", () => {
    expect(wedding.venueAddress).toBe("15, Raja Shew Box Bagla Ln, Tala, Bidhan Sarani, Kolkata, West Bengal 700002");
  });

  it("does not invent details that were not provided", () => {
    expect(wedding.venueName).toBe("");
    expect(wedding.events.wedding.time).toBe("");
    expect(wedding.events.reception.time).toBe("");
  });

  it("shows only events that have a date", () => {
    const base = { wedding: { date: "", time: "" }, reception: { date: "2026-11-27", time: "" } };
    expect(visibleEvents({ events: base })).toEqual(["reception"]);
    expect(visibleEvents({ events: { ...base, reception: { date: "  ", time: "" } } })).toEqual([]);
    expect(hasValue("   ")).toBe(false);
    expect(hasValue("a")).toBe(true);
  });
});
