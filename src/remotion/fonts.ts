// Self-hosted fonts (no runtime network). Imported by both the website and the Remotion bundle.
// Bengali: Anek Bangla (a modern variable face with real weights) for text, headings and UI, and Galada (flowing
// script, close to the hand-lettering on the printed card) for the couple's names. English: Cormorant Garamond.
import "@fontsource-variable/anek-bangla/wght.css";
import "@fontsource/galada/bengali-400.css";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600.css";

export const FONT_BN = '"Anek Bangla Variable", "Noto Sans Bengali", sans-serif';
export const FONT_BN_DISPLAY = '"Galada", "Anek Bangla Variable", serif';
export const FONT_BN_UI = FONT_BN;
export const FONT_EN = '"Cormorant Garamond", "Times New Roman", serif';

/** Anek Bangla has real weights (100–800); English uses the weight asked for. */
export const bnWeight = (_lang: "bn" | "en", weight: number): number => weight;

/** Galada has a single (regular) weight: asking for bold would be synthesised and ugly. */
export const DISPLAY_WEIGHT = 400;

/**
 * Bengali vowel signs (ি ী ু ৃ) and Galada's loops reach well outside the line box. Text boxes that clip or
 * mask (reveals, buttons) need this much padding above and below so no glyph is ever cut.
 */
export const BN_PAD = "0.32em";
