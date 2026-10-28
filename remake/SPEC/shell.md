# shell.md — Website shell specification (spec-shell)

Scope: everything around the picture: build/tooling, content data, boot loader, cover, story state machine, Player events, controls, language, soundtrack, layout, hotspots/map link, scripts, tests. The in-picture look is `visual.md`; timing/poses are `story.md`. Source files below are pasted VERBATIM from the reference build (`C:\Projects\deepandtitas.github.io`); a remake must reproduce them behaviourally and, for strings/CSS/constants, exactly. File path headings are the original paths (a remake may relocate files but keep names/behaviour).

---------------------------------------------------------------------------------------------------

## 1. Build, tooling, deploy

### 1.1 Stack
React 19 + TypeScript 5.9 + Vite 8 + Remotion 4.0.539 (`remotion`, `@remotion/player`, `@remotion/cli` pinned EXACT, no caret), Vitest 5. Node 24 in CI (README says Node 20+). ES modules. Fonts self-hosted via @fontsource (no runtime network). `@remotion/bundler` and `@remotion/renderer` are used by scripts (transitive with `@remotion/cli`). `playwright-core` is used by og/profile scripts with Chrome found by `scripts/chrome.mjs` (no browser download).

**package.json**

```json
{
  "name": "deep-and-titas",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "description": "Deep & Titas — Bengali wedding invitation built with Remotion",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b",
    "lint": "eslint .",
    "test": "vitest run",
    "studio": "remotion studio src/remotion/index.ts",
    "render": "remotion render src/remotion/index.ts DeepAndTitasWedding out/deep-and-titas.mp4",
    "still": "remotion still src/remotion/index.ts DeepAndTitasWedding out/invitation.png --frame=2999",
    "stills": "node scripts/stills.mjs 0 300 478 840 1138 1400 1540 1750 1960 2098 2200 2999",
    "profile": "node scripts/profile.mjs",
    "art": "node scripts/generate-art.mjs && node scripts/bake-art.mjs",
    "og": "node scripts/og-image.mjs"
  },
  "dependencies": {
    "@fontsource-variable/anek-bangla": "^5.3.0",
    "@fontsource/cormorant-garamond": "^5.3.0",
    "@fontsource/galada": "^5.3.0",
    "@remotion/player": "4.0.539",
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "remotion": "4.0.539"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.0",
    "@remotion/cli": "4.0.539",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.1.2",
    "eslint": "^9.39.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "globals": "^17.0.0",
    "playwright-core": "^1.64.1",
    "typescript": "^5.9.0",
    "typescript-eslint": "^8.72.1",
    "vite": "^8.3.5",
    "vitest": "^5.0.5"
  }
}

```

Notes: `npm run build` = `tsc -b && vite build`. `stills` hard-codes the key frames. `art` is owned by spec-visual (runs `scripts/generate-art.mjs` then `scripts/bake-art.mjs`; writes `src/remotion/art-manifest.ts`). `.gitignore`: `node_modules dist out *.log .DS_Store *.tsbuildinfo /art/`.

**vite.config.ts**

```ts
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const soundtrack = fileURLToPath(new URL("./public/audio/soundtrack.mp3", import.meta.url));

// BASE_PATH is only needed when serving from a sub-path. The production site is a GitHub user site
// (deepandtitas.github.io), served from the root, so it is normally unset.
// __HAS_AUDIO__ is decided at build/dev-start time so a missing soundtrack never causes a 404 probe.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  define: {
    __HAS_AUDIO__: JSON.stringify(existsSync(soundtrack)),
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});

```

- `base` = `process.env.BASE_PATH ?? "/"`. Production is the GitHub **user site** `https://deepandtitas.github.io/` at the root, so BASE_PATH is unset. Only a sub-path host would set `BASE_PATH=/that-path/`.
- `__HAS_AUDIO__` (compile-time global, declared in `src/vite-env.d.ts`) = whether `public/audio/soundtrack.mp3` existed when the dev server/build started. Read as `typeof __HAS_AUDIO__ !== "undefined" && __HAS_AUDIO__`. Avoids 404 probes. The reference track exists (about 1 MB, 50 s, 160 kbps MP3: first 50 s of the couple's supplied track, short fade-in, 2.5 s fade-out). The remake MUST keep this file at `public/audio/soundtrack.mp3`.
- Tests: `tests/**/*.test.ts`, environment node.

**src/vite-env.d.ts**

```ts
/// <reference types="vite/client" />

/** true when public/audio/soundtrack.mp3 existed at build / dev-server start. */
declare const __HAS_AUDIO__: boolean;

```

**remotion.config.ts**

```ts
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setPublicDir("public");

```

**tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": false,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src", "tests", "vite.config.ts", "remotion.config.ts"]
}

```

**eslint.config.js**

```js
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "out", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mjs,js}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);

```

**.github/workflows/deploy.yml**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      # This is a GitHub *user site* (repository deepandtitas.github.io), served from the root of
      # https://deepandtitas.github.io/ — so no BASE_PATH is needed.
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4

```

Deploy: push to `main` (or manual dispatch) -> typecheck, test, build (`dist/`) -> GitHub Pages. One-time repo setting: Pages source = GitHub Actions. Canonical URL `https://deepandtitas.github.io/`.

### 1.2 Asset base

**src/config/assets.ts**

```ts
/**
 * Asset URL helper.
 * `base` is the public base path of the deployed site (Vite's BASE_URL, e.g. "/" for the production site).
 * Remotion code receives it through the `assetBase` input prop (never via import.meta.env, because
 * Remotion Studio uses webpack). When `base` is null the caller should fall back to staticFile().
 */
export const asset = (path: string, base: string): string => {
  const b = base.endsWith("/") ? base : `${base}/`;
  return `${b}${path.replace(/^\/+/, "")}`;
};

/** Baked images are listed (with their sizes and positions) in src/remotion/art-manifest.ts, generated by `npm run art`. */

export const AUDIO_PATH = "audio/soundtrack.mp3";

```

The website passes `import.meta.env.BASE_URL` as the `assetBase` input prop. Remotion Studio/renders pass `assetBase: null` and the composition falls back to `staticFile()`:

**src/remotion/experience.tsx**

```tsx
import { createContext, useCallback, useContext } from "react";
import { staticFile } from "remotion";
import { asset } from "../config/assets";
import { t, type Dictionary } from "../config/translations";
import { defaultWeddingProps, type WeddingProps } from "./props";

export const ExperienceContext = createContext<WeddingProps>(defaultWeddingProps);

export const useExperience = (): WeddingProps => useContext(ExperienceContext);

/** Resolves a public-folder path for either the website (assetBase) or Remotion (staticFile). */
export const resolveAsset = (path: string, assetBase: string | null): string =>
  assetBase === null ? staticFile(path) : asset(path, assetBase);

export const useAsset = (): ((path: string) => string) => {
  const { assetBase } = useExperience();
  return useCallback((path: string) => resolveAsset(path, assetBase), [assetBase]);
};

export const useText = (): Dictionary => t(useExperience().lang);

```

### 1.3 Remotion registration

**src/remotion/index.ts**

```ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);

```

**src/remotion/Root.tsx**

```tsx
import { Composition, getStaticFiles, staticFile } from "remotion";
import { AUDIO_PATH } from "../config/assets";
import { DURATION, FPS, HEIGHT, WIDTH } from "../config/timeline";
import { WeddingComposition } from "./WeddingComposition";
import { defaultWeddingProps, type WeddingProps } from "./props";

/** Detects an optional soundtrack in public/audio so renders include it only when it exists (no 404 probing). */
const detectAudio = (): string | null => {
  try {
    return getStaticFiles().some((f) => f.name === AUDIO_PATH) ? staticFile(AUDIO_PATH) : null;
  } catch {
    return null;
  }
};

export const RemotionRoot = () => (
  <Composition
    id="DeepAndTitasWedding"
    component={WeddingComposition}
    width={WIDTH}
    height={HEIGHT}
    fps={FPS}
    durationInFrames={DURATION}
    defaultProps={defaultWeddingProps}
    calculateMetadata={({ props }) => {
      const p: WeddingProps = props;
      return { props: { ...p, audioSrc: p.audioSrc ?? detectAudio() } };
    }}
  />
);

```

**src/remotion/props.ts**

```ts
import type { SyntheticEvent } from "react";
import type { SceneId } from "../config/timeline";
import type { Lang } from "../config/translations";

export interface GuidedProps {
  /** true while the guest is exploring in guided mode (a lotus bud is visible from the first frame). */
  enabled: boolean;
  /** The scene whose start the guest can trigger right now (hotspot is shown), or null. */
  awaiting: SceneId | null;
  onActivate?: (target: SceneId, event: SyntheticEvent) => void;
}

/**
 * Props of the composition. Everything except the callback is serialisable, so the same
 * composition works in Remotion Studio, in renders (defaults) and in the website Player.
 */
export type WeddingProps = {
  lang: Lang;
  /** Public base path of the website. null → use Remotion's staticFile() (Studio / renders). */
  assetBase: string | null;
  /** URL of the soundtrack, or null for a silent experience. */
  audioSrc: string | null;
  reducedMotion: boolean;
  /** true in the website (real links/hotspots); false for video renders. */
  interactive: boolean;
  guided: GuidedProps;
};

export const defaultWeddingProps: WeddingProps = {
  lang: "bn",
  assetBase: null,
  audioSrc: null,
  reducedMotion: false,
  interactive: false,
  guided: { enabled: false, awaiting: null },
};

```

- Composition id `DeepAndTitasWedding`, 1080x1920, 60 fps, 3000 frames (last frame 2999). Constants from `timeline.ts`: `BEAT_FPS=30, FPS=60, WIDTH=1080, HEIGHT=1920, DURATION=3000, LAST_FRAME=2999, COVER_FRAME=beatsToFrames(118)=236`.
- Input props: `lang` ("bn"|"en"; default bn), `assetBase` (website base string; null -> staticFile), `audioSrc` (soundtrack URL for video renders only; the website always passes `null` and plays audio in the shell), `reducedMotion`, `interactive` (true in website: real link + hotspots + no `<ArtGate>`; false in renders), `guided` ({enabled, awaiting, onActivate}). Only `onActivate` is non-serialisable.
- `calculateMetadata` fills `audioSrc` with `staticFile("audio/soundtrack.mp3")` only if `getStaticFiles()` lists it (`AUDIO_PATH = "audio/soundtrack.mp3"`).
- Studio/CLI: `remotion studio src/remotion/index.ts`; render `out/deep-and-titas.mp4`; still frame 2999 -> `out/invitation.png`.
- The composition root (`WeddingComposition`) is an `AbsoluteFill` with `backgroundColor:#f5ebdd; overflow:hidden; pointerEvents:"none"; fontSynthesis:"none"`, wrapped in `ExperienceContext.Provider` and `FontGate`. Only hotspot buttons and the map link opt back in with `pointer-events:auto`.

### 1.4 Fonts (shell side)

**src/remotion/fonts.ts**

```ts
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

```

**src/remotion/FontGate.tsx**

```tsx
import { useEffect, useState, type ReactNode } from "react";
import { continueRender, delayRender } from "remotion";
import "./fonts";

export const FONT_FACES = [
  '400 48px "Anek Bangla Variable"',
  '500 48px "Anek Bangla Variable"',
  '600 48px "Anek Bangla Variable"',
  '400 48px "Galada"',
  '400 48px "Cormorant Garamond"',
  'italic 400 48px "Cormorant Garamond"',
  '500 48px "Cormorant Garamond"',
  '600 48px "Cormorant Garamond"',
];
export const FONT_SAMPLE = "দীপ ও তিতাস শুভ পরিণয় সাদর আমন্ত্রণ ০১২৩৪৫৬৭৮৯ Deep & Titas You Are Invited";

/** Holds rendering until the webfonts are ready, so every rendered frame uses the real typefaces. */
export const FontGate = ({ children }: { children: ReactNode }) => {
  const [handle] = useState(() => delayRender("Loading fonts", { timeoutInMilliseconds: 30000 }));
  useEffect(() => {
    Promise.all(FONT_FACES.map((f) => document.fonts.load(f, FONT_SAMPLE)))
      .then(() => document.fonts.ready)
      .catch((err) => {
        // Fonts are decorative: fall back to the system face rather than failing a render outright.
        console.warn("Font loading failed", err);
      })
      .finally(() => continueRender(handle));
  }, [handle]);
  return <>{children}</>;
};

```

`FontGate` holds a Remotion render (`delayRender`, 30 s) until all faces load; `FONT_FACES` and `FONT_SAMPLE` are also what the website loader waits on (3.2).

### 1.5 index.html (static boot screen + meta; verbatim)
The boot screen is painted before any script runs; Loader.tsx drives it. Open Graph / Twitter tags, `lang="bn"`, theme-color `#30251f`, favicon `./favicon.svg`, canonical, `og:image` `https://deepandtitas.github.io/og-image.jpg` 1200x630.

**index.html**

```html
<!doctype html>
<html lang="bn">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover"
    />
    <meta name="theme-color" content="#30251f" />
    <meta
      name="description"
      content="দীপ ও তিতাসের শুভবিবাহ ২৫শে নভেম্বর ২০২৬ এবং প্রীতিভোজ ২৭শে নভেম্বর ২০২৬, কলকাতায়। আপনাদের সাদর আমন্ত্রণ। | You are warmly invited to the wedding of Deep &amp; Titas on 25 November 2026 and the reception on 27 November 2026, in Kolkata."
    />
    <link rel="canonical" href="https://deepandtitas.github.io/" />

    <!-- Open Graph (link previews: WhatsApp, Facebook, Telegram, iMessage, LinkedIn …) -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Deep &amp; Titas" />
    <meta property="og:url" content="https://deepandtitas.github.io/" />
    <meta property="og:title" content="দীপ ও তিতাস — সাদর আমন্ত্রণ | Deep &amp; Titas" />
    <meta property="og:description" content="দীপ ও তিতাসের শুভবিবাহ ২৫শে নভেম্বর ২০২৬ এবং প্রীতিভোজ ২৭শে নভেম্বর ২০২৬, কলকাতায়। আপনাদের সাদর আমন্ত্রণ। You are warmly invited to the wedding of Deep &amp; Titas on 25 November 2026 and the reception on 27 November 2026, in Kolkata." />
    <meta property="og:image" content="https://deepandtitas.github.io/og-image.jpg" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Wedding invitation of Deep &amp; Titas — দীপ ও তিতাসের বিবাহের আমন্ত্রণ" />
    <meta property="og:locale" content="bn_IN" />
    <meta property="og:locale:alternate" content="en_IN" />

    <!-- Twitter / X -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="দীপ ও তিতাস — সাদর আমন্ত্রণ | Deep &amp; Titas" />
    <meta name="twitter:description" content="দীপ ও তিতাসের শুভবিবাহ ২৫শে নভেম্বর ২০২৬ এবং প্রীতিভোজ ২৭শে নভেম্বর ২০২৬, কলকাতায়। আপনাদের সাদর আমন্ত্রণ। You are warmly invited to the wedding of Deep &amp; Titas on 25 November 2026 and the reception on 27 November 2026, in Kolkata." />
    <meta name="twitter:image" content="https://deepandtitas.github.io/og-image.jpg" />
    <meta name="twitter:image:alt" content="Wedding invitation of Deep &amp; Titas" />

    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <title>দীপ ও তিতাস — শুভ পরিণয় | Deep &amp; Titas</title>
    <style>
      /* Boot screen: painted before any script runs; src/app/components/Loader.tsx drives its progress. */
      html, body { margin: 0; height: 100%; background: #1c0e0c; }
      .boot {
        position: fixed; inset: 0; z-index: 50; display: grid; place-items: center;
        background: radial-gradient(120% 90% at 50% 30%, #5a2128 0%, #2b1613 60%, #1c0e0c 100%);
        color: #f5ebdd; font-family: "Noto Sans Bengali", "Bangla Sangam MN", system-ui, sans-serif;
        transition: opacity .65s ease, visibility 0s .65s;
      }
      .boot--done { opacity: 0; visibility: hidden; }
      .boot__inner { display: grid; justify-items: center; gap: 22px; width: min(78vw, 320px); text-align: center; }
      .boot__mark { width: min(46vw, 180px); height: auto; overflow: visible; }
      .boot__mark .ring { fill: none; stroke: #c49a52; stroke-width: 2.4; stroke-dasharray: 2 9; stroke-linecap: round; transform-origin: 100px 100px; animation: boot-spin 14s linear infinite; }
      .boot__mark .petal { fill: none; stroke: #e9c97a; stroke-width: 3; stroke-linejoin: round; stroke-dasharray: 240; stroke-dashoffset: 240; animation: boot-draw 2.4s ease-in-out infinite alternate; }
      .boot__mark .petal:nth-of-type(2) { animation-delay: .15s; } .boot__mark .petal:nth-of-type(3) { animation-delay: .3s; }
      .boot__mark .petal:nth-of-type(4) { animation-delay: .45s; } .boot__mark .petal:nth-of-type(5) { animation-delay: .6s; }
      .boot__mark .flame { fill: #ffd27a; transform-origin: 100px 150px; animation: boot-flick 1.1s ease-in-out infinite alternate; }
      .boot__mark .halo { fill: #f6d37e; opacity: .25; animation: boot-glow 2.2s ease-in-out infinite alternate; transform-origin: 100px 140px; }
      .boot__title { margin: 0; font-size: 15px; letter-spacing: .12em; color: #e3c27a; text-transform: uppercase; font-family: Georgia, "Times New Roman", serif; }
      .boot__track { position: relative; width: 100%; height: 3px; border-radius: 3px; background: rgba(196,154,82,.25); overflow: hidden; }
      .boot__track i { position: absolute; inset: 0; background: linear-gradient(90deg, #c49a52, #f4da92); transform: scaleX(0); transform-origin: 0 50%; transition: transform .25s ease-out; }
      .boot__status { display: flex; justify-content: space-between; width: 100%; font-size: 13px; color: rgba(245,235,221,.78); }
      @keyframes boot-spin { to { transform: rotate(360deg); } }
      @keyframes boot-draw { to { stroke-dashoffset: 0; } }
      @keyframes boot-flick { from { transform: scale(.92, .96) rotate(-2deg); } to { transform: scale(1.06, 1.08) rotate(2deg); } }
      @keyframes boot-glow { from { transform: scale(.9); opacity: .18; } to { transform: scale(1.1); opacity: .32; } }
      @media (prefers-reduced-motion: reduce) { .boot__mark * { animation: none !important; stroke-dashoffset: 0 !important; } }
    </style>
  </head>
  <body>
    <div id="boot" class="boot" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="লোড হচ্ছে · Loading">
      <div class="boot__inner">
        <svg class="boot__mark" viewBox="0 0 200 200" aria-hidden="true">
          <circle class="ring" cx="100" cy="100" r="92" />
          <circle class="halo" cx="100" cy="140" r="38" />
          <path class="petal" d="M100 132C84 112 84 76 100 48C116 76 116 112 100 132Z" />
          <path class="petal" d="M98 134C76 124 60 98 58 70C80 82 96 104 98 134Z" />
          <path class="petal" d="M102 134C124 124 140 98 142 70C120 82 104 104 102 134Z" />
          <path class="petal" d="M96 136C70 136 46 120 36 98C62 100 84 116 96 136Z" />
          <path class="petal" d="M104 136C130 136 154 120 164 98C138 100 116 116 104 136Z" />
          <path d="M70 152C82 162 118 162 130 152C120 146 80 146 70 152Z" fill="#b5603a" stroke="#e9c97a" stroke-width="2" />
          <path class="flame" d="M100 150C93 145 94 136 100 126C106 136 107 145 100 150Z" />
        </svg>
        <p class="boot__title">Deep &amp; Titas</p>
        <div class="boot__track"><i id="boot-bar"></i></div>
        <div class="boot__status"><span lang="bn">লোড হচ্ছে… · Loading…</span><span id="boot-pct">0%</span></div>
      </div>
    </div>
    <div id="root"></div>
    <script type="module" src="/src/app/main.tsx"></script>
  </body>
</html>

```

---------------------------------------------------------------------------------------------------

## 2. Content

### 2.1 wedding.ts (data model + values; never invent; blank field => hidden)

**src/config/wedding.ts**

```ts
/**
 * Editable wedding details. Source of truth: the printed reception invitation ("DEEP RECEPTION.pdf").
 * Anything left blank is simply not shown to guests — there are no placeholders.
 * Dates are ISO (YYYY-MM-DD) and are rendered in Bengali or English by src/config/dates.ts.
 */
type Bilingual = { readonly bn: string; readonly en: string };

export const wedding = {
  groom: {
    en: "Deep",
    bn: "দীপ",
  },
  bride: {
    en: "Titas",
    bn: "তিতাস",
  },
  events: {
    // শুভবিবাহ — ৮ই অগ্রহায়ণ ১৪৩৩, বুধবার সন্ধ্যায়
    wedding: {
      date: "2026-11-25",
      bengaliDate: "৮ই অগ্রহায়ণ ১৪৩৩",
      time: { bn: "সন্ধ্যায়", en: "Evening" },
    },
    // প্রীতিভোজ (Wedding Reception) — ১০ই অগ্রহায়ণ ১৪৩৩, শুক্রবার সন্ধ্যায়
    reception: {
      date: "2026-11-27",
      bengaliDate: "১০ই অগ্রহায়ণ ১৪৩৩",
      time: { bn: "সন্ধ্যায়", en: "Evening" },
    },
  },
  /** Spellings exactly as printed on the invitation (e.g. "Bagala", "বগলা") — do not "correct" them. */
  venue: {
    name: { bn: "স্থপতি", en: "Sthapati" },
    note: { bn: "শম্ভু ঘোষের বাড়ি", en: "House of Sambhu Ghosh" },
    address: {
      bn: "১৫, রাজা শিউ বক্স বগলা লেন, কলকাতা-২",
      en: "15, Raja Shew Box Bagala Lane, Kolkata-700002",
    },
    landmark: { bn: "টালা পোস্টঅফিস", en: "Tala Post Office" },
  },
  /** The venue's Google Maps listing (resolves to "Sthapati, 15, Bidhan Sarani, Shyam Bazar, Kolkata 700002"). Use as given. */
  mapUrl: "https://maps.app.goo.gl/BGgvu48u6NbyY9xN8?g_st=aw",
} as const satisfies {
  groom: Bilingual;
  bride: Bilingual;
  events: Record<string, { date: string; bengaliDate: string; time: Bilingual }>;
  venue: Record<"name" | "note" | "address" | "landmark", Bilingual>;
  mapUrl: string;
};

export type Wedding = typeof wedding;

export const mapUrl: string = wedding.mapUrl;

export type EventKey = "wedding" | "reception";
export const EVENT_KEYS: readonly EventKey[] = ["wedding", "reception"];

export const hasValue = (v: string): boolean => v.trim().length > 0;

type EventsLike = { events: Record<EventKey, { date: string }> };

/** Events that have a date (those are the ones shown on the card). */
export const visibleEvents = (w: EventsLike = wedding): EventKey[] =>
  EVENT_KEYS.filter((k) => hasValue(w.events[k].date));

```

Rules: anything not supplied by the family stays blank and is hidden. Host/family names and phone numbers are deliberately NOT on the page. Spellings (Bagala, Raja Shew Box, Sambhu) are exactly as printed; do not "correct". The **map button opens `wedding.mapUrl` exactly as given** (`https://maps.app.goo.gl/BGgvu48u6NbyY9xN8?g_st=aw`) in a new tab with `target="_blank" rel="noopener noreferrer"` and `aria-label = tx.mapAria` (`<a class="dt-map" href=mapUrl>`; in non-interactive renders it is a plain `<div class="dt-map">`). The card shows only events with `hasValue(date)` and only non-blank venue lines (`landmark` printed as `` `${tx.landmarkLabel}: ${landmark}` ``). Card layout is visual.md. Map link CSS (inside the composition):
```css
.dt-map { transition: transform .18s ease, box-shadow .18s ease, background-color .18s ease }
.dt-map:hover { transform: translateY(-4px); background: #8f2433 !important }
.dt-map:active { transform: translateY(1px) scale(.985) }
.dt-map:focus-visible { outline: 6px solid #c49a52; outline-offset: 8px }
```

### 2.2 translations.ts — complete dictionary (both languages, all keys)

**src/config/translations.ts**

```ts
export type Lang = "bn" | "en";

export const translations = {
  bn: {
    title: "দীপ ও তিতাস",
    subtitle: "একটি নতুন গল্পের শুরু",
    coverKicker: "শুভ বিবাহ",
    rotateHint: "আরও বড় করে দেখতে ফোনটি সোজা করে ধরুন",
    opening: "শুভ সূচনা",
    meeting: "দুটি পথ, একটি গল্প",
    wedding: "শুভ পরিণয়",
    invitation: "সাদর আমন্ত্রণ",
    invitationMessage: "আমাদের জীবনের এই শুভ মুহূর্তে আপনাদের সাদর আমন্ত্রণ।",
    play: "গল্পটি দেখুন",
    explore: "নিজেই গল্পটি দেখুন",
    location: "স্থান দেখুন",
    skip: "আমন্ত্রণে যান",
    pause: "বিরতি",
    resume: "চালিয়ে যান",
    mute: "শব্দ বন্ধ করুন",
    unmute: "শব্দ চালু করুন",
    replay: "আবার দেখুন",
    share: "শেয়ার করুন",
    copied: "লিঙ্ক কপি হয়েছে",
    shareText: "দীপ ও তিতাসের শুভ পরিণয়ে আপনাদের সাদর আমন্ত্রণ।",
    languageName: "বাংলা",
    switchLanguage: "ভাষা বদলান",
    weddingLabel: "শুভবিবাহ",
    receptionLabel: "প্রীতিভোজ",
    venueLabel: "স্থান",
    landmarkLabel: "ল্যান্ডমার্ক",
    hintLotus: "পদ্মটিতে ছুঁয়ে দেখুন",
    hintPath: "আলোকিত পথে ছুঁয়ে দেখুন",
    hintMandap: "ফুলের ছাউনিতে ছুঁয়ে দেখুন",
    hintOrnament: "সোনালি অলঙ্কারে ছুঁয়ে দেখুন",
    storyLabel: "দীপ ও তিতাসের বিবাহের আমন্ত্রণ-চলচ্চিত্র",
    mapAria: "গুগল ম্যাপে স্থান দেখুন (নতুন ট্যাবে খুলবে)",
    controlsLabel: "গল্প নিয়ন্ত্রণ",
    loading: "লোড হচ্ছে…",
  },
  en: {
    title: "Deep & Titas",
    subtitle: "A new story begins",
    coverKicker: "The Wedding of",
    rotateHint: "Turn your phone upright for a bigger view",
    opening: "An Auspicious Beginning",
    meeting: "Two Paths, One Story",
    wedding: "A Sacred Union",
    invitation: "You Are Invited",
    invitationMessage:
      "We warmly invite you to celebrate this special moment in our lives.",
    play: "Watch the Story",
    explore: "Explore the Story",
    location: "View Location",
    skip: "Skip to Invitation",
    pause: "Pause",
    resume: "Resume",
    mute: "Mute sound",
    unmute: "Unmute sound",
    replay: "Replay",
    share: "Share",
    copied: "Link copied",
    shareText: "You are warmly invited to the wedding of Deep & Titas.",
    languageName: "English",
    switchLanguage: "Change language",
    weddingLabel: "Wedding",
    receptionLabel: "Reception",
    venueLabel: "Venue",
    landmarkLabel: "Landmark",
    hintLotus: "Tap the lotus",
    hintPath: "Tap the glowing path",
    hintMandap: "Tap the floral canopy",
    hintOrnament: "Tap the golden ornament",
    storyLabel: "Animated wedding invitation of Deep and Titas",
    mapAria: "View the location on Google Maps (opens in a new tab)",
    controlsLabel: "Story controls",
    loading: "Loading…",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["bn"];
export type Dictionary = Record<TranslationKey, string>;

export const t = (lang: Lang): Dictionary => translations[lang];

export const otherLang = (lang: Lang): Lang => (lang === "bn" ? "en" : "bn");

```

Key usage: `coverKicker/title/subtitle/play/explore/skip` cover; `rotateHint` HUD hint; `opening/meeting/wedding/invitation` in-picture scene headings and the sr-only live announcer (`SCENE_HEADING = {awakening:"opening", meeting:"meeting", wedding:"wedding", invitation:"invitation"}`); `invitationMessage/weddingLabel/receptionLabel/venueLabel/landmarkLabel/location/mapAria` card; `pause/resume/mute/unmute/replay/share/copied/shareText/controlsLabel` controls; `languageName/switchLanguage` toggle; `hintLotus/hintPath/hintMandap/hintOrnament` hotspots; `storyLabel` `<main aria-label>`; `loading` (defined, unused: the boot screen has its own bilingual text). Every visible string comes from here; Bengali is default.

### 2.3 Date formatting

**src/config/dates.ts**

```ts
import type { Lang } from "./translations";

const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  bn: ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"],
} as const;

const WEEKDAYS = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  bn: ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"],
} as const;

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export const toBengaliDigits = (s: string): string => s.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

/** Bengali day ordinals as printed on invitations: ১লা, ২রা, ৩রা, ৪ঠা, ৫ই … ১৮ই, ১৯শে … ৩১শে. */
export const bengaliDay = (d: number): string => {
  const n = toBengaliDigits(String(d));
  if (d === 1) return `${n}লা`;
  if (d === 2 || d === 3) return `${n}রা`;
  if (d === 4) return `${n}ঠা`;
  return d <= 18 ? `${n}ই` : `${n}শে`;
};

export interface FormattedDate {
  weekday: string;
  /** e.g. "২৫শে নভেম্বর ২০২৬" / "25 November 2026" */
  day: string;
}

/**
 * Formats an ISO date (YYYY-MM-DD) without depending on the browser's locale data, so Bengali output is
 * identical everywhere (and in video renders). Returns null for anything that is not a real calendar date.
 */
export const formatDate = (iso: string, lang: Lang): FormattedDate | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return {
    weekday: WEEKDAYS[lang][date.getUTCDay()],
    day:
      lang === "bn"
        ? `${bengaliDay(d)} ${MONTHS.bn[mo - 1]} ${toBengaliDigits(String(y))}`
        : `${d} ${MONTHS.en[mo - 1]} ${y}`,
  };
};

```

Locale-independent (identical in video renders). Bengali example `২৫শে নভেম্বর ২০২৬`; English `25 November 2026`. Invalid dates return null (hidden). The cover shows `formatDate(wedding.events.wedding.date, lang).day` only when non-null. `bengaliDate` strings in wedding.ts are used as-is.

---------------------------------------------------------------------------------------------------

## 3. App flow

### 3.1 Entry and App

**src/app/main.tsx**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../remotion/fonts";
import "../styles/tokens.css";
import "../styles/global.css";
import "../styles/experience.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

```

**src/app/App.tsx**

```tsx
import { useCallback, useState } from "react";
import type { Lang } from "../config/translations";
import { ExperienceShell } from "./components/ExperienceShell";
import { Loader } from "./components/Loader";
import { useReducedMotion } from "./hooks/useReducedMotion";

/** Bengali is the default language. The story starts only once every asset is loaded and decoded. */
export const App = () => {
  const [lang, setLang] = useState<Lang>("bn");
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const reducedMotion = useReducedMotion();
  return ready ? <ExperienceShell lang={lang} onLangChange={setLang} reducedMotion={reducedMotion} /> : <Loader onReady={onReady} />;
};

```

Language state lives in App (`"bn"` default). `ready` flips when the Loader calls `onReady`; until then only `Loader` (renders nothing; drives `#boot` from index.html) is mounted; afterwards `ExperienceShell`. CSS import order: fonts, tokens, global, experience.

### 3.2 Boot loader (Loader.tsx + preload.ts)

**src/app/components/Loader.tsx**

```tsx
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

```

**src/app/loader/preload.ts**

```ts
/**
 * Loads everything the story needs before the website starts: every webfont face, every baked image (fetched AND
 * decoded, so no layer ever pops in or flickers mid-story) and the soundtrack (so playback never stalls).
 * Progress is weighted by size. A missing or failing soundtrack is ignored — the story works without it.
 */
import { artImage } from "../../remotion/lib/images";

export interface LoadItem {
  id: string;
  kind: "font" | "image" | "audio";
  /** URL for images/audio; CSS font shorthand for fonts. */
  src: string;
  /** Relative cost, in bytes (approximate for fonts). */
  weight: number;
  /** Failure is tolerated (the audio). */
  optional?: boolean;
}

/** Weighted progress 0..1 given each item's own progress (0..1). Pure, for tests. */
export const weightedProgress = (items: readonly LoadItem[], done: ReadonlyMap<string, number>): number => {
  const total = items.reduce((n, it) => n + it.weight, 0);
  if (total <= 0) return 1;
  const got = items.reduce((n, it) => n + it.weight * Math.min(1, Math.max(0, done.get(it.id) ?? 0)), 0);
  return got / total;
};

/**
 * Fetches and decodes through the composition's shared image cache, so the story's canvases draw these very images
 * (and the cache keeps them referenced, so the browser keeps them decoded).
 */
const loadImage = (src: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const img = artImage(src);
    img
      .decode()
      .then(() => resolve())
      .catch(() => (img.complete && img.naturalWidth > 0 ? resolve() : reject(new Error(`image ${src}`))));
  });

/** Streams a file so progress is reported by bytes; the response lands in the HTTP cache for later playback. */
const loadStream = async (src: string, onBytes: (fraction: number) => void): Promise<void> => {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`${res.status} ${src}`);
  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body || !total) {
    await res.arrayBuffer();
    onBytes(1);
    return;
  }
  const reader = res.body.getReader();
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    got += value.byteLength;
    onBytes(Math.min(1, got / total));
  }
  onBytes(1);
};

export interface PreloadOptions {
  fontSample: string;
  /** After this long, stop waiting and start anyway (slow networks): whatever is missing streams in later. */
  timeoutMs?: number;
}

/** Loads all items (4 at a time for images), reporting overall progress. Resolves when done or on timeout. */
export const preloadAll = (items: readonly LoadItem[], onProgress: (p: number) => void, opts: PreloadOptions): Promise<void> => {
  const done = new Map<string, number>();
  const report = () => onProgress(weightedProgress(items, done));
  const finish = (id: string) => {
    done.set(id, 1);
    report();
  };

  const run = (it: LoadItem): Promise<void> => {
    const p =
      it.kind === "font"
        ? document.fonts.load(it.src, opts.fontSample).then(() => undefined)
        : it.kind === "image"
          ? loadImage(it.src)
          : loadStream(it.src, (f) => {
              done.set(it.id, f);
              report();
            });
    return p.then(
      () => finish(it.id),
      (err) => {
        if (!it.optional) console.warn("Preload failed", err);
        finish(it.id); // never block the guest on one asset
      },
    );
  };

  // a few at a time so the first images decode early instead of everything competing at once
  const queue = [...items];
  const worker = async () => {
    for (let it = queue.shift(); it; it = queue.shift()) await run(it);
  };
  const all = Promise.all(Array.from({ length: 6 }, worker)).then(() => undefined);
  const timeout = new Promise<void>((r) => setTimeout(r, opts.timeoutMs ?? 25000));
  report();
  return Promise.race([all, timeout]);
};

```

Summary: weights: each font face 45 000, each image its manifest `bytes`, audio 1 000 000 (optional). Fonts via `document.fonts.load(face, FONT_SAMPLE)`; images via the composition's shared `artImage(src)` cache (`src/remotion/lib/images`, spec-visual: returns an `HTMLImageElement` that stays referenced) and `img.decode()`; audio streamed with fetch+reader for byte progress. 6 parallel workers pulling from a queue; failures tolerated (warn unless optional), the item counts as done. Overall timeout 25 000 ms then start anyway. Progress never moves backwards; written directly to `#boot-bar` (`scaleX`), `#boot-pct` and `aria-valuenow` on `#boot`. Minimum display 900 ms; then `onReady()`, add class `boot--done` (opacity 0 over .65 s), remove the node after 700 ms. `ART` (name -> {src, bytes}) is the generated `art-manifest.ts`.

### 3.3 ExperienceShell

**src/app/components/ExperienceShell.tsx**

```tsx
import { Player, type PlayerRef } from "@remotion/player";
import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import { asset, AUDIO_PATH } from "../../config/assets";
import { COVER_FRAME, DURATION, FPS, HEIGHT, LAST_FRAME, WIDTH, type SceneId } from "../../config/timeline";
import { t, type Lang } from "../../config/translations";
import { WeddingComposition } from "../../remotion/WeddingComposition";
import type { WeddingProps } from "../../remotion/props";
import { usePlayerEvents } from "../hooks/usePlayerEvents";
import { useSoundtrack } from "../hooks/useSoundtrack";
import { useStageLayout } from "../hooks/useStageLayout";
import { useStoryMachine } from "../hooks/useStoryMachine";
import { IntroScreen } from "./IntroScreen";
import { LanguageToggle } from "./LanguageToggle";
import { StoryControls } from "./StoryControls";

interface Props {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  reducedMotion: boolean;
}

const HAS_AUDIO = typeof __HAS_AUDIO__ !== "undefined" && __HAS_AUDIO__;
const SCENE_HEADING = { awakening: "opening", meeting: "meeting", wedding: "wedding", invitation: "invitation" } as const;

/**
 * The 9:16 website shell: a fixed-ratio frame holding the Remotion Player and the cover, with the language toggle and
 * story controls in a HUD over the frame, or in the free bands around it when there is room (tall phones, landscape,
 * desktop). Website state lives in a reducer; the animation stays frame-driven inside the Player.
 */
export const ExperienceShell = ({ lang, onLangChange, reducedMotion }: Props) => {
  const playerRef = useRef<PlayerRef>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  useStageLayout(stageRef, roomRef);
  const { state, stateRef, send } = useStoryMachine();
  const { isPlaying, scene } = usePlayerEvents({ playerRef, stateRef, send });
  const [muted, setMuted] = useState(true);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | undefined>(undefined);

  const base = import.meta.env.BASE_URL;
  const audioSrc = HAS_AUDIO ? asset(AUDIO_PATH, base) : null;
  const setSoundMuted = useSoundtrack(playerRef, audioSrc);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === "bn" ? "দীপ ও তিতাস — শুভ পরিণয়" : "Deep & Titas — A Sacred Union";
  }, [lang]);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  // Test/profiling handle (dev, or any build opened with ?debug) so checks can read the frame and seek the Player.
  useEffect(() => {
    if (import.meta.env.DEV || new URLSearchParams(window.location.search).has("debug")) {
      Object.assign(window, { __weddingPlayer: playerRef, __weddingState: stateRef });
    }
  }, [stateRef]);

  // Sound begins only after a guest gesture (browsers block it otherwise); the story works fine without it.
  const enableSound = useCallback(() => {
    if (!HAS_AUDIO) return;
    setSoundMuted(false);
    setMuted(false);
  }, [setSoundMuted]);

  const watch = useCallback(
    (e: SyntheticEvent) => {
      const p = playerRef.current;
      if (!p) return;
      send({ type: "START_CINEMATIC" });
      p.seekTo(0);
      enableSound();
      p.play(e);
    },
    [send, enableSound],
  );

  const explore = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    send({ type: "START_GUIDED" });
    p.pause();
    p.seekTo(0);
    enableSound();
  }, [send, enableSound]);

  const activate = useCallback(
    (target: SceneId, e: SyntheticEvent) => {
      const p = playerRef.current;
      const s = stateRef.current;
      if (!p || s.phase !== "awaiting" || s.awaiting !== target) return;
      send({ type: "ACTIVATE", target });
      p.play(e);
    },
    [send, stateRef],
  );

  const skip = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    p.pause();
    p.seekTo(LAST_FRAME);
    send({ type: "SKIP" });
  }, [send]);

  const replay = useCallback(
    (e: SyntheticEvent) => {
      const p = playerRef.current;
      if (!p) return;
      send({ type: "REPLAY" });
      p.seekTo(0);
      p.play(e);
    },
    [send],
  );

  const togglePlay = useCallback((e: SyntheticEvent) => playerRef.current?.toggle(e), []);

  const toggleMute = useCallback(() => {
    setSoundMuted(!muted);
    setMuted(!muted);
  }, [muted, setSoundMuted]);

  const share = useCallback(async () => {
    const tx = t(lang);
    const url = window.location.href.split("#")[0];
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: tx.title, text: tx.shareText, url });
        return;
      }
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2400);
    } catch {
      window.prompt(tx.share, url);
    }
  }, [lang]);

  const guided = useMemo(
    () => ({ enabled: state.mode === "guided", awaiting: state.awaiting, onActivate: activate }),
    [state.mode, state.awaiting, activate],
  );

  // Memoised so the Player re-renders the composition only when something it shows actually changes.
  // The soundtrack is played by the shell (useSoundtrack), not inside the Player.
  const inputProps = useMemo<WeddingProps>(
    () => ({
      lang,
      assetBase: base,
      audioSrc: null,
      reducedMotion,
      interactive: true,
      guided,
    }),
    [lang, base, reducedMotion, guided],
  );

  const tx = t(lang);
  return (
    <div className="stage" ref={stageRef}>
      <div className="stage__room" ref={roomRef} aria-hidden="true" />

      <div className="hud hud--top">
        <LanguageToggle lang={lang} onChange={onLangChange} />
        <p className="rotate-hint" lang={lang}>
          {tx.rotateHint}
        </p>
      </div>

      <main className="frame" aria-label={tx.storyLabel}>
        {/* the composition at its own size (scale 1 inside the Player), scaled to the frame by CSS: see useStageLayout */}
        <div className="frame__player">
          <Player
            ref={playerRef}
            component={WeddingComposition}
            inputProps={inputProps}
            durationInFrames={DURATION}
            compositionWidth={WIDTH}
            compositionHeight={HEIGHT}
            fps={FPS}
            initialFrame={COVER_FRAME}
            controls={false}
            loop={false}
            clickToPlay={false}
            doubleClickToFullscreen={false}
            spaceKeyToPlayOrPause={false}
            allowFullscreen={false}
            moveToBeginningWhenEnded={false}
            initiallyMuted
            acknowledgeRemotionLicense
            style={{ width: WIDTH, height: HEIGHT }}
          />
        </div>

        {state.phase === "intro" && (
          <IntroScreen lang={lang} onWatch={watch} onExplore={explore} onSkip={skip} />
        )}

        <div className="sr-only" aria-live="polite">
          {state.phase === "intro" ? "" : tx[SCENE_HEADING[scene]]}
        </div>
      </main>

      <div className="hud hud--bottom">
        <StoryControls
          lang={lang}
          phase={state.phase}
          isPlaying={isPlaying}
          muted={muted}
          hasAudio={HAS_AUDIO}
          copied={copied}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
          onSkip={skip}
          onReplay={replay}
          onShare={share}
        />
      </div>
    </div>
  );
};

```

Behaviour details:
- **Player config** (exact): `controls=false loop=false clickToPlay=false doubleClickToFullscreen=false spaceKeyToPlayOrPause=false allowFullscreen=false moveToBeginningWhenEnded=false initiallyMuted acknowledgeRemotionLicense`, `initialFrame=COVER_FRAME` (236: alpana and lotus drawn, before names), fixed 1080x1920 style (scaled by CSS, section 4). The Player never resets at the end, so the invitation card stays interactive.
- **Watch the story**: `START_CINEMATIC`, seek 0, enable sound (inside the gesture), `player.play(e)`.
- **Explore**: `START_GUIDED`, pause, seek 0, enable sound. The story waits for the first hotspot.
- **Activate** (hotspot tap): only if phase is `awaiting` and `awaiting === target`; send ACTIVATE then `play(e)`.
- **Skip**: pause, seek `LAST_FRAME`, send SKIP (finished). Works from the cover too.
- **Replay**: send REPLAY, seek 0, play. **Pause/Resume**: `player.toggle(e)`. **Mute** toggles; `muted` starts true.
- **Share**: `navigator.share({title, text: shareText, url})` if available (AbortError ignored; other errors fall through), else `clipboard.writeText(url)` and toast `tx.copied` for 2400 ms, else `window.prompt(tx.share, url)`. URL = `location.href` without `#hash`.
- `document.documentElement.lang` and `document.title` follow the language: bn `"দীপ ও তিতাস — শুভ পরিণয়"`, en `"Deep & Titas — A Sacred Union"`.
- Sr-only live region announces `tx[SCENE_HEADING[scene]]` (empty on the cover).
- **Debug hooks**: when `import.meta.env.DEV` or the URL has `?debug`, `window.__weddingPlayer = playerRef` and `window.__weddingState = stateRef` (React refs; read `.current`). Used by profile.mjs.
- `inputProps` memoised (`lang, assetBase=BASE_URL, audioSrc:null, reducedMotion, interactive:true, guided`); `guided = {enabled: state.mode==="guided", awaiting: state.awaiting, onActivate: activate}`.
- DOM order (never reorder): `.stage > .stage__room(aria-hidden)`, `.hud.hud--top` (LanguageToggle + `p.rotate-hint`), `main.frame(aria-label=storyLabel)` { `.frame__player > Player`, IntroScreen while `phase==="intro"`, `.sr-only[aria-live=polite]` }, `.hud.hud--bottom > StoryControls`.

### 3.4 Story state machine (pure reducer)

**src/app/state/storyMachine.ts**

```ts
import { nextScene, type SceneId } from "../../config/timeline";

/**
 * Website-level story state, kept separate from frame-driven animation state.
 * It is a pure reducer so the guided order (lotus → path → mandap → ornament) can be unit-tested.
 */
export type StoryMode = "cinematic" | "guided";
export type StoryPhase = "intro" | "playing" | "awaiting" | "finished";

export interface StoryState {
  phase: StoryPhase;
  mode: StoryMode | null;
  /** The scene most recently started (guided: the one now playing). */
  step: SceneId;
  /** Guided mode: the scene a tap on the current hotspot will start. */
  awaiting: SceneId | null;
}

export type StoryAction =
  | { type: "START_CINEMATIC" }
  | { type: "START_GUIDED" }
  | { type: "ACTIVATE"; target: SceneId }
  | { type: "SCENE"; scene: SceneId }
  | { type: "BOUNDARY"; scene: SceneId }
  | { type: "ENDED" }
  | { type: "SKIP" }
  | { type: "REPLAY" }
  | { type: "RESET" };

export const initialStoryState: StoryState = {
  phase: "intro",
  mode: null,
  step: "awakening",
  awaiting: null,
};

export const storyReducer = (state: StoryState, action: StoryAction): StoryState => {
  switch (action.type) {
    case "START_CINEMATIC":
    case "REPLAY":
      return { phase: "playing", mode: "cinematic", step: "awakening", awaiting: null };

    case "START_GUIDED":
      return { phase: "awaiting", mode: "guided", step: "awakening", awaiting: "awakening" };

    case "ACTIVATE":
      // Only the hotspot currently offered may advance the story, so taps can never skip a scene.
      if (state.phase !== "awaiting" || state.awaiting !== action.target) return state;
      return { ...state, phase: "playing", step: action.target, awaiting: null };

    case "SCENE":
      // Cinematic only: in guided mode the step is advanced solely by the guest's taps (ACTIVATE).
      if (state.phase !== "playing" || state.mode !== "cinematic" || state.step === action.scene) return state;
      return { ...state, step: action.scene };

    case "BOUNDARY": {
      // Guided mode pauses at the end of each scene and offers the next hotspot.
      if (state.phase !== "playing" || state.mode !== "guided" || state.step !== action.scene) return state;
      const next = nextScene(action.scene);
      return next
        ? { ...state, phase: "awaiting", awaiting: next }
        : { ...state, phase: "finished", awaiting: null };
    }

    case "ENDED":
      return state.phase === "intro" ? state : { ...state, phase: "finished", step: "invitation", awaiting: null };

    case "SKIP":
      return { phase: "finished", mode: state.mode ?? "cinematic", step: "invitation", awaiting: null };

    case "RESET":
      return initialStoryState;
  }
};

```

**src/app/hooks/useStoryMachine.ts**

```ts
import { useCallback, useRef, useState } from "react";
import { initialStoryState, storyReducer, type StoryAction, type StoryState } from "../state/storyMachine";

/**
 * Reducer state that is also readable synchronously through a ref. Player event handlers (frameupdate fires every
 * frame) read the ref so they never act on a stale step right after a dispatch.
 */
export const useStoryMachine = () => {
  const ref = useRef<StoryState>(initialStoryState);
  const [state, setState] = useState<StoryState>(initialStoryState);

  const send = useCallback((action: StoryAction) => {
    const next = storyReducer(ref.current, action);
    if (next === ref.current) return;
    ref.current = next;
    setState(next);
  }, []);

  return { state, stateRef: ref, send };
};

```

Transition table:
| state | action | result |
|---|---|---|
| any | START_CINEMATIC / REPLAY | `{playing, cinematic, step awakening, awaiting null}` |
| any | START_GUIDED | `{awaiting, guided, step awakening, awaiting "awakening"}` |
| awaiting (awaiting===target) | ACTIVATE | `{...state, playing, step: target, awaiting null}`; otherwise same object |
| playing+cinematic | SCENE(s) | step=s unless already s; otherwise same object |
| playing+guided, step===scene | BOUNDARY(scene) | next scene exists -> `awaiting` with `awaiting: next`; none (invitation) -> `finished` |
| not intro | ENDED | `{finished, step invitation, awaiting null}`; on intro unchanged |
| any | SKIP | `{finished, mode: previous ?? "cinematic", step invitation, awaiting null}` |
| any | RESET | initial |

Initial: `{phase:"intro", mode:null, step:"awakening", awaiting:null}`. Ignored actions return the identical object (tests use `toBe`). Guided order: awakening (lotus) -> meeting (path) -> wedding (mandap) -> invitation (ornament). `useStoryMachine` keeps state in a ref (synchronous read by frame handlers) and in React state; `send` computes from the ref and skips setState when unchanged.

### 3.5 Player events (guided checkpoints)

**src/app/hooks/usePlayerEvents.ts**

```ts
import type { PlayerRef } from "@remotion/player";
import { useEffect, useState, type MutableRefObject, type RefObject } from "react";
import { sceneAt, sceneLastFrame, type SceneId } from "../../config/timeline";
import type { StoryAction, StoryState } from "../state/storyMachine";

interface Options {
  playerRef: RefObject<PlayerRef | null>;
  stateRef: MutableRefObject<StoryState>;
  send: (action: StoryAction) => void;
}

/**
 * Subscribes to the Player once. `frameupdate` fires on every frame, so the handler only does work at scene
 * boundaries; React state is touched only when the scene or play/pause state actually changes.
 */
export const usePlayerEvents = ({ playerRef, stateRef, send }: Options) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [scene, setScene] = useState<SceneId>("awakening");

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    let lastScene: SceneId | null = null;

    const onFrame = (e: { detail: { frame: number } }) => {
      const frame = e.detail.frame;
      const s = stateRef.current;
      // Boundary first, and with `>=`: on a slow device the Player may skip the checkpoint frame itself,
      // and the guest must still be held on the scene's final frame rather than slipping into the next scene.
      if (s.phase === "playing" && s.mode === "guided" && s.step !== "invitation" && frame >= sceneLastFrame(s.step)) {
        player.pause();
        player.seekTo(sceneLastFrame(s.step));
        send({ type: "BOUNDARY", scene: s.step });
        return;
      }
      const current = sceneAt(frame);
      if (current !== lastScene) {
        lastScene = current;
        setScene(current);
        send({ type: "SCENE", scene: current });
      }
    };
    const onEnded = () => send({ type: "ENDED" });
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("ended", onEnded);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("ended", onEnded);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [playerRef, stateRef, send]);

  return { isPlaying, scene };
};

```

Checkpoint rules: `frameupdate` fires every frame so the handler works only at boundaries. In guided+playing with step != invitation, **`frame >= sceneLastFrame(step)`** (use `>=`, checked BEFORE scene updates, because the Player may skip frames on slow devices): pause, `seekTo(sceneLastFrame(step))`, send BOUNDARY. Else track `sceneAt(frame)`; on change set React `scene` and send SCENE. Timeline helpers (timeline.ts): `SCENES[id]={start,end}` frames (end exclusive) = beats x 2: awakening 0-480, meeting 480-1140, wedding 1140-2100, invitation 2100-3000; `sceneLastFrame(id)=SCENES[id].end-1` (479, 1139, 2099); `sceneAt(frame)` clamps 0..2999, default invitation; `nextScene`, `previousScene`; `beatsToFrames=round(beats*2)`. `ended` -> ENDED. `play`/`pause` events drive `isPlaying`.

### 3.6 Cover — IntroScreen

**src/app/components/IntroScreen.tsx**

```tsx
import { formatDate } from "../../config/dates";
import { otherLang, t, type Lang } from "../../config/translations";
import { wedding } from "../../config/wedding";

interface Props {
  lang: Lang;
  onWatch: (e: React.SyntheticEvent) => void;
  onExplore: (e: React.SyntheticEvent) => void;
  onSkip: () => void;
}

const PlayIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** The lotus medallion of the invitation, as a static mark. */
const Emblem = () => (
  <svg className="cover__emblem" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
    <circle r="92" fill="#781f2b" stroke="#c49a52" strokeWidth="6" />
    <circle r="78" fill="none" stroke="#c49a52" strokeWidth="2.4" strokeDasharray="1 10" strokeLinecap="round" />
    <g transform="translate(0 34)" fill="#e9c97a" stroke="#8f6c2a" strokeWidth="1.6">
      {[-62, -36, 36, 62, -14, 14, 0].map((a) => (
        <path key={a} d="M0 0C14 -18 14 -50 0 -72C-14 -50 -14 -18 0 0Z" transform={`rotate(${a})`} />
      ))}
    </g>
    <path d="M-40 40Q0 52 40 40" stroke="#e9c97a" strokeWidth="3" fill="none" />
  </svg>
);

/** One corner flourish; mirrored into the four corners by CSS. */
const Corner = ({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) => (
  <svg className={`cover__corner cover__corner--${pos}`} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <path d="M14 70A56 56 0 0 1 70 14" stroke="#c49a52" strokeWidth="3" fill="none" />
    <path d="M14 48A34 34 0 0 1 48 14" stroke="#781f2b" strokeWidth="2.4" fill="none" />
    <path d="M14 100C14 62 40 36 76 32C98 30 108 44 100 56C94 64 82 62 84 52" stroke="#c49a52" strokeWidth="2.6" fill="none" />
    <path d="M100 14C62 14 36 40 32 76C30 98 44 108 56 100C64 94 62 82 52 84" stroke="#c49a52" strokeWidth="2.6" fill="none" />
    <circle cx="26" cy="26" r="7" fill="#781f2b" stroke="#c49a52" strokeWidth="2.6" />
  </svg>
);

/**
 * The cover: a framed title page over the painted opening frame. "Watch the Story" is always the main action
 * (reduced motion only changes how the story plays, never which button leads); exploring is secondary and skipping
 * straight to the invitation is a quiet text link.
 */
export const IntroScreen = ({ lang, onWatch, onExplore, onSkip }: Props) => {
  const tx = t(lang);
  const alt = t(otherLang(lang));
  const date = formatDate(wedding.events.wedding.date, lang);
  return (
    <section className="cover" aria-label={tx.title}>
      <div className="cover__frame" aria-hidden="true">
        <Corner pos="tl" />
        <Corner pos="tr" />
        <Corner pos="bl" />
        <Corner pos="br" />
      </div>

      <div className="cover__head" lang={lang}>
        <Emblem />
        <p className="cover__kicker">{tx.coverKicker}</p>
        <h1 className="cover__names">{tx.title}</h1>
        <div className="cover__rule" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        <p className="cover__subtitle">{tx.subtitle}</p>
        {date && <p className="cover__date">{date.day}</p>}
      </div>

      <div className="cover__actions">
        <button type="button" className="btn btn--primary" onClick={onWatch}>
          <span className="btn__icon">
            <PlayIcon />
          </span>
          <span className="btn__label">
            <span lang={lang}>{tx.play}</span>
            <small lang={otherLang(lang)}>{alt.play}</small>
          </span>
        </button>
        <button type="button" className="btn btn--ghost" onClick={onExplore}>
          <span className="btn__label">
            <span lang={lang}>{tx.explore}</span>
            <small lang={otherLang(lang)}>{alt.explore}</small>
          </span>
        </button>
        <button type="button" className="link-btn" onClick={onSkip} lang={lang}>
          {tx.skip}
          <ArrowIcon />
        </button>
      </div>
    </section>
  );
};

```

Shown while `phase==="intro"` over the painted opening frame (Player parked at COVER_FRAME 236). Top to bottom: head block (emblem, kicker, names `h1`, rule, subtitle, wedding date in current language when valid), then actions: primary "Watch the Story" (`btn--primary`, play icon, label in the current language with the OTHER language as `<small>` beneath), ghost "Explore" (same two-line label), and a quiet text link "Skip to Invitation" with arrow (`link-btn`). **Watch is always primary, including under reduced motion.** `lang` attributes: head = current language, each sub-label its own language. `section.cover aria-label=tx.title`; frame/corners `aria-hidden`.

### 3.7 Controls — StoryControls

**src/app/components/StoryControls.tsx**

```tsx
import type { SyntheticEvent } from "react";
import { t, type Lang } from "../../config/translations";
import type { StoryPhase } from "../state/storyMachine";

interface Props {
  lang: Lang;
  phase: StoryPhase;
  isPlaying: boolean;
  muted: boolean;
  hasAudio: boolean;
  copied: boolean;
  onTogglePlay: (e: SyntheticEvent) => void;
  onToggleMute: () => void;
  onSkip: () => void;
  onReplay: (e: SyntheticEvent) => void;
  onShare: () => void;
}

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg className="ctl__icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

const PauseIcon = () => (
  <Icon>
    <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
  </Icon>
);
const PlayIcon = () => (
  <Icon>
    <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
  </Icon>
);
const SoundOnIcon = () => (
  <Icon>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" fill="currentColor" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Icon>
);
const SoundOffIcon = () => (
  <Icon>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" fill="currentColor" />
    <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Icon>
);
const SkipIcon = () => (
  <Icon>
    <path d="M5 5v14l9-7zM16 5h3v14h-3z" fill="currentColor" />
  </Icon>
);
const ReplayIcon = () => (
  <Icon>
    <path d="M12 5a7 7 0 1 1-6.6 4.7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 1.5L7.5 5 12 8.5z" fill="currentColor" />
  </Icon>
);
const ShareIcon = () => (
  <Icon>
    <path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 13v6h14v-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

/** Bottom thumb-zone controls. Which ones appear depends on the story phase. */
export const StoryControls = ({
  lang,
  phase,
  isPlaying,
  muted,
  hasAudio,
  copied,
  onTogglePlay,
  onToggleMute,
  onSkip,
  onReplay,
  onShare,
}: Props) => {
  const tx = t(lang);
  if (phase === "intro") return null;
  const finished = phase === "finished";
  return (
    <div className="controls" role="toolbar" aria-label={tx.controlsLabel}>
      {phase === "playing" && (
        <button type="button" className="ctl" onClick={onTogglePlay}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
          <span>{isPlaying ? tx.pause : tx.resume}</span>
        </button>
      )}
      {finished && (
        <>
          <button type="button" className="ctl" onClick={onReplay}>
            <ReplayIcon />
            <span>{tx.replay}</span>
          </button>
          <button type="button" className="ctl" onClick={onShare}>
            <ShareIcon />
            <span>{tx.share}</span>
          </button>
        </>
      )}
      {hasAudio && (
        <button type="button" className="ctl ctl--icon" onClick={onToggleMute} aria-pressed={muted} aria-label={muted ? tx.unmute : tx.mute}>
          {muted ? <SoundOffIcon /> : <SoundOnIcon />}
        </button>
      )}
      {!finished && (
        <button type="button" className="ctl" onClick={onSkip}>
          <SkipIcon />
          <span>{tx.skip}</span>
        </button>
      )}
      <span className="toast" role="status" aria-live="polite">
        {copied ? tx.copied : ""}
      </span>
    </div>
  );
};

```

What shows when: intro -> nothing. playing -> [Pause/Resume (label by isPlaying)], [mute if audio], [Skip]. awaiting (guided) -> [mute if audio], [Skip] (no pause: the hotspot is the control). finished -> [Replay] [Share] [mute if audio], no skip. Mute button is icon-only, `aria-pressed={muted}`, `aria-label = muted ? unmute : mute`, exists only if `HAS_AUDIO`. `span.toast[role=status][aria-live=polite]` shows `tx.copied` (hidden by `:empty`).

### 3.8 Language toggle

**src/app/components/LanguageToggle.tsx**

```tsx
import { t, type Lang } from "../../config/translations";

interface Props {
  lang: Lang;
  onChange: (lang: Lang) => void;
}

const OPTIONS: Lang[] = ["bn", "en"];

/** বাংলা | English. Changes only the text; the story keeps playing from the same frame. */
export const LanguageToggle = ({ lang, onChange }: Props) => (
  <div className="lang-toggle" role="group" aria-label={`${t("bn").switchLanguage} / ${t("en").switchLanguage}`}>
    {OPTIONS.map((l) => (
      <button
        key={l}
        type="button"
        className="lang-toggle__btn"
        lang={l}
        aria-pressed={lang === l}
        onClick={() => onChange(l)}
      >
        {t(l).languageName}
      </button>
    ))}
  </div>
);

```

Two buttons "বাংলা" | "English" in a pill, `aria-pressed`, group label `"ভাষা বদলান / Change language"`. Only text changes; the story keeps playing from the same frame, the soundtrack is not restarted.

### 3.9 Soundtrack (plain `<audio>`, shell-owned)

**src/app/hooks/useSoundtrack.ts**

```ts
import type { PlayerRef } from "@remotion/player";
import { useCallback, useEffect, useRef, type RefObject } from "react";
import { FPS, framesToBeats } from "../../config/timeline";
import { soundtrackVolume } from "../../remotion/Soundtrack";

/** Re-sync the music only when it has drifted this far from the story (seeks, stalls), never every frame. */
const MAX_DRIFT_S = 0.35;

/**
 * The website plays the soundtrack with a plain <audio> element outside the Remotion Player: the browser decodes and
 * mixes it off the main thread, so the animation keeps the main thread to itself on phones. It follows the Player
 * (play, pause, seek) and the same volume envelope as video renders. Sound starts only after a guest gesture; a
 * missing or failing file is silently ignored.
 */
export const useSoundtrack = (playerRef: RefObject<PlayerRef | null>, src: string | null) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!src) return;
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.muted = true;
    audioRef.current = audio;
    audio.addEventListener("error", () => {
      audioRef.current = null;
    });
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const sync = (frame: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const t = frame / FPS;
      if (Math.abs(audio.currentTime - t) > MAX_DRIFT_S) audio.currentTime = t;
      audio.volume = Math.min(1, Math.max(0, soundtrackVolume(framesToBeats(frame))));
    };
    const onPlay = () => {
      const audio = audioRef.current;
      if (!audio) return;
      sync(player.getCurrentFrame());
      audio.play().catch(() => undefined);
    };
    const onPause = () => audioRef.current?.pause();
    const onFrame = (e: { detail: { frame: number } }) => sync(e.detail.frame);
    const onSeek = (e: { detail: { frame: number } }) => sync(e.detail.frame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onPause);
    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("seeked", onSeek);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onPause);
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("seeked", onSeek);
    };
  }, [playerRef]);

  /** Mutes/unmutes. Unmuting must happen in a guest gesture the first time (browsers block sound otherwise). */
  return useCallback(
    (muted: boolean) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.muted = muted;
      // play() inside the gesture unlocks audio (iOS); if the story is not running, pause again right away
      if (!muted)
        audio
          .play()
          .then(() => {
            if (!playerRef.current?.isPlaying()) audio.pause();
          })
          .catch(() => undefined);
    },
    [playerRef],
  );
};

```

**src/remotion/Soundtrack.tsx**

```tsx
import { Html5Audio } from "remotion";
import { SCENE_BEATS } from "../config/timeline";
import { keyframes } from "./lib/anim";
import { useBeat } from "./lib/time";

const W = SCENE_BEATS.wedding;
const END = SCENE_BEATS.invitation.end;

/**
 * Volume envelope as a pure function of the beat: gentle fade-in, a swell through the wedding scene's
 * emotional peak, a soft resolve, and a fade-out over the final seconds. Never abrupt.
 */
export const soundtrackVolume = (beat: number): number =>
  keyframes(
    beat,
    [0, 75, W.start + 150, W.start + 270, W.start + 330, W.start + 400, W.end + 20, END - 100, END - 0.5],
    [0, 0.5, 0.58, 0.88, 0.9, 0.62, 0.55, 0.5, 0],
  );

/**
 * Renders nothing unless a soundtrack URL was provided, so a missing file never breaks playback.
 * A native <audio> element (decoded by the browser, off the main thread) rather than a JS decoder: the story's
 * animation keeps the main thread to itself on phones.
 */
export const Soundtrack = ({ src }: { src: string | null }) => {
  const beat = useBeat();
  if (!src) return null;
  return <Html5Audio src={src} volume={soundtrackVolume(beat)} />;
};

```

Rules: the website never uses the composition's `<Soundtrack>` (inputProps.audioSrc is null); `Html5Audio` exists only for video renders. One `new Audio(src)` with `preload="auto"`, `muted=true`; follows Player `play/pause/ended/frameupdate/seeked`; re-seeks only when drift > 0.35 s; volume = `soundtrackVolume(framesToBeats(frame))` (envelope above; `keyframes` from `lib/anim`, story.md owns beats). Unmuting inside a gesture calls `audio.play()` (unlocks iOS) and re-pauses if the Player is not playing. Errors null the ref (silent degrade); every `play()` has `.catch(()=>undefined)`. Sound begins only via the Watch/Explore gesture; with no audio file the mute button is hidden and nothing breaks.

### 3.10 Reduced motion

**src/app/hooks/useReducedMotion.ts**

```ts
import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(QUERY).matches : false,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
};

```

`prefers-reduced-motion: reduce` read via matchMedia (initial + change listener), passed as the `reducedMotion` prop: composition drops petals/dust/parallax/camera moves, characters fade instead of walking, card fades in (story/visual). Shell CSS also disables cover animations, transitions and hover transforms under that query (end of experience.css). Hotspot ring pulse is replaced by static opacity .6.

---------------------------------------------------------------------------------------------------

## 4. Layout and styling

### 4.1 Stage maths

**src/app/hooks/useStageLayout.ts**

```ts
import { useLayoutEffect, type RefObject } from "react";
import { HEIGHT, WIDTH } from "../../config/timeline";

/** Where the language toggle and story controls sit: over the picture, in the bands above/below it, or beside it. */
export type HudPlacement = "inside" | "bands" | "side";

export interface StageFit {
  /** Frame size in CSS px (always 9:16). */
  width: number;
  height: number;
  /** Composition px → CSS px. */
  scale: number;
  /** Free space above/below and beside the frame (each side), in CSS px. */
  bandY: number;
  bandX: number;
  hud: HudPlacement;
}

/**
 * Fits the 9:16 frame into the room available. `room` is the stable height (the small viewport: what is left when the
 * browser's toolbars are showing), so the frame never rescales while a phone's address bar slides in and out;
 * `stage` is the real visible box, which decides how much band there is around the frame for the controls.
 */
export const fitStage = (room: { w: number; h: number }, stage: { w: number; h: number }): StageFit => {
  const width = Math.max(1, Math.floor(Math.min(room.w, (room.h * WIDTH) / HEIGHT)));
  const height = (width * HEIGHT) / WIDTH;
  const bandY = Math.max(0, (stage.h - height) / 2);
  const bandX = Math.max(0, (stage.w - width) / 2);
  // where the controls go is decided from the stable room (so they never hop between places as a toolbar slides);
  // they are max(44px, 10.4% of the frame) tall, and about 40% of the frame wide at their widest
  const controlH = Math.max(44, width * 0.104);
  const roomBandY = (room.h - height) / 2;
  const roomBandX = (room.w - width) / 2;
  const hud: HudPlacement =
    roomBandY >= controlH + 12 ? "bands" : roomBandX >= Math.max(190, width * 0.4) + 24 ? "side" : "inside";
  return { width, height, scale: width / WIDTH, bandY, bandX, hud };
};

/**
 * Lays out the stage from a ResizeObserver, writing CSS variables straight onto the stage element. The observer runs
 * after layout and before paint, so the frame, the scaled composition and the controls all change in the same painted
 * frame as the viewport. (The Player's own scaling goes through React state, a frame late, which showed a cropped
 * picture for a frame on every resize.) Nothing here re-renders React.
 */
export const useStageLayout = (stageRef: RefObject<HTMLElement | null>, roomRef: RefObject<HTMLElement | null>) => {
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const room = roomRef.current;
    if (!stage || !room) return;
    let last = "";
    const apply = () => {
      const s = stage.getBoundingClientRect();
      const r = room.getBoundingClientRect();
      const cs = getComputedStyle(stage);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const fit = fitStage({ w: r.width, h: r.height }, { w: s.width - padX, h: s.height - padY });
      const key = `${fit.width}|${fit.bandY.toFixed(1)}|${fit.bandX.toFixed(1)}|${fit.hud}`;
      if (key === last) return;
      last = key;
      stage.style.setProperty("--frame-w", `${fit.width}px`);
      stage.style.setProperty("--stage-scale", String(fit.scale));
      stage.style.setProperty("--band-y", `${fit.bandY}px`);
      stage.style.setProperty("--band-x", `${fit.bandX}px`);
      stage.dataset.hud = fit.hud;
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(stage);
    ro.observe(room);
    return () => ro.disconnect();
  }, [stageRef, roomRef]);
};

```

Semantics: `room` = `.stage__room` (invisible box = small viewport `100svh` minus safe-area insets, so a sliding address bar never rescales the frame); `stage` = the real visible box minus padding (decides band size). Frame width = `floor(min(room.w, room.h*1080/1920))`, height = width*16/9, `scale = width/1080`. HUD from the stable room: controlH = `max(44, width*0.104)`; `"bands"` if `(room.h-height)/2 >= controlH+12`; else `"side"` if `(room.w-width)/2 >= max(190, width*0.4)+24`; else `"inside"`. A ResizeObserver on stage and room writes CSS variables on `.stage` synchronously (`--frame-w`, `--stage-scale`, `--band-y`, `--band-x`) and `data-hud`, only when the key `width|bandY.toFixed(1)|bandX.toFixed(1)|hud` changes; no React re-render; `useLayoutEffect`. The Player always renders at 1080x1920 scale 1; `.frame__player` scales it with one CSS transform. Examples: 390x844 bands; 375x667 inside; 844x390 side; 1920x1080 side.

### 4.2 tokens.css

**src/styles/tokens.css**

```css
:root {
  /* Palette */
  --sindoor-red: #781f2b;
  --ivory: #f5ebdd;
  --antique-gold: #c49a52;
  --forest-green: #344638;
  --ink-brown: #30251f;
  --muted-brown: #665343;

  /* Surround (desktop) */
  --surround-top: #4a1f24;
  --surround-mid: #2b1613;
  --surround-bottom: #1c0e0c;

  /* Typography */
  --font-bn: "Anek Bangla Variable", "Noto Sans Bengali", sans-serif;
  --font-bn-display: "Galada", "Anek Bangla Variable", serif;
  --font-bn-ui: "Anek Bangla Variable", "Noto Sans Bengali", sans-serif;
  --font-en: "Cormorant Garamond", "Times New Roman", serif;

  /* Controls */
  --touch: 44px;
  --ring: 0 0 0 3px var(--ivory), 0 0 0 6px var(--sindoor-red);
}

```

### 4.3 global.css

**src/styles/global.css**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
  margin: 0;
}

body {
  background: var(--surround-bottom);
  color: var(--ink-brown);
  font-family: var(--font-bn-ui);
  font-synthesis: none; /* never fake a bold that the single-weight Galada does not have */
  -webkit-font-smoothing: antialiased;
  -webkit-text-size-adjust: 100%;
  overscroll-behavior: none;
  overflow: hidden;
}

button {
  font: inherit;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
}

[lang="en"] {
  font-family: var(--font-en);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

```

### 4.4 experience.css (complete)
`.frame` and `.hud` have `container-type:inline-size`, so every `cqw` is 1% of the frame width; sizes scale with the frame with `--touch:44px` minimums.

**src/styles/experience.css**

```css
/*
 * The strict 9:16 stage. The cinematic frame never changes proportion, on any screen. useStageLayout fits it into
 * .stage__room and writes --frame-w, --stage-scale, --band-x/-y and data-hud on .stage, in the same frame as a resize.
 */
.stage {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: radial-gradient(120% 90% at 50% 18%, var(--surround-top) 0%, var(--surround-mid) 58%, var(--surround-bottom) 100%);
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

.stage > .frame,
.stage > .hud {
  grid-area: 1 / 1;
  width: var(--frame-w, min(100vw, 56.25vh));
  aspect-ratio: 9 / 16;
  container-type: inline-size;
}

/*
 * The room the frame is fitted into: the small viewport (what is left while a phone's toolbars are showing), inside
 * the safe areas. It does not change as the address bar slides in and out, so neither does the frame.
 */
.stage__room {
  position: absolute;
  left: env(safe-area-inset-left);
  right: env(safe-area-inset-right);
  top: env(safe-area-inset-top);
  height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  max-height: calc(100% - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  visibility: hidden;
  pointer-events: none;
}

@supports (height: 100svh) {
  .stage__room {
    height: calc(100svh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  }
}

.frame {
  position: relative;
  background: var(--ivory);
  overflow: hidden;
  isolation: isolate;
}

@media (min-width: 700px) and (min-height: 640px) {
  .frame {
    border-radius: 22px;
    box-shadow: 0 0 0 1px rgba(196, 154, 82, 0.35), 0 40px 100px rgba(0, 0, 0, 0.55);
  }
}

/* the composition at its own 1080×1920, scaled down as one layer (never re-laid-out or re-rendered on resize) */
.frame__player {
  position: absolute;
  left: 0;
  top: 0;
  width: 1080px;
  height: 1920px;
  transform-origin: 0 0;
  transform: scale(var(--stage-scale, 0.3333));
}

/* ---------- HUD: language toggle and story controls ---------- */
.hud {
  position: relative;
  z-index: 1;
  pointer-events: none;
}

.rotate-hint {
  display: none;
}

@media (orientation: landscape) and (max-height: 560px) and (pointer: coarse) {
  [data-hud="side"] .rotate-hint {
    display: block;
    position: absolute;
    right: calc(100% + 24px);
    top: 50%;
    width: min(240px, calc(var(--band-x) - 48px));
    margin: 0;
    transform: translateY(-50%);
    color: rgba(245, 235, 221, 0.82);
    font-size: 15px;
    line-height: 1.5;
    text-align: right;
  }
}

/* ---------- buttons ---------- */
.btn,
.ctl,
.lang-toggle__btn,
.link-btn {
  cursor: pointer;
  border: 0;
  transition: transform 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
}

.btn:focus-visible,
.ctl:focus-visible,
.lang-toggle__btn:focus-visible,
.link-btn:focus-visible {
  outline: none;
  box-shadow: var(--ring);
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.4cqw;
  width: 100%;
  min-height: max(var(--touch), 13cqw);
  padding: 1.8cqw 5cqw;
  border-radius: 999px;
  text-align: center;
}

.btn--primary {
  background: var(--sindoor-red);
  color: var(--ivory);
  border: 0.5cqw solid var(--antique-gold);
  box-shadow: 0 1.2cqw 0 rgba(48, 37, 31, 0.18);
}

.btn--primary:hover {
  background: #8f2433;
  transform: translateY(-2px);
}

.btn--ghost {
  background: rgba(251, 244, 230, 0.7);
  color: var(--sindoor-red);
  border: 0.45cqw solid var(--antique-gold);
}

.btn--ghost:hover {
  background: rgba(251, 244, 230, 0.95);
}

.btn:active,
.ctl:active {
  transform: translateY(1px) scale(0.985);
}

.btn__icon {
  display: grid;
  place-items: center;
  font-size: clamp(18px, 5.4cqw, 24px);
}

.btn__label {
  display: grid;
  gap: 0.2cqw;
  line-height: 1.35;
  text-align: left;
}

.btn__label > span {
  font-weight: 600;
  font-size: clamp(17px, 5.1cqw, 23px);
}

.btn__label > small {
  font-size: clamp(12px, 3.4cqw, 15px);
  font-weight: 500;
  opacity: 0.86;
  letter-spacing: 0.03em;
}

.btn--ghost .btn__label {
  text-align: center;
}

.link-btn {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 1.6cqw;
  min-height: var(--touch);
  padding: 0 4cqw;
  background: transparent;
  color: var(--ivory);
  font-weight: 500;
  font-size: clamp(14px, 4cqw, 18px);
  line-height: 1.4;
  border-radius: 999px;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.45);
}

.link-btn:hover {
  color: #ffe7b0;
}

/* ---------- cover ---------- */
.cover {
  position: absolute;
  inset: 0;
  z-index: 5;
  color: var(--sindoor-red);
  /* ivory title panel at the top, the painted lotus showing through the middle, a deep band for the actions */
  background:
    linear-gradient(180deg, #f8efe1 0%, #f8efe1 33%, rgba(248, 239, 225, 0.94) 41%, rgba(248, 239, 225, 0) 52%),
    linear-gradient(0deg, rgba(43, 18, 20, 0.92) 0%, rgba(58, 24, 26, 0.78) 22%, rgba(58, 24, 26, 0) 40%);
  animation: cover-in 0.9s ease-out both;
}

.cover__frame {
  position: absolute;
  inset: 2.6cqw;
  border: 0.45cqw solid rgba(196, 154, 82, 0.85);
  border-radius: 2.4cqw;
  box-shadow: inset 0 0 0 1.1cqw rgba(0, 0, 0, 0), inset 0 0 0 1.4cqw rgba(120, 31, 43, 0.45);
  pointer-events: none;
}

.cover__corner {
  position: absolute;
  width: 15cqw;
  height: 15cqw;
}

.cover__corner--tl { left: -0.5cqw; top: -0.5cqw; }
.cover__corner--tr { right: -0.5cqw; top: -0.5cqw; transform: scaleX(-1); }
.cover__corner--bl { left: -0.5cqw; bottom: -0.5cqw; transform: scaleY(-1); }
.cover__corner--br { right: -0.5cqw; bottom: -0.5cqw; transform: scale(-1, -1); }

.cover__head {
  position: absolute;
  left: 6cqw;
  right: 6cqw;
  top: 7.5cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  pointer-events: none;
}

.cover__head > * {
  animation: rise-in 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
.cover__head > :nth-child(2) { animation-delay: 0.12s; }
.cover__head > :nth-child(3) { animation-delay: 0.24s; }
.cover__head > :nth-child(4) { animation-delay: 0.36s; }
.cover__head > :nth-child(5) { animation-delay: 0.44s; }
.cover__head > :nth-child(6) { animation-delay: 0.52s; }

.cover__emblem {
  width: 14cqw;
  height: 14cqw;
  filter: drop-shadow(0 0.8cqw 1.6cqw rgba(120, 31, 43, 0.3));
}

.cover__kicker {
  margin: 2.4cqw 0 0;
  font-family: var(--font-bn);
  font-weight: 500;
  font-size: 4.6cqw;
  line-height: 1.5;
  letter-spacing: 0.06em;
  color: #8f6c2a;
}

.cover__head[lang="en"] .cover__kicker {
  font-family: var(--font-en);
  font-style: italic;
  font-size: 5cqw;
}

.cover__names {
  margin: -1.4cqw 0 0;
  padding: 0.32em 0.2em; /* room for Galada's tall loops: never clipped */
  font-family: var(--font-bn-display);
  font-weight: 400;
  font-size: 14.5cqw;
  line-height: 1.25;
  white-space: nowrap;
  color: var(--sindoor-red);
  text-shadow: 0 0 2.4cqw rgba(233, 201, 126, 0.65), 0 0.3cqw 0 rgba(196, 154, 82, 0.35);
}

.cover__head[lang="en"] .cover__names {
  font-family: var(--font-en);
  font-style: italic;
  font-weight: 500;
  font-size: 15cqw;
}

.cover__rule {
  display: flex;
  align-items: center;
  gap: 2.4cqw;
  margin-top: -2.6cqw;
}

.cover__rule span {
  width: 18cqw;
  height: 0.4cqw;
  background: linear-gradient(90deg, transparent, var(--antique-gold));
}

.cover__rule span:last-child {
  background: linear-gradient(270deg, transparent, var(--antique-gold));
}

.cover__rule i {
  width: 2.4cqw;
  height: 2.4cqw;
  background: var(--sindoor-red);
  border: 0.4cqw solid var(--antique-gold);
  transform: rotate(45deg);
}

.cover__subtitle {
  margin: 2.2cqw 0 0;
  font-family: var(--font-bn);
  font-weight: 500;
  font-size: 4.8cqw;
  line-height: 1.5;
  color: var(--muted-brown);
}

.cover__head[lang="en"] .cover__subtitle {
  font-family: var(--font-en);
  font-style: italic;
  font-size: 5.4cqw;
  letter-spacing: 0.04em;
}

.cover__date {
  margin: 1.2cqw 0 0;
  padding: 0.6cqw 4cqw;
  border-top: 0.3cqw solid rgba(196, 154, 82, 0.6);
  border-bottom: 0.3cqw solid rgba(196, 154, 82, 0.6);
  font-family: var(--font-bn);
  font-weight: 600;
  font-size: 4.6cqw;
  line-height: 1.5;
  letter-spacing: 0.04em;
  color: var(--sindoor-red);
}

.cover__head[lang="en"] .cover__date {
  font-family: var(--font-en);
  font-size: 5cqw;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.cover__actions {
  position: absolute;
  left: 10cqw;
  right: 10cqw;
  bottom: max(6cqw, 14px);
  display: flex;
  flex-direction: column;
  gap: 2.6cqw;
  animation: rise-in 0.9s 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}

.cover .btn--primary {
  min-height: max(var(--touch), 16cqw);
  box-shadow: 0 1.2cqw 0 rgba(0, 0, 0, 0.25), 0 0 0 1cqw rgba(196, 154, 82, 0.18);
  animation: glow-pulse 2.8s 1.6s ease-in-out infinite;
}

.cover .btn--ghost {
  background: rgba(251, 244, 230, 0.12);
  color: #fbefd6;
  border-color: rgba(196, 154, 82, 0.9);
  backdrop-filter: none;
}

.cover .btn--ghost:hover {
  background: rgba(251, 244, 230, 0.22);
}

@keyframes cover-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes rise-in {
  from { opacity: 0; transform: translateY(3cqw); }
  to { opacity: 1; transform: none; }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 1.2cqw 0 rgba(0, 0, 0, 0.25), 0 0 0 1cqw rgba(196, 154, 82, 0.18); }
  50% { box-shadow: 0 1.2cqw 0 rgba(0, 0, 0, 0.25), 0 0 0 2.2cqw rgba(196, 154, 82, 0.08); }
}

/* ---------- language toggle ---------- */
.lang-toggle {
  position: absolute;
  pointer-events: auto;
  top: 2.4cqw;
  right: 2.8cqw;
  display: flex;
  padding: 0.7cqw;
  gap: 0.5cqw;
  border-radius: 999px;
  background: rgba(48, 37, 31, 0.78);
  border: 1px solid rgba(196, 154, 82, 0.7);
}

.lang-toggle__btn {
  min-height: max(var(--touch), 8.4cqw);
  min-width: max(var(--touch), 14cqw);
  padding: 0 3.4cqw;
  border-radius: 999px;
  background: transparent;
  color: #f5ebdd;
  font-size: clamp(14px, 3.9cqw, 17px);
  font-weight: 600;
}

.lang-toggle__btn[aria-pressed="true"] {
  background: var(--antique-gold);
  color: #2b1613;
}

/* ---------- story controls ---------- */
.controls {
  position: absolute;
  z-index: 8;
  left: 0;
  right: 0;
  bottom: max(2.4cqw, 6px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2cqw;
  padding: 0 3cqw;
  pointer-events: none;
}

.ctl {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 1.6cqw;
  min-height: max(var(--touch), 10.4cqw);
  padding: 0 4cqw;
  border-radius: 999px;
  background: rgba(48, 37, 31, 0.82);
  color: #f5ebdd;
  border: 1px solid rgba(196, 154, 82, 0.8);
  font-size: clamp(13px, 3.7cqw, 17px);
  font-weight: 600;
  white-space: nowrap;
}

.ctl:hover {
  background: rgba(78, 40, 36, 0.92);
}

.ctl--icon {
  padding: 0;
  min-width: max(var(--touch), 10.4cqw);
  justify-content: center;
}

.ctl__icon {
  flex: none;
}

.toast {
  position: absolute;
  bottom: calc(100% + 1.5cqw);
  left: 50%;
  transform: translateX(-50%);
  padding: 0 4cqw;
  border-radius: 999px;
  background: var(--ivory);
  color: var(--sindoor-red);
  font-size: clamp(13px, 3.7cqw, 17px);
  font-weight: 600;
  white-space: nowrap;
}

.toast:empty {
  display: none;
}

/* tall screens: the toggle and the controls sit in the bands above and below the picture, clear of the art */
[data-hud="bands"] .lang-toggle {
  top: calc(var(--band-y) / -2);
  transform: translateY(-50%);
}

[data-hud="bands"] .controls {
  bottom: calc(var(--band-y) / -2);
  transform: translateY(50%);
}

/* over the picture, the toggle stands where the cover's top flourishes would be */
[data-hud="inside"] .cover__corner--tl,
[data-hud="inside"] .cover__corner--tr {
  visibility: hidden;
}

/* wide screens (landscape, desktop): beside the picture, top and bottom right */
[data-hud="side"] .lang-toggle {
  top: 0;
  right: auto;
  left: calc(100% + 20px);
}

[data-hud="side"] .controls {
  left: calc(100% + 20px);
  right: auto;
  bottom: 0;
  flex-direction: column;
  align-items: flex-start;
  padding: 0;
}

[data-hud="side"] .toast {
  left: 0;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .cover,
  .cover__head > *,
  .cover__actions,
  .cover .btn--primary {
    animation: none;
  }
  .btn,
  .ctl,
  .lang-toggle__btn,
  .link-btn {
    transition: none;
  }
  .btn:hover,
  .btn:active,
  .ctl:active {
    transform: none;
  }
}

```

### 4.5 HUD modes and rotate hint
- `bands` (tall screens): toggle in the band above the frame, controls in the band below.
- `inside` (short portrait e.g. 375x667): both overlay the picture; cover top corner flourishes hidden so they do not collide with the toggle.
- `side` (landscape/desktop): toggle outside at the frame's top-right (`left: calc(100% + 20px)`), controls stacked in a column at the bottom beside the frame.
- Rotate hint (`tx.rotateHint`) is `display:none` except under `@media (orientation: landscape) and (max-height: 560px) and (pointer: coarse)` with `data-hud="side"`: shown left of the frame, right-aligned.
- Desktop (min-width 700 and min-height 640): frame gets 22px radius, gold ring, deep shadow.
- `.stage`: `position:fixed; inset:0`, safe-area padding via `env(safe-area-inset-*)`, radial surround from `--surround-*`; body `overflow:hidden; overscroll-behavior:none`.

### 4.6 Accessibility
`<main class="frame" aria-label=storyLabel>`; `.sr-only` aria-live scene announcer; ARIA labels on mute, hotspots (aria-label = the hint), map link (`mapAria`), toolbar (`controlsLabel`), language group, boot `role=progressbar` with `aria-valuenow`; focus ring `--ring` via `:focus-visible` on all shell buttons; touch targets >= 44px; `[lang]` per text run; `html lang` follows language; `font-synthesis:none`; decorations `aria-hidden`. Skip is always one tap away; sound never required, never autoplays. Boxes clipping Bengali text use `BN_PAD`.

---------------------------------------------------------------------------------------------------

## 5. Hotspots (guided mode) and map link


**src/remotion/components/GuidedHotspot.tsx**

```tsx
import type { SyntheticEvent } from "react";
import { FONT_BN_UI, FONT_EN } from "../fonts";
import { useExperience } from "../experience";

interface Props {
  x: number;
  y: number;
  size?: number;
  label: string;
  ariaLabel: string;
  /** Where the visible text hint sits relative to the ring. */
  labelPosition?: "above" | "below";
  onActivate: (e: SyntheticEvent) => void;
}

const CSS = `
@keyframes hs-pulse { 0% { transform: scale(.72); opacity: .95 } 100% { transform: scale(1.18); opacity: 0 } }
.hs-ring { animation: hs-pulse 2.2s ease-out infinite }
.hs-btn:focus-visible { outline: 6px solid #f8ecd2; outline-offset: 6px }
.hs-btn:hover .hs-core { background: rgba(255,244,214,.34) }
@media (prefers-reduced-motion: reduce) { .hs-ring { animation: none; opacity: .6 } }
`;

/**
 * A real, keyboard-focusable button placed in composition space (1080×1920) so it stays glued to the artwork.
 * A visible text hint (not just a pulse) says what it does.
 */
export const GuidedHotspot = ({
  x,
  y,
  size = 330,
  label,
  ariaLabel,
  labelPosition = "below",
  onActivate,
}: Props) => {
  const { lang } = useExperience();
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        pointerEvents: "auto",
      }}
    >
      <style>{CSS}</style>
      <button
        type="button"
        className="hs-btn"
        aria-label={ariaLabel}
        onClick={onActivate}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span
          className="hs-ring"
          style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "5px solid #c49a52" }}
        />
        <span
          className="hs-core"
          style={{
            position: "absolute",
            inset: size * 0.22,
            borderRadius: "50%",
            border: "4px solid #f8ecd2",
            background: "rgba(255,244,214,.18)",
            boxShadow: "0 0 0 3px rgba(120,31,43,.55)",
          }}
        />
      </button>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          [labelPosition === "below" ? "top" : "bottom"]: size + 6,
          padding: "14px 34px",
          borderRadius: 60,
          background: "rgba(251,244,230,.96)",
          border: "3px solid #c49a52",
          color: "#781f2b",
          fontFamily: lang === "bn" ? FONT_BN_UI : FONT_EN,
          fontWeight: 600,
          fontSize: lang === "bn" ? 40 : 44,
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        {label}
      </span>
    </div>
  );
};

```

Behaviour: one real `<button>` in composition space (1080x1920) centred at (x,y), with a pulsing gold ring (`hs-pulse` 2.2 s), an inner core, and a visible text hint pill (above or below the ring; Anek Bangla UI 40px bn / Cormorant 44px en, weight 600, `#781f2b` on `rgba(251,244,230,.96)`, 3px `#c49a52` border). The wrapper has `pointer-events:auto`; the pill is `pointer-events:none` and `aria-hidden`. Only the hotspot for the scene currently `awaiting` renders, and only when `interactive`:

| awaiting | position (x,y) | size | label key | labelPosition | activates |
|---|---|---|---|---|---|
| awakening | HOTSPOTS.lotus (540, 1010) | 330 (default) | hintLotus | below | awakening |
| meeting | HOTSPOTS.path (478, 1560) | 300 | hintPath | above | meeting |
| wedding | MANDAP.hotspot (540, 510) | 340 | hintMandap | above | wedding |
| invitation | ORNAMENT_POS (540, 1545) | 300 | hintOrnament | below | invitation |

(Sources: `layout.ts` HOTSPOTS/ORNAMENT_POS; `FloralMandap.tsx` MANDAP.hotspot; each scene renders it with `onActivate={(e)=>guided.onActivate?.(target, e)}`.) Guided mode shows a lotus bud from the first frame (`guided.enabled` -> lotus opacity 1; visual/story). The shell re-checks `phase==="awaiting" && awaiting===target` on activation. Guided mode pauses on each scene's final frame (`SCENES[x].end - 1`); taps cannot skip or repeat scenes. After the invitation scene ends (ENDED) the phase is finished and the card is interactive.

Map link: see 2.1.

---------------------------------------------------------------------------------------------------

## 6. Scripts
Common: Chrome discovery in `scripts/chrome.mjs`.

**scripts/chrome.mjs**

```js
// Finds a headless Chrome for the art baker, stills and profiler: CHROME_PATH, else Remotion's cached headless shell.
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

export const findChrome = (root) => {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = path.join(root, "node_modules", ".remotion", "chrome-headless-shell");
  const walk = (dir, depth) => {
    if (depth < 0 || !existsSync(dir)) return null;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isFile() && /^chrome-headless-shell(\.exe)?$/.test(entry.name)) return p;
      if (entry.isDirectory()) {
        const found = walk(p, depth - 1);
        if (found) return found;
      }
    }
    return null;
  };
  const found = walk(base, 4);
  if (found) return found;
  const system = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].find((p) => existsSync(p));
  if (system) return system;
  throw new Error("No Chrome found. Run `npx remotion compositions src/remotion/index.ts` once or set CHROME_PATH.");
};

```

### 6.1 stills.mjs — `node scripts/stills.mjs <frames…> [--lang=bn|en] [--dir=out/stills] [--props='{json}'] [--scale=1]`
Bundles `src/remotion/index.ts` (publicDir `public`), `selectComposition("DeepAndTitasWedding", {lang,...props})`, `renderStill` per frame to `out/stills/<lang>-<4-digit frame>.png`. `npm run stills` = frames `0 300 478 840 1138 1400 1540 1750 1960 2098 2200 2999`. Falls back to Remotion's own browser if no Chrome found.

**scripts/stills.mjs**

```js
// Dev helper: render a set of stills to out/stills for visual review.
// Usage: node scripts/stills.mjs 0 300 478 ...   [--lang=en] [--dir=out/stills] [--props='{"reducedMotion":true}']
// Frames are 60 FPS frames (beat × 2). Key frames: 0 300 478 840 1138 1640 1920 2098 2200 2999.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findChrome } from "./chrome.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const frames = args.filter((a) => /^\d+$/.test(a)).map(Number);
const opt = (name, fallback) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=") ?? fallback;
const lang = opt("lang", "bn");
const dir = path.resolve(root, opt("dir", "out/stills"));
const extra = opt("props", "");
const scale = Number(opt("scale", "1"));
mkdirSync(dir, { recursive: true });

let browserExecutable = null;
try {
  browserExecutable = findChrome(root);
} catch {
  // let Remotion download its own headless shell
}

const serveUrl = await bundle({ entryPoint: path.join(root, "src/remotion/index.ts"), publicDir: path.join(root, "public") });
const inputProps = { lang, ...(extra ? JSON.parse(extra) : {}) };
const composition = await selectComposition({ serveUrl, id: "DeepAndTitasWedding", inputProps, browserExecutable });
for (const frame of frames) {
  const output = path.join(dir, `${lang}-${String(frame).padStart(4, "0")}.png`);
  await renderStill({ composition, serveUrl, frame, output, inputProps, browserExecutable, scale });
  console.log("rendered", output);
}

```

### 6.2 og-image.mjs — `npm run og` (writes `public/og-image.jpg`, 1200x630, JPEG q90)
Renders frame 2999 (bn) to `out/og/card.png`, composes an HTML page in headless Chrome (playwright-core) with the self-hosted fonts and `public/images/paper.webp`: paper background, gold frame, dark-red panel at right (440 wide) with the card crop (the 940x1600 region of the frame at x=70,y=160 scaled to 534px tall), and at left the kicker "সাদর আমন্ত্রণ", names "দীপ ও তিতাস", "Deep & Titas", dates for শুভবিবাহ ২৫শে নভেম্বর ২০২৬ and প্রীতিভোজ ২৭শে নভেম্বর ২০২৬, and "Wedding 25 Nov · Reception 27 Nov 2026 · Kolkata". Re-run after changing wedding details.

**scripts/og-image.mjs**

```js
// Generates the static Open Graph / Twitter preview image (public/og-image.jpg, 1200×630) from the real final card.
// Usage: node scripts/og-image.mjs
// It renders the last frame (2999) of the composition (the finished invitation) with Remotion, then lays it out next to the names and
// dates in headless Chrome using the same self-hosted fonts as the site.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { findChrome } from "./chrome.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const work = path.join(root, "out", "og");
mkdirSync(work, { recursive: true });

// 1. the finished card, straight from the composition
const serveUrl = await bundle({ entryPoint: path.join(root, "src/remotion/index.ts"), publicDir: path.join(root, "public") });
const inputProps = { lang: "bn" };
const browserExecutable = findChrome(root);
const composition = await selectComposition({ serveUrl, id: "DeepAndTitasWedding", inputProps, browserExecutable });
const cardPng = path.join(work, "card.png");
await renderStill({ composition, serveUrl, frame: 2999, output: cardPng, inputProps, scale: 1, browserExecutable });

// 2. compose
const fonts = (p) => pathToFileURL(path.join(root, "node_modules", p.startsWith("anek") ? "@fontsource-variable" : "@fontsource", p)).href;
const html = `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="${fonts("anek-bangla/wght.css")}">
<link rel="stylesheet" href="${fonts("galada/bengali-400.css")}">
<link rel="stylesheet" href="${fonts("cormorant-garamond/latin-400.css")}">
<link rel="stylesheet" href="${fonts("cormorant-garamond/latin-400-italic.css")}">
<link rel="stylesheet" href="${fonts("cormorant-garamond/latin-600.css")}">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;overflow:hidden;position:relative;background:#f5ebdd;color:#30251f;font-family:"Anek Bangla Variable",serif}
  .paper{position:absolute;inset:0;background:url("${pathToFileURL(path.join(root, "public/images/paper.webp")).href}") center/cover}
  .frame{position:absolute;inset:22px;border:2px solid #c49a52;border-radius:6px}
  .frame::after{content:"";position:absolute;inset:8px;border:1px solid rgba(120,31,43,.55);border-radius:3px}
  .panel{position:absolute;right:0;top:0;bottom:0;width:440px;background:radial-gradient(circle at 50% 30%,#62262d 0%,#3b1b1c 60%,#26110f 100%)}
  .card{position:absolute;right:62px;top:48px;height:534px;border-radius:12px;box-shadow:0 18px 40px rgba(0,0,0,.5)}
  .text{position:absolute;left:84px;top:0;bottom:0;width:640px;display:flex;flex-direction:column;justify-content:center}
  .kicker{font-size:30px;color:#781f2b;letter-spacing:.03em}
  .rule{display:flex;align-items:center;gap:12px;margin:10px 0 26px;width:300px}
  .rule i{flex:1;height:2px;background:linear-gradient(90deg,#c49a52,transparent)}
  .rule b{width:12px;height:12px;background:#781f2b;transform:rotate(45deg)}
  .names{font-family:"Galada","Anek Bangla Variable",serif;font-size:118px;line-height:1.2;color:#781f2b}
  .en{font-family:"Cormorant Garamond",serif;font-style:italic;font-size:54px;color:#781f2b;margin-top:-4px}
  .dates{margin-top:26px;font-size:30px;line-height:1.55;color:#30251f}
  .dates span{color:#8f6c2a;font-family:"Anek Bangla Variable",sans-serif;font-weight:600;font-size:24px;margin-right:10px}
  .dates-en{margin-top:8px;font-family:"Cormorant Garamond",serif;font-size:27px;color:#665343;letter-spacing:.02em}
</style>
<div class="paper"></div><div class="frame"></div><div class="panel"></div>
<div class="text">
  <div class="kicker">সাদর আমন্ত্রণ</div>
  <div class="rule"><i></i><b></b></div>
  <div class="names">দীপ ও তিতাস</div>
  <div class="en">Deep &amp; Titas</div>
  <div class="dates"><span>শুভবিবাহ</span>২৫শে নভেম্বর ২০২৬<br><span>প্রীতিভোজ</span>২৭শে নভেম্বর ২০২৬</div>
  <div class="dates-en">Wedding 25 Nov · Reception 27 Nov 2026 · Kolkata</div>
</div>
<div class="card" style="width:${Math.round((940 * 534) / 1600)}px;overflow:hidden;background:#fbf4e6">
  <img src="${pathToFileURL(cardPng).href}" style="width:${Math.round(1080 * (534 / 1600))}px;margin-left:-${Math.round(70 * (534 / 1600))}px;margin-top:-${Math.round(160 * (534 / 1600))}px;display:block">
</div>
`;
// (the card is the 940×1600 region of the 1080×1920 frame, scaled to 534 px tall)
const doc = html;
const htmlPath = path.join(work, "og.html");
writeFileSync(htmlPath, doc);

const browser = await chromium.launch({ executablePath: browserExecutable, headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(htmlPath).href);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(root, "public", "og-image.jpg"), type: "jpeg", quality: 90 });
await browser.close();
console.log("wrote public/og-image.jpg");

```

### 6.3 profile.mjs — `npm run profile` / `node scripts/profile.mjs [--throttle=4] [--no-build] [--width=390 --height=844 --dpr=3]`
Builds (unless `--no-build`), serves `dist/` locally (`?debug` URL), launches headless Chrome (GPU flags, autoplay allowed), mobile touch context, waits for `window.__weddingPlayer.current`, applies CDP CPU throttling (default 4x; verify at `--throttle=2`), logs rAF timestamps against `getCurrentFrame()`, counts composited layers via `LayerTree.layerTreeDidChange`, taps `.cover .btn--primary`, samples Performance metrics every 500 ms until `__weddingState.current.phase === "finished"` or 180 s, then prints a table per scene (boundaries parsed from timeline.ts): fps, p95 ms, long frames (>25 ms), player frames vs expected, script/style/layout/busy share, max layers, layer churn. Targets: about 60 fps per scene at 2x throttle, <= about 70 layers, zero churn. Depends on the `.cover .btn--primary` selector and the `?debug` hooks.

**scripts/profile.mjs**

```js
// Plays the built site in headless Chrome as a throttled phone and reports frame rate per scene.
// Usage: npm run profile            (builds first)
//        node scripts/profile.mjs [--throttle=4] [--no-build] [--width=390 --height=844 --dpr=3]
// Target: ≈60 fps in every scene at 2× CPU throttling, ≤ ~70 layers per scene and no layer churn. Headless Chrome may composite in software, so treat the
// numbers as a relative benchmark between changes, not as an absolute device measurement.
import { chromium } from "playwright-core";
import { execSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findChrome } from "./chrome.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name, fallback) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;
const throttle = Number(opt("throttle", "4"));
const width = Number(opt("width", "390"));
const height = Number(opt("height", "844"));
const dpr = Number(opt("dpr", "3"));

if (!args.includes("--no-build")) execSync("npm run build", { cwd: root, stdio: "inherit" });

const dist = path.join(root, "dist");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".svg": "image/svg+xml", ".jpg": "image/jpeg" };
const server = createServer((req, res) => {
  let file = path.join(dist, decodeURIComponent((req.url ?? "/").split("?")[0]));
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!file.startsWith(dist) || !existsSync(file)) {
    res.statusCode = 404;
    res.end();
    return;
  }
  const body = readFileSync(file);
  res.setHeader("content-type", TYPES[path.extname(file)] ?? "application/octet-stream");
  res.setHeader("content-length", body.length);
  res.end(body);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/?debug`;

const browser = await chromium.launch({
  executablePath: findChrome(root),
  headless: true,
  args: ["--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--autoplay-policy=no-user-gesture-required"],
});
const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await page.goto(url);
await page.waitForFunction(() => window.__weddingPlayer?.current, null, { timeout: 60000 });
await page.waitForTimeout(800);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });

// record every animation frame with the Player's current frame
await page.evaluate(() => {
  const log = [];
  window.__frameLog = log;
  const tick = (t) => {
    log.push([t, window.__weddingPlayer.current?.getCurrentFrame() ?? -1]);
    if (!window.__frameDone) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
await cdp.send("Performance.enable");
// composited layers: phones drop GPU tiles (parts of the picture blink out) when there are too many, or when layers
// are created and destroyed while playing
let layerCount = 0;
cdp.on("LayerTree.layerTreeDidChange", (e) => {
  if (e.layers) layerCount = e.layers.filter((l) => l.drawsContent && !l.invisible).length;
});
await cdp.send("LayerTree.enable");
await page.tap(".cover .btn--primary");
const started = Date.now();
// sample main-thread time (script / style / layout) every half second, attributed to the scene being played
const samples = [];
for (;;) {
  const [{ metrics }, state] = await Promise.all([
    cdp.send("Performance.getMetrics"),
    page.evaluate(() => [window.__weddingPlayer.current?.getCurrentFrame() ?? 0, window.__weddingState?.current?.phase]),
  ]);
  const m = Object.fromEntries(metrics.map((x) => [x.name, x.value]));
  samples.push({ t: Date.now(), frame: state[0], layers: layerCount, script: m.ScriptDuration, style: m.RecalcStyleDuration, layout: m.LayoutDuration, task: m.TaskDuration });
  if (state[1] === "finished" || Date.now() - started > 180000) break;
  await new Promise((r) => setTimeout(r, 500));
}
const wall = (Date.now() - started) / 1000;
const log = await page.evaluate(() => {
  window.__frameDone = true;
  return window.__frameLog;
});
await browser.close();
server.close();

// scene boundaries in frames, read from the timeline (beats × frames-per-beat) so this script never drifts from it
const timeline = readFileSync(path.join(root, "src", "config", "timeline.ts"), "utf8");
const fpb = Number(/export const FPS = (\d+)/.exec(timeline)[1]) / Number(/export const BEAT_FPS = (\d+)/.exec(timeline)[1]);
const SCENES = Object.fromEntries(
  [...timeline.matchAll(/(\w+): \{ start: (\d+), end: (\d+) \}/g)].map(([, id, a, b]) => [id, { start: +a * fpb, end: +b * fpb }]),
);

const rows = [];
for (const [id, s] of Object.entries(SCENES)) {
  const frames = log.filter(([, f]) => f >= s.start && f < s.end);
  if (frames.length < 3) continue;
  const dts = [];
  for (let i = 1; i < frames.length; i++) dts.push(frames[i][0] - frames[i - 1][0]);
  dts.sort((a, b) => a - b);
  const avg = dts.reduce((a, b) => a + b, 0) / dts.length;
  const p95 = dts[Math.floor(dts.length * 0.95)];
  const dropped = dts.filter((d) => d > 25).length;
  const advanced = frames[frames.length - 1][1] - frames[0][1];
  // main-thread share of wall time while this scene played (CPU throttling inflates these proportionally)
  const ss = samples.filter((x, i) => i > 0 && x.frame >= s.start && x.frame < s.end);
  const share = (k) => {
    let busy = 0;
    let span = 0;
    for (const x of ss) {
      const prev = samples[samples.indexOf(x) - 1];
      busy += x[k] - prev[k];
      span += (x.t - prev.t) / 1000;
    }
    return span > 0 ? `${Math.round((busy / span) * 100)}%` : "-";
  };
  // layer churn: how often the layer count changed after the scene's first second (target 0)
  const settled = ss.filter((x) => x.frame >= s.start + 60);
  const churn = settled.filter((x, i) => i > 0 && x.layers !== settled[i - 1].layers).length;
  const maxLayers = Math.max(0, ...ss.map((x) => x.layers));
  rows.push({ scene: id, fps: +(1000 / avg).toFixed(1), "p95 ms": +p95.toFixed(1), "long frames": dropped, "player frames": advanced, expected: s.end - s.start, script: share("script"), style: share("style"), layout: share("layout"), busy: share("task"), layers: maxLayers, "layer churn": churn });
}
console.log(`\n${width}×${height} @${dpr}x, CPU throttle ${throttle}×, wall ${wall.toFixed(1)} s (story is 50 s)`);
console.table(rows);

```

---------------------------------------------------------------------------------------------------

## 7. Tests (to port; Vitest, node environment, `tests/*.test.ts`)

**storyMachine.test.ts**: initial state is intro/mode null; cinematic: START_CINEMATIC -> playing/cinematic/awakening, SCENE meeting then wedding sets step wedding, ENDED -> finished/invitation; cinematic ignores BOUNDARY (same object); guided walks lotus->path->mandap->ornament via ACTIVATE then BOUNDARY (each ACTIVATE -> `{playing, step, awaiting:null}`), final BOUNDARY -> finished; pauses at each boundary offering exactly the next scene; taps cannot skip ahead (ACTIVATE wedding/invitation at start ignored, same object) nor repeat while playing; stale BOUNDARY for another scene ignored; SKIP from intro/cinematic/guided -> `{finished, step invitation, awaiting null}`; REPLAY from finished -> playing/cinematic/awakening; ENDED on intro returns the same object; SCENE ignored unless playing; in guided playing, SCENE meeting leaves state unchanged (same object) and BOUNDARY awakening -> awaiting meeting.

**translations.test.ts**: bn and en have identical key sets; no empty strings; bn copy exact (title "দীপ ও তিতাস", opening "শুভ সূচনা", meeting "দুটি পথ, একটি গল্প", wedding "শুভ পরিণয়", invitation "সাদর আমন্ত্রণ", invitationMessage "আমাদের জীবনের এই শুভ মুহূর্তে আপনাদের সাদর আমন্ত্রণ।", location "স্থান দেখুন", subtitle "একটি নতুন গল্পের শুরু"); en opening "An Auspicious Beginning", location "View Location"; `t("bn") === translations.bn`, `otherLang` swaps.

**dates.test.ts**: `formatDate("2026-11-25","en")` = `{weekday:"Wednesday", day:"25 November 2026"}`; 2026-11-27 en Friday `27 November 2026`; bn `{weekday:"বুধবার", day:"২৫শে নভেম্বর ২০২৬"}` and `{weekday:"শুক্রবার", day:"২৭শে নভেম্বর ২০২৬"}`; null for `""`, `"25-11-2026"`, `"2026-02-30"`, `"2026-13-01"`; `bengaliDay` for [1,2,3,4,5,10,18,19,25,27,31] = ["১লা","২রা","৩রা","৪ঠা","৫ই","১০ই","১৮ই","১৯শে","২৫শে","২৭শে","৩১শে"]; `toBengaliDigits("0123456789")="০১২৩৪৫৬৭৮৯"`.

**wedding.test.ts**: groom `{en:"Deep",bn:"দীপ"}`, bride `{en:"Titas",bn:"তিতাস"}`; `mapUrl === "https://maps.app.goo.gl/BGgvu48u6NbyY9xN8?g_st=aw"` and protocol https; event dates 2026-11-25 / 2026-11-27 and `visibleEvents()` = ["wedding","reception"]; venue name/note/address/landmark exactly as 2.1 (spelling "Bagala"); bengaliDate and time `{bn:"সন্ধ্যায়", en:"Evening"}`; `visibleEvents({events})` hides blank/whitespace dates; `hasValue("   ")=false`, `hasValue("a")=true`.

**preload.test.ts**: `weightedProgress` with a(100) b(300) music(600): empty map 0; a done 0.1; b done + music 0.5 -> 0.6; all done 1; value 7 clamped (0.1); empty list -> 1.

**stage.test.ts**: for rooms [390,844],[375,667],[844,390],[1920,1080],[280,653]: width <= w, height <= h+0.01, height/width about 16/9, scale about width/1080; with room fixed {390,664}, stage height 664 vs 750 gives the same width and hud (and room {412,839}: stage 839 vs 915 same hud); hud: 390x844 bands, 375x667 inside, 844x390 side, 1920x1080 side.

(Timeline, rig and sprites tests belong to story/visual: timeline contiguity and beats within scenes; `tests/sprites.test.ts` sprite `box` contains sprites.)

## 8. Cross-cutting rules the shell must honour (AGENTS.md)
Frame-driven only inside the composition (the shell may use timers/React); no `import.meta.env` inside `src/remotion/` (pass via inputProps); asset URLs through `asset()`; never fabricate wedding details; Bengali default; "Watch the story" always primary; audio optional and gesture-started, a missing track degrades silently; keep React shell state separate from frame-driven state and never re-render the shell per frame; composition root click-through, only hotspots/map link opt in; guided boundary checks `>=` before scene updates; never mount/unmount or reorder DOM mid-scene; no Remotion `<Img>` in the website tree (`<ArtGate>` renders only); one CSS transform scales the Player; frame fitted to `svh`.

## 9. Not pinned down
- `src/remotion/lib/images.ts` (`artImage`), the `art-manifest.ts` shape (`ART[name] = {src, bytes, ...}`) and `layout.ts` are spec-visual's; the shell only needs `ART` keys with `src` and `bytes`.
- Content of `public/favicon.svg` and the bytes of `og-image.jpg` (regenerated by `npm run og`) were not captured.
- `tests/timeline.test.ts` details belong to story.md.
