# AGENTS.md — Deep & Titas · শুভ পরিণয়

Interactive Bengali wedding invitation. A Remotion composition (1080×1920, 60 FPS, 3000 frames, paced in 30-per-second
"beats") is played inside a mobile-first React shell via `@remotion/player`, and ends on an interactive invitation card.
**The whole picture is drawn into ONE canvas** from pure draw lists; the DOM holds only that canvas, text and tap targets.
(The previous build drew ~40 DOM layers; on phones that needed ~300 MB of GPU tile memory and parts of the picture
blinked out. See `remake/CONTRACTS.md` for the measurements.)

## Commands
- `npm run dev` — Vite dev server · `npm run build` · `npm run typecheck` · `npm run lint` · `npm test`
- `npm run studio` — Remotion Studio (composition `DeepAndTitasWedding`) · `npm run render` (MP4) · `npm run still`
- `npm run art` — regenerate and bake the painted art (`scripts/art/*.mjs` → `public/art/*.webp` + `src/art/manifest.ts`)
- `npm run stills` / `node scripts/stills.mjs <frames…> [--lang=en] [--scale=0.5]` — PNGs to `out/stills/`
- `npm run phone` — **the device gate**: plays the build on a USB-connected Android phone (adb + Chrome) and prints GPU
  tile memory, out-of-memory share, checkerboarded draws and fps per stretch. `node scripts/phone-record.mjs` records a
  full play-through and scans it for blinks (needs Python + OpenCV, see its header).
- `npm run profile` — headless throttled-phone benchmark (relative numbers only)

## Architecture (single sources of truth)
| what | where |
|---|---|
| timing: scenes, beats, checkpoints, skip, duration | `src/story/timeline.ts` |
| positions (couple, mandap, ornament, card, hotspots, camera focus) | `src/story/layout.ts` |
| motion: anim helpers, path, camera, rig (IK, walk, blinks), choreography (poses, sprite states) | `src/story/*` (pure) |
| strings / event details / asset URLs | `src/content/translations.ts` / `wedding.ts` / `assets.ts` |
| painted art | `scripts/art/*.mjs` → `src/art/manifest.ts` (generated) |
| what is on screen at a frame | `src/scene/frame.ts` `describeFrame(frame, ctx) → { draw: DrawOp[], overlay: OverlayItem[] }` (pure), built from `src/scene/*` |
| how it is drawn | `src/render/canvas.ts` (the only canvas code), `mat.ts`, `ops.ts`, `overlay.ts`, `textStyles.ts`, `images.ts` |
| composition | `src/remotion/` — `StoryCanvas` (one canvas) + `Overlay` (fixed set of text/tap elements) |
| website shell | `src/app/` — loader, cover, controls, guided state machine, language, soundtrack, stage layout |

## Rules
1. **Pure and frame-driven.** Everything on screen is a pure function of the frame and context. No `Date`,
   `performance`, `Math.random` or timers in `src/story`, `src/scene`, `src/render` (lint-enforced). Same frame → same picture.
2. **Single sources of truth** (table above). No numeric frame/beat literals in `src/scene`; derive them from the timeline.
3. **One picture canvas.** Never add `<img>`, `<svg>`, CSS gradients or `will-change` imagery to the composition;
   draw it as ops. The overlay's element set is FIXED for the whole story (hidden with opacity/visibility), each box sized
   to its content. Only hotspots and the map link take pointer events.
4. **No `import.meta.env`** in `src/remotion`, `src/scene`, `src/story`, `src/render`; pass values via input props.
5. **Asset URLs** go through `asset(base, src)` with the `assetBase` prop. Production is `https://deepandtitas.github.io/`.
6. **Never fabricate wedding details**; blank fields stay hidden. The map link opens `wedding.mapUrl` exactly.
7. **Cultural respect.** শুভদৃষ্টি, then মালাবদল (bride garlands the groom first). No fire ritual or sindoor daan.
8. **Fonts.** Anek Bangla (variable 100–800), Galada for the names (always `DISPLAY_WEIGHT`), Cormorant Garamond for
   English. Bengali boxes that clip need `BN_PAD` block padding.
9. **Audio** is optional, starts after a user gesture, and a missing track degrades silently (plain `<audio>` in the shell).
10. Bengali is the default language; every visible string comes from `translations.ts`. "Watch the story" is always
    the primary cover action. Guided-mode checks use `>=` (the Player can skip frames).
11. The Player renders at 1080×1920 (scale 1); `useStageLayout` scales it with one CSS transform, fitted to `svh`.
12. **Verify on a phone.** Visual changes: `node remake/qa/compare.mjs <frames>` against the reference stills.
    Anything aimed at phones: `npm run phone` must show 0% out of memory and 0 checkerboarded draws in every stretch,
    tile memory ≤ 80 MB, ≈60 fps; and `phone-record` must find no blinks. Headless Chrome cannot reproduce phone GPU
    limits — never claim a phone fix from headless numbers alone.
