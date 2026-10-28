import { describe, expect, it } from "vitest";
import { otherLang, t, translations } from "../src/config/translations";

describe("translations", () => {
  const bnKeys = Object.keys(translations.bn).sort();
  const enKeys = Object.keys(translations.en).sort();

  it("has the same keys in Bengali and English", () => {
    expect(bnKeys).toEqual(enKeys);
  });

  it("has no empty strings", () => {
    for (const lang of ["bn", "en"] as const) {
      for (const [key, value] of Object.entries(translations[lang])) {
        expect(value.trim().length, `${lang}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("uses the specified Bengali copy", () => {
    expect(translations.bn.title).toBe("দীপ ও তিতাস");
    expect(translations.bn.opening).toBe("শুভ সূচনা");
    expect(translations.bn.meeting).toBe("দুটি পথ, একটি গল্প");
    expect(translations.bn.wedding).toBe("শুভ পরিণয়");
    expect(translations.bn.invitation).toBe("সাদর আমন্ত্রণ");
    expect(translations.bn.invitationMessage).toBe("আমাদের জীবনের এই শুভ মুহূর্তে আপনাদের সাদর আমন্ত্রণ।");
    expect(translations.bn.location).toBe("স্থান দেখুন");
    expect(translations.bn.subtitle).toBe("একটি নতুন গল্পের শুরু");
  });

  it("uses corrected English wording (no 'A Auspicious')", () => {
    expect(translations.en.opening).toBe("An Auspicious Beginning");
    expect(translations.en.location).toBe("View Location");
  });

  it("provides the accessor helpers", () => {
    expect(t("bn")).toBe(translations.bn);
    expect(otherLang("bn")).toBe("en");
    expect(otherLang("en")).toBe("bn");
  });
});
