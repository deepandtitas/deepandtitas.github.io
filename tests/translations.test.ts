import { describe, expect, it } from "vitest";
import { otherLang, t, translations } from "../src/content/translations";

describe("translations", () => {
  it("has identical, non-empty keys in both languages", () => {
    expect(Object.keys(translations.bn).sort()).toEqual(Object.keys(translations.en).sort());
    for (const lang of ["bn", "en"] as const) for (const v of Object.values(translations[lang])) expect(v.trim()).not.toBe("");
  });
  it("keeps the exact copy", () => {
    expect(translations.bn.title).toBe("দীপ ও তিতাস");
    expect(translations.bn.opening).toBe("শুভ সূচনা");
    expect(translations.bn.meeting).toBe("দুটি পথ, একটি গল্প");
    expect(translations.bn.wedding).toBe("শুভ পরিণয়");
    expect(translations.bn.invitation).toBe("সাদর আমন্ত্রণ");
    expect(translations.bn.invitationMessage).toBe("আমাদের জীবনের এই শুভ মুহূর্তে আপনাদের সাদর আমন্ত্রণ।");
    expect(translations.bn.location).toBe("স্থান দেখুন");
    expect(translations.bn.subtitle).toBe("একটি নতুন গল্পের শুরু");
    expect(translations.en.opening).toBe("An Auspicious Beginning");
    expect(translations.en.location).toBe("View Location");
  });
  it("t and otherLang", () => {
    expect(t("bn")).toBe(translations.bn);
    expect(otherLang("bn")).toBe("en");
    expect(otherLang("en")).toBe("bn");
  });
});
