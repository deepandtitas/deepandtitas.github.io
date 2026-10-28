// Self-hosted fonts (no runtime network). Imported by both the website and the Remotion bundle.
// Bengali: Tiro Bangla for text (refined, calligraphic contrast), Galada for the couple's names (flowing script, close to
// the hand-lettering on the printed card) and Hind Siliguri for small UI text. English: Cormorant Garamond.
import "@fontsource/tiro-bangla/bengali-400.css";
import "@fontsource/galada/bengali-400.css";
import "@fontsource/hind-siliguri/bengali-500.css";
import "@fontsource/hind-siliguri/bengali-600.css";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600.css";

export const FONT_BN = '"Tiro Bangla", "Hind Siliguri", serif';
export const FONT_BN_DISPLAY = '"Galada", "Tiro Bangla", serif';
export const FONT_BN_UI = '"Hind Siliguri", "Tiro Bangla", sans-serif';
export const FONT_EN = '"Cormorant Garamond", "Times New Roman", serif';

/** Tiro Bangla and Galada have a single (regular) weight; asking for bold would be synthesised and ugly. */
export const bnWeight = (lang: "bn" | "en", weight: number): number => (lang === "bn" ? 400 : weight);
