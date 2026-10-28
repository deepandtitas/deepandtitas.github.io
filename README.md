# দীপ ও তিতাস — শুভ পরিণয় · Deep & Titas Wedding Invitation

An interactive Bengali wedding invitation. A hand-drawn story — an alpana and lotus awakening, two paths meeting
in a garden, the wedding under a floral canopy — plays inside a 9:16 "mobile wedding film" and settles into a
premium, bilingual (বাংলা / English) invitation card with a **স্থান দেখুন** map button.

Built with **React + TypeScript + Vite** and **[Remotion](https://www.remotion.dev)** as the animation engine
(`@remotion/player` in the website, Remotion Studio / CLI for the video).

- **Watch the story** — cinematic playback of all four scenes, ending on the card (always the main button on the cover).
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
| `npm run studio` | Open Remotion Studio (1080×1920, 60 FPS, 3000 frames) |
| `npm run render` | Render the whole story to `out/deep-and-titas.mp4` |
| `npm run still` | Render the final invitation frame (2999) to `out/invitation.png` |
| `npm test` | Unit tests (timeline, character rig, preloader, translations, dates, wedding config, story state machine) |
| `npm run typecheck` · `npm run lint` | TypeScript and ESLint |
| `npm run stills` | Render the key frames to `out/stills/` for visual review (`node scripts/stills.mjs <frames…> --lang=en --scale=0.5`) |
| `npm run art` | Regenerate all art: `scripts/art/*.mjs` (garden, mandap, sprites, the couple's rig parts) write SVG sources to `art/`; `scripts/bake-art.mjs` bakes them to trimmed WebP in `public/images/` and writes `src/remotion/art-manifest.ts` |
| `npm run profile` | Build, then play the site in headless Chrome as a CPU-throttled phone and print fps per scene (`--throttle=2`, `--no-build`) |
| `npm run og` | Regenerate the Open Graph / link-preview image `public/og-image.jpg` from the real final card |

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
| Map | https://maps.app.goo.gl/BGgvu48u6NbyY9xN8?g_st=aw (Google Maps listing for Sthapati) |

Dates are ISO strings rendered by `src/config/dates.ts` (Bengali digits, ordinals like ২৫শে, weekday). Every text field is
`{ bn, en }`. Anything you leave blank is simply not shown — there are no placeholders anywhere.

The **স্থান দেখুন / View Location** button opens `wedding.mapUrl` — the venue's Google Maps listing,
`https://maps.app.goo.gl/BGgvu48u6NbyY9xN8?g_st=aw` — in a new tab (`rel="noopener noreferrer"`). A unit test guards the exact URL.

### 2. Wording — `src/config/translations.ts`

Every visible string (scene titles, buttons, labels, aria-labels, the invitation message) lives here in `bn` and `en`.
A test enforces that both languages have the same keys and no empty strings. Bengali is the default.
Switching language changes only the text — the story keeps playing from the same frame, and the soundtrack is not restarted.

### 3. Scene timings — `src/config/timeline.ts`

Pacing is authored in **beats** (1 beat = 1/30 s) and the film plays at **60 FPS** (2 frames per beat), so motion is
smooth on high-refresh phones while the hand-tuned numbers stay readable. `SCENE_BEATS` (scene start/end) and `BEATS`
(when each thing happens inside a scene, relative to its start) are the single source of truth; `SCENES` gives the same
boundaries in frames for the Player and guided checkpoints. 3000 frames = 50 s; the last frame index is **2999**.

- To retime *within* a scene, edit its `BEATS`.
- To change scene lengths, edit `SCENE_BEATS` (keep them contiguous — a test checks this). Everything downstream follows;
  re-check the beats still fit inside the scene (also tested), the camera in `src/remotion/camera.ts` and the soundtrack
  envelope in `src/remotion/Soundtrack.tsx`.

### 4. Replacing the bride and groom illustrations

Deep and Titas are drawn in exactly one place so they stay identical in every scene:
**`src/remotion/components/WeddingCouple.tsx`** — `<Groom/>` and `<Bride/>`.

They are **cut-out puppets**: each body part (torso, dhoti/saree, upper arms, forearms with hands, head, topor/mukut,
veil, stole, feet) is painted as detailed, shaded SVG in `scripts/art/characters.mjs`, baked to WebP, and moved at runtime
only by CSS transforms. `src/remotion/rig/motion.ts` solves the pose: two-bone arm IK toward named poses (namaskar, holding
a garland, veiling the face with betel leaves…) or explicit hand targets, a walk cycle with steps and sway, breathing,
seeded blinks, cloth that lags behind motion, and a damped swing for garlands. Faces stay vector so expressions (gaze,
blink, smile, blush) can change.

- **Tweak the look:** edit colours and shapes in `scripts/art/characters.mjs`, then `npm run art`. If you move a joint,
  update `SKELETON` in `rig/motion.ts` to match.
- **Swap in commissioned artwork:** replace the part images in `public/images/rig/` (same names, each part drawn in its
  rest pose around the same joints) and update the rectangles in `src/remotion/art-manifest.ts`.
- **Garden / mandap / sprites:** generated by `scripts/art/garden.mjs`, `mandap.mjs` and `sprites.mjs`.

> The artwork here is original and procedurally drawn. No real likenesses are used.

### 5. Soundtrack — `public/audio/soundtrack.mp3`

The music is the track supplied by the couple, cut to its first 50 seconds (a soft ~10 s intro, then the steady main
section, ending where the original dips) with a short fade-in and a 2.5 s fade-out, re-encoded at 160 kbps (~1 MB) so
it matches the 50-second film and loads quickly on phones. It is faded in/out and swells through the wedding scene
automatically (the envelope is in `src/remotion/Soundtrack.tsx`). On the website it plays through a plain `<audio>` element
in the shell (`src/app/hooks/useSoundtrack.ts`), which follows the story (play, pause, seek) — the browser decodes it off
the main thread. Video renders mix it in through the composition. Details are in `public/audio/README.txt`.

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
    rig/      motion.ts (skeleton, IK, walk, blinks, cloth, pendulum)
    lib/      time.ts (useBeat) · live.ts (per-frame DOM styles) · anim.ts · path.ts
    camera.ts · art-manifest.ts (generated by `npm run art`)
  app/        the website shell: ExperienceShell · Loader · IntroScreen (cover) · StoryControls · LanguageToggle
    loader/   preload.ts (fonts, decoded images, soundtrack — weighted progress)
    state/    storyMachine.ts  (pure reducer — guided order, skip, replay; unit-tested)
    hooks/    usePlayerEvents · useStoryMachine · useReducedMotion · useSoundtrack
  styles/     tokens.css · global.css · experience.css
scripts/art/  generators for the garden, mandap, sprites and the couple's parts
art/          generated SVG sources (git-ignored; baked to WebP by `npm run art`)
public/       images/ (baked WebP: garden, rig/, mandap/, sprites/) · audio/ (soundtrack) · og-image.jpg (link preview)
```

- **Frame-driven animation.** Everything in `src/remotion/` derives from the current frame (`useBeat()`), with
  `interpolate()`-based easing. No timers, so any frame renders identically every time (the same code produces the MP4).
- **A loader that really loads.** `index.html` paints an animated diya-and-lotus boot screen before any script runs; the app
  then loads every font face, fetches and decodes every image and streams the soundtrack, showing real progress, and only
  then fades into the cover. Nothing pops in or flickers later.
- **The story.** The couple walk in along the garden path, slow, turn to each other and greet with folded hands; only then
  do marigolds rise from the garden into an arch above them. In the wedding scene the mandap builds itself, lamps light,
  the bride veils her face with betel leaves, the camera pushes in as she lowers them and their eyes meet (শুভদৃষ্টি), then
  each steps forward in turn and garlands the other (মালাবদল), and the garlands settle with a swing.
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

### Typography

Bengali text uses **Anek Bangla** — a modern variable face with real weights (100–800), so headings can be truly bold
and nothing is synthesised — for headings, body copy and buttons. The couple's names use **Galada** (a flowing script close
to the lettering printed on the invitation; single weight). English uses **Cormorant Garamond**. All are self-hosted via
`@fontsource` (no runtime network). Bengali vowel signs and Galada's loops reach far outside the line box, so every box that
clips text is padded (`BN_PAD`), and text reveals use a padded clip rather than a mask. Roles live in `src/remotion/fonts.ts`.

### Performance

The film runs at **60 FPS** and is built to hold it on phones. `npm run profile` plays the production build in headless
Chrome as a 390×844 phone: with 2× CPU throttling every scene holds ~60 fps. What makes the difference:

- **Baked art.** Garden, mandap, sprites and every character part are pre-rendered WebP, trimmed to their visible pixels
  (less GPU memory — a common cause of flicker on low-memory phones). Paper grain is baked into the paper.
- **Transforms only.** Moving things — petals, gold dust, garland flowers, lamp flames, the figures' parts, the camera —
  are rendered once and moved by transform/opacity. Their per-frame styles are written straight to the DOM
  (`lib/live.ts`), so React does not re-diff hundreds of elements every frame; sub-pixel idle motion updates at 30 Hz.
- **No layer churn.** Layers are never promoted/demoted mid-animation (that flickered on phones), big images are never
  mounted mid-story, and everything is decoded before the story starts.
- **Main thread to spare.** Music plays through a native `<audio>` element instead of a JavaScript decoder, and the hidden
  render-only image gate is not mounted in the website. The JS bundle is ~205 KB gzip.

### Accessibility and responsiveness

- Strict 9:16 frame (`width = min(100vw, 100dvh × 9/16)`), centred on desktop with a warm surround; safe-area insets respected; no horizontal overflow.
- Real buttons/links, visible focus rings, ≥44 px touch targets, ARIA labels, an `aria-live` scene announcer.
- `prefers-reduced-motion`: no petals/dust/parallax/camera moves, characters fade instead of walking, the card fades in.
  **"গল্পটি দেখুন / Watch the Story"** stays the main action; skipping to the invitation is always one tap away.
- Skip-to-invitation is always available; sound is never required and never autoplays.

---

## Testing

```bash
npm test            # unit tests: timeline, character rig, preloader, translations, dates, wedding config, story machine
npm run typecheck && npm run lint && npm run build
npx remotion compositions src/remotion/index.ts     # → DeepAndTitasWedding 60 1080x1920 3000 frames
npm run profile     # fps per scene in a throttled headless phone
```

---

## Link previews (Open Graph)

`index.html` carries static Open Graph and Twitter-card tags (title, description, `og:image`, locale, canonical URL), and
`public/og-image.jpg` is a 1200×630 preview showing the names, both dates and the real final card. Re-run `npm run og`
after changing any wedding details. Messaging apps cache previews, so if one shows an old image, re-scrape the link with the
platform's debugger (e.g. Facebook's Sharing Debugger).

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
