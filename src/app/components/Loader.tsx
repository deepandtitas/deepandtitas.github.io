import { useEffect } from "react";
import { asset, AUDIO_PATH } from "../../config/assets";
import { ART, type ArtName } from "../../remotion/art-manifest";
import { FONT_FACES, FONT_SAMPLE } from "../../remotion/FontGate";
import { preloadAll, type LoadItem } from "../loader/preload";

const HAS_AUDIO = typeof __HAS_AUDIO__ !== "undefined" && __HAS_AUDIO__;
/** The loader stays at least this long, so it never flashes by. */
const MIN_MS = 900;
const FADE_MS = 650;

/** Everything the story needs, weighted by size. */
export const loadList = (base: string, hasAudio: boolean): LoadItem[] => [
  ...FONT_FACES.map((f, i) => ({ id: `font-${i}`, kind: "font" as const, src: f, weight: 45_000 })),
  ...(Object.keys(ART) as ArtName[]).map((n) => ({ id: n, kind: "image" as const, src: asset(ART[n].src, base), weight: ART[n].bytes })),
  ...(hasAudio ? [{ id: "audio", kind: "audio" as const, src: asset(AUDIO_PATH, base), weight: 1_000_000, optional: true }] : []),
];

/**
 * Drives the boot screen that index.html paints before any script runs (#boot): it loads every asset, shows real
 * progress, then fades away and hands over to the story. It updates the DOM directly — no React re-render per tick.
 */
export const Loader = ({ onReady }: { onReady: () => void }) => {
  useEffect(() => {
    const boot = document.getElementById("boot");
    const bar = document.getElementById("boot-bar");
    const pct = document.getElementById("boot-pct");
    const started = performance.now();
    let shown = 0;
    let cancelled = false;
    const set = (p: number) => {
      // never move backwards; ease the number so it reads as continuous
      shown = Math.max(shown, p);
      if (bar) bar.style.transform = `scaleX(${shown.toFixed(4)})`;
      if (pct) pct.textContent = `${Math.round(shown * 100)}%`;
      boot?.setAttribute("aria-valuenow", String(Math.round(shown * 100)));
    };
    preloadAll(loadList(import.meta.env.BASE_URL, HAS_AUDIO), set, { fontSample: FONT_SAMPLE }).then(() => {
      if (cancelled) return;
      set(1);
      const wait = Math.max(0, MIN_MS - (performance.now() - started));
      window.setTimeout(() => {
        if (cancelled) return;
        onReady();
        boot?.classList.add("boot--done");
        window.setTimeout(() => boot?.remove(), FADE_MS + 50);
      }, wait);
    });
    return () => {
      cancelled = true;
    };
  }, [onReady]);
  return null;
};
