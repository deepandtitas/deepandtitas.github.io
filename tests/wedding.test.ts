import { describe, expect, it } from "vitest";
import { hasValue, mapUrl, visibleEvents, wedding } from "../src/content/wedding";

describe("wedding details", () => {
  it("names and map", () => {
    expect(wedding.groom).toEqual({ en: "Deep", bn: "দীপ" });
    expect(wedding.bride).toEqual({ en: "Titas", bn: "তিতাস" });
    expect(mapUrl).toBe("https://maps.app.goo.gl/BGgvu48u6NbyY9xN8?g_st=aw");
    expect(wedding.mapUrl).toBe(mapUrl);
    expect(new URL(mapUrl).protocol).toBe("https:");
  });
  it("events and venue exactly as printed", () => {
    expect(wedding.events.wedding.date).toBe("2026-11-25");
    expect(wedding.events.reception.date).toBe("2026-11-27");
    expect(wedding.events.wedding.time).toEqual({ bn: "সন্ধ্যায়", en: "Evening" });
    expect(visibleEvents()).toEqual(["wedding", "reception"]);
    expect(wedding.venue.name).toEqual({ bn: "স্থপতি", en: "Sthapati" });
    expect(wedding.venue.note).toEqual({ bn: "শম্ভু ঘোষের বাড়ি", en: "House of Sambhu Ghosh" });
    expect(wedding.venue.address.en).toBe("15, Raja Shew Box Bagala Lane, Kolkata-700002");
    expect(wedding.venue.address.bn).toBe("১৫, রাজা শিউ বক্স বগলা লেন, কলকাতা-২");
    expect(wedding.venue.landmark).toEqual({ bn: "টালা পোস্টঅফিস", en: "Tala Post Office" });
  });
  it("hides blank dates", () => {
    const e = { events: { wedding: { date: "  " }, reception: { date: "2026-11-27" } } };
    expect(visibleEvents(e)).toEqual(["reception"]);
    expect(hasValue("   ")).toBe(false);
    expect(hasValue("a")).toBe(true);
  });
});
