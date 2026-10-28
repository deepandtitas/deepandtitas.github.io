# দীপ ও তিতাস — শুভ পরিণয় · Deep & Titas Wedding Invitation

An interactive Bengali wedding invitation. A hand-drawn story — an alpana and lotus awakening, two paths meeting
in a garden, the wedding under a floral canopy — plays inside a 9:16 "mobile wedding film" and settles into a
premium, bilingual (বাংলা / English) invitation card with a **স্থান দেখুন** map button.

Built with **React + TypeScript + Vite** and **[Remotion](https://www.remotion.dev)** as the animation engine
(`@remotion/player` in the website, Remotion Studio / CLI for the video).

- **Watch the story** — cinematic playback of all four scenes, ending on the card.
- **Explore the story** — guided mode: tap the lotus → the glowing path → the floral canopy → the golden ornament.
- **Skip to the invitation** at any time. The card is fully usable even if the animation is never watched.

---

## Quick start

Requires Node 20+ (developed on Node 24) and npm.

```bash
npm install
npm run dev        # website → http://localhost:5173
npm run studio     # Remotion Studio, composition "DeepAndTitasWedding"
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server for the website |
| `npm run build` | Type-check and build the production site to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run studio` | Open Remotion Studio (1080×1920, 30 FPS, 1500 frames) |
| `npm run render` | Render the whole story to `out/deep-and-titas.mp4` |
| `npm run still` | Render the final invitation frame (1499) to `out/invitation.png` |
| `npm test` | Unit tests (timeline, translations, wedding config, story state machine) |
| `npm run typecheck` · `npm run lint` | TypeScript and ESLint |
| `node scripts/stills.mjs 0 150 569 …` | Render chosen frames to `out/stills/` for visual review (`--lang=en` for English) |
| `node scripts/generate-art.mjs` | Regenerate the painted garden / paper SVG layers in `public/images/` |

---

## Where to change things

### 1. Wedding details — `src/config/wedding.ts`

Filled in from the printed reception invitation (the source of truth), with spellings kept exactly as printed:

| Field | Value |
| --- | --- |
| শুভবিবাহ / Wedding | ৮ই অগ্রহায়ণ ১৪৩৩ · 25 November 2026 · Wednesday evening (বুধবার সন্ধ্যায়) |
| প্রীতিভোজ / Reception | ১০ই অগ্রহায়ণ ১৪৩৩ · 27 November 2026 · Friday evening (শুক্রবার সন্ধ্যায়) |
| Venue | স্থপতি / **Sthapati** (শম্ভু ঘোষের বাড়ি / House of Sambhu Ghosh) |
| Address | `15, Raja Shew Box Bagala Lane, Kolkata-700002` · ১৫, রাজা শিউ বক্স বগলা লেন, কলকাতা-২ |
| Landmark | Tala Post Office / টালা পোস্টঅফিস |
| Map pin | 22.60760907969931, 88.37628348848713 |

Dates are ISO strings rendered by `src/config/dates.ts` (Bengali digits, ordinals like ২৫শে, weekday). Every text field is
`{ bn, en }`. Anything you leave blank is simply not shown — there are no placeholders anywhere.

The **স্থান দেখুন / View Location** button opens
`https://www.google.com/maps?q=22.60760907969931,88.37628348848713` in a new tab (`rel="noopener noreferrer"`).
The coordinates are never rounded; a unit test guards the exact URL. The pin is in the Tala neighbourhood (about 260 m from
Tala station), consistent with the card's landmark, but it should be confirmed against the actual venue gate.

### 2. Wording — `src/config/translations.ts`

Every visible string (scene titles, buttons, labels, aria-labels, the invitation message) lives here in `bn` and `en`.
A test enforces that both languages have the same keys and no empty strings. Bengali is the default.
Switching language changes only the text — the story keeps playing from the same frame, and the soundtrack is not restarted.

### 3. Scene timings — `src/config/timeline.ts`

`SCENES` (start/end frames) and `BEATS` (when each thing happens inside a scene, in frames relative to the scene start)
are the single source of truth. The composition, the Player, the guided checkpoints, the skip target and the
soundtrack envelope all derive from them. 1500 frames at 30 FPS = 50 s; the last frame index is **1499**.

- To retime *within* a scene, edit its `BEATS`.
- To change scene lengths, edit `SCENES` (keep them contiguous — a test checks this). Everything downstream follows;
  re-check the beats still fit inside the scene (also tested) and the soundtrack envelope in `src/remotion/Soundtrack.tsx`.

### 4. Replacing the bride and groom illustrations

Deep and Titas are drawn in exactly one place so they stay identical in every scene:
**`src/remotion/components/WeddingCouple.tsx`** — `<Groom/>` and `<Bride/>` (+ the shared `Face`, `Topor`, `Mukut`).

- **Tweak the look:** edit colours (`SAREE`, `GOLD`, `SKIN`, …) or shapes there; every scene updates.
- **Swap in commissioned artwork:** replace the *body* of `Groom`/`Bride` with your layered PNG/WebP/SVG
  (keep the props: `x`, `y`, `scale`, `turn`, `pose`, `garlandHeld`, `garlandWorn`, `headTilt`, `leavesLowered`).
  Put images in `public/images/` and load them with Remotion's `<Img src={useAsset()("images/deep.png")} />`
  so they also work under a sub-path. Use the **same character art in every scene** — the scenes only call
  `<Groom/>` / `<Bride/>`, so nothing else needs to change.
- **Garden / paper layers:** `public/images/*.svg` (listed in `src/config/assets.ts`). Replace the files with your own
  1200×1920 (garden) or 1080×1920 (paper) images, or tweak and re-run `node scripts/generate-art.mjs`.

> The artwork here is original, procedurally drawn SVG. No real likenesses are used. If you have an illustrator,
> the character rig and the garden layers are the pieces to replace.

### 5. Soundtrack — `public/audio/soundtrack.mp3`

The music is the track supplied by the couple, cut to its first 50 seconds (a soft ~10 s intro, then the steady main
section, ending where the original dips) with a short fade-in and a 2.5 s fade-out, re-encoded at 160 kbps (~1 MB) so
it matches the 50-second film and loads quickly on phones. It is faded in/out and swells through the wedding scene
automatically (`src/remotion/Soundtrack.tsx`). Details are in `public/audio/README.txt`.

To use another track, replace `soundtrack.mp3` (~50 s) with something you have the rights to, and restart `npm run dev`
(its presence is detected when the server starts).

- Sound starts only after a guest taps a button (browser autoplay rules). The mute / unmute control appears when a track exists.
- If the file is removed, playback is simply silent — nothing breaks.
- `npm run render` includes the track automatically.

### 6. Deploy — https://deepandtitas.github.io/

This is a GitHub **user site**: the repository is `deepandtitas/deepandtitas.github.io` and the site is served from the
**root** (`https://deepandtitas.github.io/`, not a `/repo-name/` sub-path), so no `BASE_PATH` is needed.

1. Push to `main` — `.github/workflows/deploy.yml` type-checks, tests, builds and deploys `dist/`.
2. One-time setting: repository **Settings → Pages → Build and deployment → Source: GitHub Actions**.

```bash
npm run build && npm run preview   # check the production build locally
```

Any other root domain (Vercel / Netlify): `npm run build` and publish `dist/`. Only if you ever host under a sub-path, build with
`BASE_PATH=/that-path/`.

---

## How it works

```
src/
  config/     timeline.ts · wedding.ts · translations.ts · assets.ts      ← edit these
  remotion/   Root.tsx · index.ts · WeddingComposition.tsx · Soundtrack.tsx · FontGate.tsx
    scenes/   AwakeningScene · MeetingScene · WeddingScene · InvitationScene
    components/  Alpana · Lotus · WeddingCouple · FloralMandap · Diya · FloatingPetals · GoldDust
                 · GardenStage · InvitationCard · Emblem · GuidedHotspot · RevealText · SceneHeading …
  app/        the website shell: ExperienceShell · IntroScreen · StoryControls · LanguageToggle
    state/    storyMachine.ts  (pure reducer — guided order, skip, replay; unit-tested)
    hooks/    usePlayerEvents · useStoryMachine · useReducedMotion
  styles/     tokens.css · global.css · experience.css
public/       images/ (painted layers) · audio/ (soundtrack goes here)
```

- **Frame-driven animation.** Everything in `src/remotion/` derives from `useCurrentFrame()` with `interpolate()` /
  `spring()`. No timers, so any frame renders identically every time (the same code produces the MP4).
- **Scenes cross over by matching geometry.** The alpana curve that ends scene 1 *is* the garden path of scene 2
  (`lib/path.ts`); the flowers that gather in scene 2 are the arch of scene 3's canopy; the petal that ends scene 3
  lands on the gold ornament that opens the card. Because they share constants, transitions stay continuous
  whether the story plays straight through or is paused and resumed in guided mode.
- **Website state is separate from animation state.** The shell holds a small reducer; the Player's `frameupdate`
  handler does work only at scene boundaries, so React is not re-rendered per frame.
- **Guided mode** pauses on each scene's final frame (`SCENES[x].end - 1`) and offers exactly one real `<button>`
  hotspot placed in composition space; taps cannot skip scenes.
- **The invitation card is part of the composition**, so it is identical in the Player and in MP4 renders, scales
  with the frame, and stays interactive after playback ends (the Player never resets: `moveToBeginningWhenEnded={false}`).

### Accessibility and responsiveness

- Strict 9:16 frame (`width = min(100vw, 100dvh × 9/16)`), centred on desktop with a warm surround; safe-area insets respected; no horizontal overflow.
- Real buttons/links, visible focus rings, ≥44 px touch targets, ARIA labels, an `aria-live` scene announcer.
- `prefers-reduced-motion`: no petals/dust/parallax, characters fade instead of walking, the card fades in, and
  **"আমন্ত্রণে যান / Skip to Invitation"** becomes the primary action.
- Skip-to-invitation is always available; sound is never required and never autoplays.

---

## Testing

```bash
npm test            # unit tests: timeline, translations, dates, wedding config, story state machine
npm run typecheck && npm run lint && npm run build
npx remotion compositions src/remotion/index.ts     # → DeepAndTitasWedding 30 1080x1920 1500 frames
```

---

## What can still be added

1. **Host / family names and phone numbers** from the printed card are deliberately *not* on the public page — say if you want them added.
2. **Optional:** professionally illustrated character art to replace the procedural SVG rig (see *Replacing the illustrations*).
3. Review the Bengali wording in `src/config/translations.ts` once more with family.

## Cultural notes

The wedding scene follows the Bengali order — **শুভদৃষ্টি** (the bride arrives carrying two betel leaves, veils her face with them, then opens them aside and sets them down as the couple's eyes meet) and then **মালাবদল** (exchange of marigold garlands) — beneath a floral canopy with alpana, diyas and
banana-leaf corners. Rituals that could not be depicted with confidence (the sacred fire, sindoor-daan) are deliberately
left out rather than shown incorrectly.

## Licensing

Remotion is free for individuals and small teams and requires a company license for larger commercial use — see
<https://www.remotion.pro>. The Player is configured with `acknowledgeRemotionLicense`; remove that prop if your
use is not covered. Fonts (Noto Serif Bengali, Cormorant Garamond) are SIL OFL, self-hosted via `@fontsource`.
All artwork in this repository is original.
