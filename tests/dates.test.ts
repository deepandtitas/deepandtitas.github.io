import { describe, expect, it } from "vitest";
import { formatDate, toBengaliDigits } from "../src/config/dates";

describe("formatDate", () => {
  it("formats the wedding date in English", () => {
    expect(formatDate("2026-11-25", "en")).toEqual({ weekday: "Wednesday", day: "25 November 2026" });
  });

  it("formats the reception date in English", () => {
    expect(formatDate("2026-11-27", "en")).toEqual({ weekday: "Friday", day: "27 November 2026" });
  });

  it("formats dates in Bengali with Bengali digits and weekday", () => {
    expect(formatDate("2026-11-25", "bn")).toEqual({ weekday: "বুধবার", day: "২৫ নভেম্বর ২০২৬" });
    expect(formatDate("2026-11-27", "bn")).toEqual({ weekday: "শুক্রবার", day: "২৭ নভেম্বর ২০২৬" });
  });

  it("rejects anything that is not a real calendar date", () => {
    expect(formatDate("", "bn")).toBeNull();
    expect(formatDate("25-11-2026", "en")).toBeNull();
    expect(formatDate("2026-02-30", "en")).toBeNull();
    expect(formatDate("2026-13-01", "en")).toBeNull();
  });

  it("converts digits", () => {
    expect(toBengaliDigits("0123456789")).toBe("০১২৩৪৫৬৭৮৯");
  });
});
