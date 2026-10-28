# Remake board

Shared record for every agent on the remake. Append only; newest at the bottom of each section. Sign every entry
with your agent name. Talk to peers directly with SendMessage (find them with ListAgents) and log the outcome here.

- Worktree: `C:\Projects\dt-remake` (branch `remake`). The old build is the read-only reference:
  `C:\Projects\deepandtitas.github.io` (do not edit anything there).
- `remake/CONTRACTS.md` is owned by the orchestrator. Ask on this board (or message the orchestrator) to change it.
- Each file has one owner (see CONTRACTS.md). Ask the owner before touching their files.

## Status
| agent | wave | state | output |
|---|---|---|---|
| spec-story | 0 | done | remake/SPEC/story.md |
| spec-visual | 0 | done | remake/SPEC/visual.md |
| spec-shell | 0 | done | remake/SPEC/shell.md |
| art | 1 | done | scripts/art, public/art, src/art/manifest.ts |
| shell | 1 | done | src/app, src/content, src/styles, scripts/stills/og-image/profile |
| renderer | 1 | done | src/render, src/remotion |
| story | 1 | done | src/story, tests/{timeline,anim,rig,choreography,story-parity}.test.ts |

## Questions and answers

## Handoffs

- spec-visual: visual.md sections 1 paint order/camera, 2 art assets, 3 vector elements, 4 sprites, 5 figures/faces, 6 text/fonts/card, 7 hotspot, 8 notes, manifest; Appendices A-H are verbatim generator and component source.
- spec-shell: shell.md ready. Sections: 1 build/tooling/deploy/composition registration/index.html; 2 content (wedding, full translations, dates); 3 app flow (loader, shell, state machine, player events, cover, controls, language, soundtrack, reduced motion, debug hooks); 4 layout + CSS; 5 hotspots + map link; 6 scripts; 7 tests; 8 rules; 9 unpinned. Hotspot coords from layout.ts/FloralMandap.tsx. -- spec-shell

- spec-story: story.md done. Sections: 1 timing, 2 helpers, 3 layout/path, 4 camera, 5 rig, 6 scenes (awakening, garden, meeting, wedding, atmosphere, invitation), 7 reduced/guided, 8 tests.

- art: DONE. `src/art/manifest.ts` (ART, ArtName, ArtRect) + `public/art/*.webp` (52 flat files, src "art/<name>.webp") exist; same names and rects as old build. `node scripts/art/compare.mjs` shows 0.000 pixel diff for all 52. Intermediates in out/art-src/. -- art

- shell: done. src/app, src/content (wedding, translations incl. `Dictionary`, wedding.ts incl. `WeddingDetails`, dates, assets with `asset(base, src)`), src/styles, scripts stills/og-image/profile (tile MB column via Tracing.requestMemoryDump, unverified on a real run), 7 test files (28 tests pass). Assumes renderer exports `WeddingComposition` from src/remotion/WeddingComposition.tsx (Root.tsx imports it too) and `GuidedProps.onActivate(target: HotspotAction, e)` as in props.ts; main.tsx imports src/remotion/fonts. Site soundtrack envelope is src/app/lib/soundtrackVolume.ts (linear, same stops as the old keyframes). Loader preloads ALL_ART via artImage(asset(base, ART[n].src)). Font face list: src/app/lib/fontFaces.ts. -- shell

- renderer: done. src/render (mat, ops, overlay, canvas, images [artImage/imageReady/whenDecoded], textStyles, fontStacks) and src/remotion (index, Root, props, assets, fonts, FontGate, Soundtrack, StoryCanvas, Overlay, WeddingComposition). Tests: tests/render.test.ts, tests/composition.test.tsx (pass; eslint + tsc clean for my files).
  Decisions for scenes: overlay text (x,y) are LOCAL coords under optional `m` (default frame coords); x = left/centre/right edge per `anchor`, y = VERTICAL CENTRE of the line box (padding symmetric). Reveal wipe + gold glow are automatic for styles with `glow` (title, subtitle). TextStyleIds: heading-ink, heading-light, title, subtitle, card-heading, card-names, card-message (wraps, maxWidth 740), card-label, card-day, card-bndate, card-when, card-venue, card-venue-note, card-address, card-landmark, map-link (link = whole button: box, pin, text; centred on x,y). Unknown id falls back to card-message. The scene heading's gold rules and all card ornament/background are canvas ops (scenes-a). Card-name gold shimmer (dynamic text-shadow) is not expressible in OverlayItem; skipped unless the contract adds a field.
  Composition calls describeFrame once and passes `output` to StoryCanvas/Overlay as props. `fonts.ts` re-exports FONT_*/BN_PAD/DISPLAY_WEIGHT from src/render/fontStacks.ts. Could not reach `shell` via SendMessage (not listed): shell please read this. -- renderer

- story: src/story done, pure TS, no Remotion import. Exports (all beats unless said; px = composition px):
  `timeline.ts` everything the old config/timeline.ts exported (same names/values).
  `anim.ts` easeOut/easeInOut/easeSoft/rise/bezier/settle, progress, ramp, keyframes, smoothKeyframes, lerp, clamp, seeded, bump, types Range/Easing.
  `path.ts` pathPoint, pathCenterline, pathHalfWidth, pathPolygon, PATH_*/MEET_Y/LOTUS_BASE_Y.
  `layout.ts` COUPLE, GAZE_POINT, CARD_EDGE_Y, ORNAMENT_POS/SCALE, MANDAP, HOTSPOTS(+mandap), HOTSPOT_SIZE, GARLAND_BOX, ARCH_BOX, ARCH_BOX_GATHERED, DIYA_BOX, BUSHES, DIYA_SPOTS, MANDAP_GLOW, GAZE_GLOW.
  `camera.ts` CAMERA_FOCUS, cameraZoom(globalBeat, reduced).
  `rig.ts` SKELETON, ARM_POSES, restArm, poseArm, poseTarget, solveArm, placeArm, solveFigure, blinkAt, breathe, wind, pendulum, rotate, lerpPt, figurePoints; types Who, Pt, PartXf, FigurePose, FigureProps (incl. face Expression, paan), SolvedFigure.
  `choreography.ts` meetingPose(f), meetingFade, flowerGather, basePose(f), exchangeAt(f) -> {pose, garlands}, LEAVES, EXCHANGE, SWAP, frontFigure, weddingLight, mandapParts, petalAt, closingAt, setDownLeaves (2 sprites, opacity 0 until release), couplePose(globalBeat, reduced) -> {groom, bride, front, garlands} (faces/turn ease over 14 beats after the wedding starts to remove the old pop), gardenState/gardenDrift/duskAt/quantise, petalIntensity, dustIntensity, atmosphereKind, atmosphereSprites, petalSprites, dustSprites, archSprites/archPoint, diyaSprites, strandPoints, garlandSprites, garlandField; types SpriteState (name,x,y,rot,scale,sx,opacity), SpriteName, GarlandState, CouplePose, CoupleFrame.
  Parity vs the old build: tests/story-parity.test.ts (skips if the old folder is absent).
