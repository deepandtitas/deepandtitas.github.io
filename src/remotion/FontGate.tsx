import { useEffect, useState, type ReactNode } from "react";
import { continueRender, delayRender } from "remotion";
import "./fonts";

const BN_FACES = [
  '400 48px "Noto Serif Bengali"',
  '500 48px "Noto Serif Bengali"',
  '600 48px "Noto Serif Bengali"',
  '700 48px "Noto Serif Bengali"',
];
const EN_FACES = [
  '400 48px "Cormorant Garamond"',
  'italic 400 48px "Cormorant Garamond"',
  '500 48px "Cormorant Garamond"',
  '600 48px "Cormorant Garamond"',
];
const SAMPLE_BN = "দীপ ও তিতাস শুভ পরিণয় সাদর আমন্ত্রণ ০১২৩৪৫৬৭৮৯";
const SAMPLE_EN = "Deep & Titas You Are Invited";

/** Holds rendering until the webfonts are ready, so every rendered frame uses the real typefaces. */
export const FontGate = ({ children }: { children: ReactNode }) => {
  const [handle] = useState(() => delayRender("Loading fonts", { timeoutInMilliseconds: 30000 }));
  useEffect(() => {
    const loads = [
      ...BN_FACES.map((f) => document.fonts.load(f, SAMPLE_BN)),
      ...EN_FACES.map((f) => document.fonts.load(f, SAMPLE_EN)),
    ];
    Promise.all(loads)
      .then(() => document.fonts.ready)
      .catch((err) => {
        // Fonts are decorative: fall back to the system serif rather than failing a render outright.
        console.warn("Font loading failed", err);
      })
      .finally(() => continueRender(handle));
  }, [handle]);
  return <>{children}</>;
};
