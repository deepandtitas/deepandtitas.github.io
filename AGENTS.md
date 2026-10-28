# AGENTS.md — Deep & Titas · শুভ পরিণয়

Interactive Bengali wedding invitation. A Remotion composition (1080×1920, 60 FPS, 3000 frames, paced in 30-per-second
"beats") is played inside a mobile-first React shell via `@remotion/player`, and ends on an interactive invitation card.

## Commands
- `npm run dev` — Vite dev server for the website
- `npm run studio` — Remotion Studio (composition id `DeepAndTitasWedding`)
- `npm run render` — render the full MP4 to `out/`
- `npm run still` — render the final invitation frame to `out/invitation.png`
- `npm run art` — regenerate and bake all painted art, sprites and character parts (writes `src/remotion/art-manifest.ts`)
- `npm run profile` — build, then play the site in headless Chrome as a throttled phone and print fps per scene
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`

## Architecture
- `src/config/` — `timeline.ts` (single source of truth: scenes and beats), `wedding.ts` (editable event details),
  `translations.ts` (bn/en dictionary), `assets.ts` (asset URL helper)
- `src/remotion/` — the cinematic composition (scenes, mandap, garden, the character rig, the invitation card).
  Registered in `index.ts`/`Root.tsx`. `rig/motion.ts` is the pure pose maths (IK, walk, blinks, cloth lag);
  `components/WeddingCouple.tsx` draws the figures; `camera.ts` the zoom; `art-manifest.ts` is generated.
- `src/app/` — the website shell: boot loader (`components/Loader.tsx`, `loader/preload.ts`), cover (`IntroScreen.tsx`),
  controls, guided-mode state machine (`state/storyMachine.ts`), language toggle, soundtrack (`hooks/useSoundtrack.ts`)
- `scripts/art/*.mjs` — the art generators (garden, mandap, sprites, characters); `scripts/bake-art.mjs` bakes them to WebP
- `public/` — baked images (`images/`, `images/rig`, `images/mandap`, `images/sprites`) and the optional `audio/soundtrack.mp3`
- `tests/` — Vitest unit tests (timeline, rig, preloader, translations, dates, wedding config, story machine)

## Verifying visual changes
`npm run stills` (or `node scripts/stills.mjs <frames…> [--lang=en] [--scale=0.5]`) renders PNGs to `out/stills/`.
Look at them — key frames (60 FPS): 0, 300, 478 (scene 1), 840, 1138 (scene 2), 1400 (veiled), 1540 (eyes meet),
1750 (garland), 1960 (tableau), 2098 (scene 3), 2200, 2999 (invitation).
`node scripts/profile.mjs --no-build [--throttle=2|4]` for performance.

## Rules
1. **Frame-driven only.** All cinematic animation derives from the current frame (`useBeat()` in `lib/time.ts`, which is
   `useCurrentFrame()` in beats) with `interpolate()`/`progress()`. No `setTimeout`, CSS animation timers or wall-clock time
   inside `src/remotion/`. The same frame must render identically twice.
2. **Timeline is the single source of truth.** Scene boundaries (`SCENE_BEATS`), beats, guided checkpoints, the skip target and
   the duration come from `src/config/timeline.ts`. Pacing is authored in beats (1/30 s); Sequences, the Player and checkpoints
   use frames (`SCENES`, `beatsToFrames`). Never hard-code frame numbers elsewhere. The 3000-frame composition's last frame is 2999.
3. **No `import.meta.env` inside `src/remotion/`** (Remotion Studio bundles with webpack). Pass values in via `inputProps`.
4. **Asset URLs** go through `asset()` / `useAsset()` using the `assetBase` input prop, so the site works under a sub-path
   if one is ever needed (`BASE_PATH`). Production is the GitHub user site `https://deepandtitas.github.io/` at the root.
5. **Never fabricate wedding details.** Anything not supplied by the family stays blank in `wedding.ts` and is hidden.
   The map button opens `wedding.mapUrl` exactly as given (the venue's Google Maps listing).
6. **Character consistency.** Deep and Titas are drawn only by `src/remotion/components/WeddingCouple.tsx`, from the parts
   painted in `scripts/art/characters.mjs`. Rest-pose geometry there must match `SKELETON` in `rig/motion.ts`.
7. **Cultural respect.** Bengali sequence: শুভদৃষ্টি, then মালাবদল. Do not add rituals that are not clearly depicted correctly
   (no fire ritual or sindoor daan). When unsure, use a symbolic depiction.
8. **Audio** is optional and starts only after a user gesture; a missing track must degrade silently. The website plays it with
   a plain `<audio>` in the shell (`useSoundtrack`); the composition's `<Soundtrack>` is only for video renders.
9. Keep website interaction state (React) separate from frame-driven state (Remotion). Do not re-render the shell per frame.
10. Bengali is the default language; every visible string comes from `translations.ts`. "Watch the story" is always the
    primary cover action (reduced motion changes how the story plays, not which button leads).
11. Decorative composition layers must stay click-through (`pointer-events: none` on the composition root);
    only hotspot buttons and the map link opt back in. Guided-mode boundary checks use `>=` and run before scene updates,
    because the Player can skip frames on slow devices.
12. **Performance rules (target ≈60 fps on phones).**
    - Art is baked to trimmed WebP (`npm run art`); don't reintroduce `mix-blend-mode`, SVG filters, `mask-image` or big
      per-frame SVG in the composition.
    - Things that move every frame are rendered once and moved by transform/opacity only: `SpriteField` and the figures
      write their per-frame styles straight to the DOM (`lib/live.ts`), so React does not re-diff them each frame.
    - Never toggle `will-change` or mount/unmount big layers mid-story; hide with `visibility`/opacity instead.
    - No Remotion `<Img>` in the website tree (they re-render every frame); `<ArtGate>` exists only for renders, and the
      loader pre-decodes every image before the story starts.
    - Measure with `npm run profile`: at `--throttle=2` every scene should hold ~60 fps.
13. **Fonts.** Bengali text uses Anek Bangla (variable, real weights 100–800); the couple's names use Galada (single weight:
    always `DISPLAY_WEIGHT`). Boxes that clip or mask Bengali text need `BN_PAD` block padding so vowel signs are never cut.
