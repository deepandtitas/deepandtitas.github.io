# visual.md — appearance spec (spec-visual)

Everything below is copied from the reference build (`C:\Projects\deepandtitas.github.io`). Sections 1-8 are prose + key constants; the
**Appendices** paste the reference source VERBATIM (generators, components) so geometry/paint can be copied exactly. The remake draws
into one canvas: baked art pieces (Appendix A-E) may still be produced at build time by the same recipes (SVG -> raster -> trimmed WebP,
see sec. 2) and drawn with `drawImage`; vector items (sec. 3) are drawn with canvas path calls using the same numbers.
Composition space: 1080x1920. Page/ground colour `#f5ebdd`. Brand tokens: sindoor `#781f2b`, ivory `#f5ebdd`, antique gold `#c49a52`,
forest `#344638`, ink `#30251f`, muted brown `#665343`; desktop surround `#4a1f24` / `#2b1613` / `#1c0e0c`.

## 1. Global paint order (back to front)

Root: `#f5ebdd` background, overflow hidden, click-through.
1. `paper` image at 0,0 (1080x1920, opaque).
2. **Scene 1 Awakening** (exits by opacity `1-exit`, exit over beats dur+8..dur+58 so the garden dissolves in over it):
   Alpana strokes -> light glows (`glow-grad` disc r=lightR*5.5, small `#fff3cf` core r=lightR*0.45) -> closing curve (gold wide stroke `#e7c97c` w14 op .35, then sindoor `#781f2b` w5 op .85, head dot `#f3d37e` r11 op .95) -> Lotus (x540,y1145, glow) -> RevealText title -> RevealText subtitle -> hotspots (guided only).
3. **Camera group** (one transform `scale(z)` about `CAMERA_FOCUS = (540, GAZE_POINT.y+60)`; GAZE_POINT=(540, 1500-598*0.84=997.68) so focus y~1057.68; z 1..1.15, camera.ts). Inside, back to front:
   a. GardenBack: `garden-far` plane (opacity=gardenIn); sun-warmth div; garden path SVG; `garden-mid-l/r` plane; dusk wash div; `garden-lights` plane (opacity=lights).
   b. MeetingScene: arch SpriteField (34 flowers), Groom, Bride, hotspot.
   c. WeddingScene: GlowDisc(540,1040,r760); MandapStructure (floor, dome, strings, valance, posts L/R, leaves L/R); arch (gathered); diyas field (glow, diya, flame x8); GlowDisc at gaze point (r230, the eyes-meet glow); figure wrapper (groom z1/bride z2 until beat 336 `SWAP`, then groom z2/bride z1; zIndex swap only); garland SpriteField (box 180,640,720x820); set-down paan leaves; drifting marigold petal sprite; card edge (InvitationCard frame 0, top=cardTop, border=edge) + Emblem at ORNAMENT_POS (540,1545) scale .62.
   d. GardenForeground: `garden-near-l/r` plane (they slide apart by `part`: x +-360*part, y +120*part; opacity gardenIn*(1-dusk*.15)). Drawn OVER couple, mandap and card edge.
4. **Headings** (outside the camera, above foreground leaves): three SceneHeadings (opening, meeting, wedding [light tone]).
5. **Scene 4 Invitation**: backdrop `radial-gradient(circle at 50% 28%, #62262d 0%, #3b1b1c 58%, #26110f 100%)` (opacity progress f 0..50) -> InvitationCard (top animates CARD_EDGE_Y 1575 -> 160) -> Emblem (x540, y=top+lerp(-30,190,e), scale lerp(.62,1,e)).
6. **Atmosphere**: ONE canvas, res .75, over the whole frame, on top of everything: 16 gold motes first, then 20 petals (kind marigold between wedding-scene beat 280 and wedding end: petal-marigold, every 4th petal-red; otherwise cycle pink, marigold, white, red). Hidden in reduced motion.

Camera effect: only garden/couple/mandap/foreground/card-edge scale; paper, awakening, headings, invitation, atmosphere do not.
Dusk (`duskAt`) darkens the garden: wash `linear-gradient(180deg, rgba(64,24,46,.68) 0%, rgba(150,62,38,.36) 52%, rgba(112,40,26,.46) 100%)` at opacity=dusk; sun warmth `radial-gradient(circle at 76% 24%, rgba(255,236,170,.5) 0, rgba(255,236,170,0) 52%)` at opacity gardenIn*(1-dusk*.8). Parallax planes are 1200x1920 at left -60; drift x = drift * (far .35, mid .8, lights .8, near 1.5); drift ramps 22 -> -22 across meeting.start..wedding.end.
GlowDisc: `radial-gradient(circle, rgba(249,226,160,.9) 0%, rgba(241,196,99,.35) 45%, rgba(241,196,99,0) 70%)`, diameter 2r, opacity driven.

## 2. Art assets
Bake: SVG rasterised at bounds*scale in headless Chrome, alpha>3 bbox trimmed + 2px pad (unless opaque/trim:false), WebP at `quality`. Manifest rect = bounds.xy + trimOffset/scale. Output dirs: garden+paper `images/`, rig `images/rig/`, mandap `images/mandap/`, sprites `images/sprites/`. Pieces use SVG filters (feTurbulence grain / watercolour displacement, gaussian blur); seeds fixed (mulberry32 `rng` in common.mjs). Per-piece bounds/scale/quality are in the generator source (App. A-E). Trimmed rects (design coordinates):

Quality/scale summary: paper opaque q.80; garden-far opaque q.82; mid/near q.84; lights q.85; mandap parts scale 1-1.2 q.86; rig parts scale 1.6 q.88; sprites: petals scale 2 (bounds 48x68), tuberose/rose 3, marigolds 2.4 (tones 0,1,3, seeds 11,12,13, r20), mote 2, glow 1 q.9 untrimmed 256x256, flame 3, diya 2.5, paan 2.

What each depicts: `paper` warm ivory with mottle + fibre noise and brown vignette; `garden-far` sunlit Bengal garden (sky `#f0d3a0 -> #f6e3bd -> #f5ebdd`, sun disc 900,430 r560, light shafts, hazed hills and tree line at horizon y880, meadow `#d3c995 -> #b3b678 -> #86975a -> #5f7446`, 900 grass blades, 300 marigold/blossom flowers); `garden-mid-l/r` framing trees with canopy clumps and flowering bushes; `garden-near-l/r` foreground leaf fans, marigolds, hanging leaves; `garden-lights` three string-light strands with glowing bulbs; `mandap-*` red velvet dome with gold ribs/zari and kalash finial, valance with scallops and tassels, banana-stem posts wrapped in marigold garlands with gold bands, hanging marigold strings with brass bells, floor alpana (ochre ellipse, white rice-paste rings and lotus petals), banana leaves + brass mangal ghat with mango leaves and coconut; sprites: petals (4 colours), marigold heads, tuberose, rose, mote, glow, flame, diya bowl, paan leaf; rig parts: sec. 5.

## 3. Vector (procedural) elements
Exact code in Appendix F: Alpana (self-drawing strokes: gold frame `#c49a52` w3 + sindoor inner w2 op.55; mandala at (540,1060): ring r236 sindoor w4 op.75, dotted gold ring r266 dash "1 15" w4, 16 petals PETAL/CURL, 32 scallops, 4 mirrored corner flourishes); Lotus (4 petal layers, gradient base -> mid -> tip, sepals, 9 gold stamens, glow circle r330 at y-130); Emblem (sindoor disc r92 gold stroke 6, dotted ring r78, thin ring r66, gold lotus scale .33 at y50, halo r150); garden path (GardenStage + path.ts polygon: fill `#e2cb98` .96, inner `#efdcae` .9 (edge offset -26), gold stroke 3 op.75, dashed centre line `#fff3cf` w10 op.55 dash "2 26"); pre-garden curve sindoor w5 op (1-gardenIn)*.85.
Strokes "draw themselves": pathLength=1, dasharray 1, dashoffset 1-p, round caps/joins.

## 4. Sprites and placement
Every sprite is drawn around its design origin (0,0): transform = translate(x,y) rotate(rot deg) scale(sx*k, k), image at manifest rect x,y,w,h, globalAlpha=opacity. Petals: `sx` squashes width (0.35+0.65|cos|) to read as tumbling. Petal look: path `M0 -1C0.95 -0.7 0.9 0.5 0 1C-0.9 0.5 -0.95 -0.7 0 -1Z` scaled 20x30, gradient light->edge, centre vein, highlight stroke (pink `#ef9faa/#c4566a`, marigold `#f4ac3a/#c9701a`, white `#fbf3e4/#c49a52`, red `#c8303f/#7c1220`). Dust mote: radial `#fff7dc, #f5d68a .9 @.25, #d4aa5e 0`, scale .35-.9. Arch flowers: 34 along ellipse (cx540, cy650-8, rx330, ry235), marigold-a / marigold-b (i%3==1) / tuberose (i%4==3), final scale 1.05 (tuberose .85). Garland: 17 sprites per strand cycling marigold-a, tuberose, rose, tuberose, marigold-b, tuberose, rose, tuberose; rot i*47+seed*13; scale 0.84; seeds 0 (bride's) and 3. Diyas: 8 spots (120,1560) (215,1605) (345,1622) (460,1632) (620,1632) (735,1622) (865,1605) (960,1560); scale s=0.95+(y-1560)/600; order glow (y-22s, scale .7*s*lit, op .85*lit), bowl, flame (y-20s, rot sin*3deg). Paan leaf in each of the bride's hands at the hand point, rot handAng+90 -+6, scale .72..0.98; set-down leaves scale .72*.84.

## 5. Figures (Deep, Titas)
Cut-out puppet; figure coords: origin between feet, up negative, ~650 tall; placed by translate(x,y) scale(s) at COUPLE y=1500, scale .84, groomX 415, brideX 665. Soft shadow: ellipse div left -120 top -16, 240x32, `radial-gradient(closest-side, rgba(48,37,31,.32), rgba(48,37,31,0))`.
Z-order back to front:
- Groom: foot-l, foot-r, dhoti, torso, stole (uttariya), arm-l, arm-r, fore-l, fore-r, then HEAD GROUP [groom-head, vector Face, groom-topor crown].
- Bride: veil (back), foot-l, foot-r, saree, torso, arm-l, arm-r, fore-l, fore-r, HEAD GROUP [bride-head, vector Face, bride-veil-front, bride-mukut crown].
- While she holds betel leaves: her forearms leave the body list and are drawn AFTER the head group, preceded by the two `paan` sprites: head group, paan L, paan R, fore-l, fore-r (leaves and forearms cover her face).
Head group rotates about the neck (groom (0,-546), bride (0,-538)); crown wobbles relative to head. Pivots in Appendix G (SKELETON). Part paint in Appendix E. Skin: groom base `#c98d5e` light `#e2a97a` shade `#a26a42`; bride `#dba27a / #efc29a / #b77e56`. Fabrics: silk `#fff7e2/#f1e2c0/#cdb688`, red `#c8313f/#a3162a/#6e0c1a`, blouse `#9e1c2e/#7f1022/#5a0814`, gold `#f4da92/#d2a74e/#94702c`; hair `#1b1210`; grain filter .16.
Face (vector, 100x110, viewBox -50 -650, shift dx=turn*4): groom {eyeY -601, eyeX 17, browY -613, mouthY -556, cheekY -574}, bride {-594, 16, -607, -553, -569}. Eye almond `M-10 0Q-1 -7 10 -0.5Q1 5.5 -10 0Z` `#fffaf0`, iris r4.6 `#3a2316`, pupil r2.4 `#120a07`, highlight r1.3 white; iris offset gaze*3.4, look*1.8; skin-coloured upper lid closes with blink (lidY=-7+12.5*blink); lash stroke `#30251f` w2.6; bride wing flick; brows `#1b1210` w3.6 groom / 2.6 bride, raised by smile; groom mouth stroke `#7a3030` w2.4; bride lips `#a52a37` upper / `#c23a48` lower; blush `#e0607a` rx8 ry5 at x+-25 op=blush*.42. Exact code in Appendix G.

## 6. In-picture text
Fonts: Bengali Anek Bangla Variable (real weights 100-800); couple's names in Bengali Galada, single weight `DISPLAY_WEIGHT=400`; English Cormorant Garamond 400, 400 italic, 500, 600. Stacks in fonts.ts (App. H). `BN_PAD = "0.32em"` block padding (with matching negative margin) on any box that clips or masks Bengali. `fontSynthesis: none`. FontGate waits for fonts (Anek 400/500/600, Galada 400, Cormorant 400/italic/500/600, sample text in source, 30 s timeout, failure falls back silently).
Strings: bn title "দীপ ও তিতাস", subtitle "একটি নতুন গল্পের শুরু", headings "শুভ সূচনা" / "দুটি পথ, একটি গল্প" / "শুভ পরিণয়", card "সাদর আমন্ত্রণ", message "আমাদের জীবনের এই শুভ মুহূর্তে আপনাদের সাদর আমন্ত্রণ।", button "স্থান দেখুন", labels শুভবিবাহ / প্রীতিভোজ / স্থান / ল্যান্ডমার্ক, hints "পদ্মটিতে ছুঁয়ে দেখুন", "আলোকিত পথে ছুঁয়ে দেখুন", "ফুলের ছাউনিতে ছুঁয়ে দেখুন", "সোনালি অলঙ্কারে ছুঁয়ে দেখুন". en: "Deep & Titas", "A new story begins", "An Auspicious Beginning", "Two Paths, One Story", "A Sacred Union", "You Are Invited", "We warmly invite you to celebrate this special moment in our lives.", "View Location", Wedding / Reception / Venue / Landmark, "Tap the lotus", "Tap the glowing path", "Tap the floral canopy", "Tap the golden ornament". Details (wedding.ts): wedding 2026-11-25 ৮ই অগ্রহায়ণ ১৪৩৩ সন্ধ্যায়/Evening; reception 2026-11-27 ১০ই অগ্রহায়ণ ১৪৩৩; venue স্থপতি / Sthapati (শম্ভু ঘোষের বাড়ি / House of Sambhu Ghosh), ১৫, রাজা শিউ বক্স বগলা লেন, কলকাতা-২ / 15, Raja Shew Box Bagala Lane, Kolkata-700002, landmark টালা পোস্টঅফিস / Tala Post Office. Bengali date ordinals ১লা ২রা ৩রা ৪ঠা ৫ই..১৮ই ১৯শে.., Bengali digits (dates.ts).
- RevealText: full-width centred absolute div, lineHeight 1.3, padding `BN_PAD 0`, marginTop `-BN_PAD`, nowrap; clip-path `inset(-20% R% -20% 0)` with revealed edge = p*120-10 %; p easeInOut; gold glow text-shadow `0 0 (24+glowA*28)px rgba(233,201,126,(.15+glowA*.7))`, glowA=max(0,1-|p-.55|*2.2). Title: size bn 156 / en 168, colour `#781f2b`, display (Galada 400; en Cormorant italic 600), top bn 338 / en 336. Subtitle: size bn 50 / en 56, weight bn 500 / en 400, `#665343`, italic en, letter-spacing bn .04em / en .08em, top bn 572 / en 570.
- SceneHeading: y=196, flex gap 26, two 80x3 rules (gradient transparent -> rule colour), text bn 64px Anek 500 / en 44px Cormorant 600 uppercase letter-spacing .12em, lineHeight 1.45, padding `BN_PAD 0.2em`; ink tone `#781f2b`, rule `#c49a52`, shadow `0 0 18px rgba(251,244,230,.9), 0 0 4px rgba(251,244,230,.9)`; light tone (wedding) `#fbefd6`, rule `#e3c27a`, shadow `0 2px 18px rgba(0,0,0,.55)`. Fades with easeSoft, rises 14px.
- Invitation card: Appendix F InvitationCard (left 70, top 160, 940x1600, radius 26, gradient `#fbf4e6 -> #f6ecd9`, shadow `0 34px 90px rgba(20,8,8,.55), 0 0 0 2px rgba(196,154,82,.55)`, paper image cover op .55, ornamental border + 4 corners + bottom flourish as strokes, content column left/right 96, top 276, bottom 132, gap 22; all field sizes/weights per language in the source). Map button: 136 tall, min 600 wide, radius 75, sindoor fill, 5px gold border, text `#f8ecd2` bn 52 / en 58 weight 600, shadow `0 10px 0 rgba(48,37,31,.18)`, hover lifts 4px and `#8f2433`, pin icon 48x55.

## 7. Hotspot (GuidedHotspot)
Real button over composition space. Pulsing outer ring (5px `#c49a52`, scale .72 -> 1.18, fading, 2.2 s ease-out loop; static op .6 in reduced motion), inner core inset 22%, 4px `#f8ecd2` border, fill `rgba(255,244,214,.18)`, 3px ring `rgba(120,31,43,.55)`, hover core `rgba(255,244,214,.34)`, focus outline 6px `#f8ecd2`. Pill label (above/below, 6px gap): padding 14px 34px, radius 60, bg `rgba(251,244,230,.96)`, border 3px `#c49a52`, colour `#781f2b`, weight 600, bn 40 / en 44. Sizes: lotus 330 at (540,1010) label below; path 300 at (478,1560) above; mandap 340 at (540,510) above; ornament 300 at (540,1545) below.

## 8. Notes / unpinned
- Timing parameters (headingIn, namesReveal, ...) belong to story.md (`BEATS` in timeline.ts).
- Vector Diya.tsx is unused (sprites used); Alpana `lightPoint` helper unused.
- Grain/watercolour filters are SVG feTurbulence; the remake can bake them identically in a headless browser or approximate with noise.
- Reference stills: bn-0300 (awakening: lotus in mandala, title wiping in); bn-1750 (garland exchange under the mandap with string lights, diyas, foreground leaves).

## Manifest (trimmed rects)
```json
{"bride-arm-l":{"src":"images/rig/bride-arm-l.webp","x":-76.5,"y":-509.37,"w":41.25,"h":139.38,"bytes":3176},
"bride-arm-r":{"src":"images/rig/bride-arm-r.webp","x":35.25,"y":-509.37,"w":41.25,"h":139.38,"bytes":3276},
"bride-foot-l":{"src":"images/rig/bride-foot-l.webp","x":-45,"y":-14.37,"w":33.75,"h":16.88,"bytes":1422},
"bride-foot-r":{"src":"images/rig/bride-foot-r.webp","x":11.25,"y":-14.37,"w":33.75,"h":16.88,"bytes":1404},
"bride-fore-l":{"src":"images/rig/bride-fore-l.webp","x":-85.75,"y":-396.37,"w":38.75,"h":144.38,"bytes":5354},
"bride-fore-r":{"src":"images/rig/bride-fore-r.webp","x":47,"y":-396.37,"w":38.75,"h":144.38,"bytes":5276},
"bride-head":{"src":"images/rig/bride-head.webp","x":-50,"y":-653.75,"w":100,"h":114.38,"bytes":7478},
"bride-mukut":{"src":"images/rig/bride-mukut.webp","x":-79.37,"y":-811.87,"w":158.75,"h":179.38,"bytes":14948},
"bride-saree":{"src":"images/rig/bride-saree.webp","x":-111.25,"y":-427.5,"w":222.5,"h":426.25,"bytes":27068},
"bride-torso":{"src":"images/rig/bride-torso.webp","x":-65,"y":-557.25,"w":130,"h":162.5,"bytes":10410},
"bride-veil":{"src":"images/rig/bride-veil.webp","x":-129.37,"y":-673.75,"w":258.75,"h":337.5,"bytes":32346},
"bride-veil-front":{"src":"images/rig/bride-veil-front.webp","x":-50,"y":-676.87,"w":100,"h":83.75,"bytes":4952},
"diya":{"src":"images/sprites/diya.webp","x":-46,"y":-25.2,"w":82,"h":35.2,"bytes":4290},
"flame":{"src":"images/sprites/flame.webp","x":-15,"y":-59,"w":30,"h":63,"bytes":7288},
"garden-far":{"src":"images/garden-far.webp","x":0,"y":0,"w":1200,"h":1920,"bytes":87874},
"garden-lights":{"src":"images/garden-lights.webp","x":44,"y":258,"w":1112,"h":644,"bytes":107524},
"garden-mid-l":{"src":"images/garden-mid-l.webp","x":0,"y":0,"w":560,"h":1336,"bytes":69740},
"garden-mid-r":{"src":"images/garden-mid-r.webp","x":652,"y":0,"w":548,"h":1301,"bytes":65198},
"garden-near-l":{"src":"images/garden-near-l.webp","x":-60,"y":-14,"w":614,"h":1934,"bytes":47950},
"garden-near-r":{"src":"images/garden-near-r.webp","x":640,"y":-14,"w":620,"h":1934,"bytes":43112},
"glow":{"src":"images/sprites/glow.webp","x":-128,"y":-128,"w":256,"h":256,"bytes":19652},
"groom-arm-l":{"src":"images/rig/groom-arm-l.webp","x":-88.87,"y":-512.87,"w":46.88,"h":136.88,"bytes":3382},
"groom-arm-r":{"src":"images/rig/groom-arm-r.webp","x":42,"y":-512.87,"w":46.88,"h":136.88,"bytes":3384},
"groom-dhoti":{"src":"images/rig/groom-dhoti.webp","x":-97.5,"y":-341.25,"w":195,"h":335,"bytes":21026},
"groom-foot-l":{"src":"images/rig/groom-foot-l.webp","x":-76.87,"y":-20.62,"w":71.88,"h":21.25,"bytes":2070},
"groom-foot-r":{"src":"images/rig/groom-foot-r.webp","x":5,"y":-20.62,"w":71.88,"h":21.25,"bytes":2068},
"groom-fore-l":{"src":"images/rig/groom-fore-l.webp","x":-93.87,"y":-397.75,"w":39.38,"h":150,"bytes":3832},
"groom-fore-r":{"src":"images/rig/groom-fore-r.webp","x":54.5,"y":-397.75,"w":39.38,"h":150,"bytes":3976},
"groom-head":{"src":"images/rig/groom-head.webp","x":-53.75,"y":-667.5,"w":107.5,"h":125,"bytes":5670},
"groom-stole":{"src":"images/rig/groom-stole.webp","x":-67.5,"y":-539.75,"w":135,"h":273.13,"bytes":12474},
"groom-topor":{"src":"images/rig/groom-topor.webp","x":-86.87,"y":-923.75,"w":173.75,"h":293.75,"bytes":19856},
"groom-torso":{"src":"images/rig/groom-torso.webp","x":-87.5,"y":-565.75,"w":175,"h":342.5,"bytes":17218},
"mandap-dome":{"src":"images/mandap/mandap-dome.webp","x":208.33,"y":326.67,"w":663.33,"h":326.67,"bytes":31506},
"mandap-floor":{"src":"images/mandap/mandap-floor.webp","x":98,"y":1454,"w":884,"h":172,"bytes":95944},
"mandap-leaves-l":{"src":"images/mandap/mandap-leaves-l.webp","x":-6,"y":1250,"w":361,"h":263,"bytes":17574},
"mandap-leaves-r":{"src":"images/mandap/mandap-leaves-r.webp","x":725,"y":1250,"w":361,"h":263,"bytes":17858},
"mandap-post-l":{"src":"images/mandap/mandap-post-l.webp","x":164.17,"y":651.67,"w":82.5,"h":851.67,"bytes":18914},
"mandap-post-r":{"src":"images/mandap/mandap-post-r.webp","x":833.33,"y":651.67,"w":83.33,"h":851.67,"bytes":18686},
"mandap-strings":{"src":"images/mandap/mandap-strings.webp","x":218.33,"y":706.67,"w":643.33,"h":227.5,"bytes":43302},
"mandap-valance":{"src":"images/mandap/mandap-valance.webp","x":196.83,"y":642.5,"w":686.67,"h":98.33,"bytes":18360},
"marigold-a":{"src":"images/sprites/marigold-a.webp","x":-21.5,"y":-21.5,"w":42.92,"h":42.92,"bytes":3542},
"marigold-b":{"src":"images/sprites/marigold-b.webp","x":-21.5,"y":-21.5,"w":42.92,"h":42.92,"bytes":3688},
"marigold-c":{"src":"images/sprites/marigold-c.webp","x":-21.5,"y":-21.5,"w":42.92,"h":42.92,"bytes":3746},
"mote":{"src":"images/sprites/mote.webp","x":-15,"y":-15,"w":30,"h":30,"bytes":2416},
"paan":{"src":"images/sprites/paan.webp","x":-52.5,"y":-120.5,"w":105,"h":130,"bytes":5496},
"paper":{"src":"images/paper.webp","x":0,"y":0,"w":1080,"h":1920,"bytes":150364},
"petal-marigold":{"src":"images/sprites/petal-marigold.webp","x":-15.5,"y":-32,"w":31,"h":64,"bytes":2658},
"petal-pink":{"src":"images/sprites/petal-pink.webp","x":-15.5,"y":-32,"w":31,"h":64,"bytes":2526},
"petal-red":{"src":"images/sprites/petal-red.webp","x":-15.5,"y":-32,"w":31,"h":64,"bytes":2564},
"petal-white":{"src":"images/sprites/petal-white.webp","x":-15.5,"y":-32,"w":31,"h":64,"bytes":2582},
"rose":{"src":"images/sprites/rose.webp","x":-12.67,"y":-12.67,"w":25.33,"h":25.33,"bytes":2024},
"tuberose":{"src":"images/sprites/tuberose.webp","x":-14.67,"y":-16,"w":29.33,"h":32,"bytes":2756}}
```

## Appendix A: scripts/art/common.mjs
```js
// Shared helpers for the generated art. Everything is deterministic (seeded), so a re-run reproduces the same pixels.

export const INK = "#3a2620";

export const rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const r1 = (n) => Math.round(n * 10) / 10;
export const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
export const lerp = (a, b, t) => a + (b - a) * t;

/** Mixes two #rrggbb colours. */
export const mix = (c1, c2, t) => {
  const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = p(c1);
  const b = p(c2);
  return `#${a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, "0")).join("")}`;
};

/**
 * A piece of art to bake. `bounds` is the drawing area in the piece's design coordinates; the baked image is trimmed
 * to its visible pixels and the manifest records where those pixels sit in design coordinates.
 */
export const piece = (name, bounds, body, { scale = 1, quality = 0.86, opaque = false, trim = !opaque, defs = "" } = {}) => ({
  name,
  bounds,
  scale,
  quality,
  trim,
  svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(bounds.w * scale)}" height="${Math.round(bounds.h * scale)}" viewBox="${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}">${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>\n`,
});

export const lin = (id, stops, { x1 = 0, y1 = 0, x2 = 0, y2 = 1, units = "" } = {}) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${units ? ` gradientUnits="${units}"` : ""}>${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}"${a === 1 ? "" : ` stop-opacity="${a}"`}/>`)
    .join("")}</linearGradient>`;

export const rad = (id, stops, { cx = 0.5, cy = 0.5, r = 0.5, fx, fy, units = "" } = {}) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx !== undefined ? ` fx="${fx}" fy="${fy}"` : ""}${units ? ` gradientUnits="${units}"` : ""}>${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}"${a === 1 ? "" : ` stop-opacity="${a}"`}/>`)
    .join("")}</radialGradient>`;

export const blurFilter = (id, sd) =>
  `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

/** Watercolour edge: displaces the source slightly with fractal noise. */
export const wcFilter = (id, scale = 10, freq = 0.02, seed = 7) =>
  `<filter id="${id}" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter>`;

/** Fine paper/fabric grain multiplied into whatever it is applied to (keeps alpha). */
export const grainFilter = (id, amount = 0.18, freq = 0.9, seed = 3) =>
  `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${amount} 0" result="ga"/><feComposite in="ga" in2="SourceGraphic" operator="in" result="gm"/><feBlend in="gm" in2="SourceGraphic" mode="multiply"/></filter>`;

/** A pointed leaf with its base at the origin, pointing up (negative y). */
export const leafPath = (len, wid) =>
  `M0 0C${r1(wid)} ${r1(-len * 0.28)} ${r1(wid * 0.85)} ${r1(-len * 0.72)} 0 ${r1(-len)}C${r1(-wid * 0.85)} ${r1(-len * 0.72)} ${r1(-wid)} ${r1(-len * 0.28)} 0 0Z`;

export const marigold = (R, cx, cy, r, { tone = 0 } = {}) => {
  const outer = ["#e98f1c", "#f2a62a", "#e27d16", "#f0b43c"][tone % 4];
  const inner = ["#f6b847", "#fbc957", "#f3a33a", "#ffd56a"][tone % 4];
  let s = `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${r1(R() * 60)})">`;
  s += `<circle r="${r1(r * 1.02)}" fill="${mix(outer, "#7a3a0c", 0.35)}"/>`;
  for (let ring = 0; ring < 3; ring++) {
    const n = 16 - ring * 4;
    const rr = r * (0.95 - ring * 0.27);
    const col = mix(outer, inner, ring / 2);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 360 + ring * 13 + R() * 8;
      s += `<ellipse cx="0" cy="${r1(-rr * 0.55)}" rx="${r1(rr * 0.24)}" ry="${r1(rr * 0.46)}" transform="rotate(${r1(a)})" fill="${col}" stroke="${mix(col, "#7a3a0c", 0.5)}" stroke-opacity=".55" stroke-width="${r1(Math.max(0.5, r * 0.035))}"/>`;
    }
  }
  s += `<circle r="${r1(r * 0.2)}" fill="#a3561a"/><circle r="${r1(r * 0.1)}" cx="${r1(-r * 0.05)}" cy="${r1(-r * 0.05)}" fill="#f7c35a" opacity=".7"/></g>`;
  return s;
};

export const blossom = (R, cx, cy, r, fill = "#f8f1e6", center = "#e0a83a") => {
  let s = `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${r1(R() * 72)})">`;
  for (let i = 0; i < 5; i++) {
    s += `<ellipse cx="0" cy="${r1(-r * 0.5)}" rx="${r1(r * 0.36)}" ry="${r1(r * 0.54)}" transform="rotate(${i * 72})" fill="${fill}" stroke="${mix(fill, INK, 0.45)}" stroke-opacity=".5" stroke-width="${r1(Math.max(0.6, r * 0.05))}"/>`;
    s += `<ellipse cx="0" cy="${r1(-r * 0.36)}" rx="${r1(r * 0.12)}" ry="${r1(r * 0.3)}" transform="rotate(${i * 72})" fill="#ffffff" opacity=".35"/>`;
  }
  s += `<circle r="${r1(r * 0.2)}" fill="${center}"/></g>`;
  return s;
};

```

## Appendix B: scripts/art/sprites.mjs
```js
// Small sprites moved only by transforms at runtime: petals, gold motes, glows, flames, diya, flower heads, betel leaf.
// Each is drawn around its origin (0,0) in design units; the manifest records the trimmed rectangle around it.
import { INK, blurFilter, lin, marigold, mix, piece, r1, rad, rng } from "./common.mjs";

const PETAL = "M0 -1C0.95 -0.7 0.9 0.5 0 1C-0.9 0.5 -0.95 -0.7 0 -1Z";

const petal = (name, fill, edge) =>
  piece(
    name,
    { x: -24, y: -34, w: 48, h: 68 },
    `<g transform="scale(20 30)"><path d="${PETAL}" fill="url(#pg)" stroke="${edge}" stroke-width="0.05"/><path d="M0 -0.8V0.75" stroke="${INK}" stroke-opacity=".22" stroke-width="0.04"/><path d="M-0.35 -0.55C-0.2 -0.1 -0.2 0.3 -0.1 0.6" stroke="#ffffff" stroke-opacity=".45" stroke-width="0.07" fill="none"/></g>`,
    { scale: 2, defs: lin("pg", [[0, mix(fill, "#ffffff", 0.3)], [1, mix(fill, edge, 0.35)]], { x1: 0, y1: 0, x2: 1, y2: 1 }) },
  );

const tuberose = () =>
  piece(
    "tuberose",
    { x: -16, y: -16, w: 32, h: 32 },
    `${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="0" cy="-7" rx="4.6" ry="8" transform="rotate(${a})" fill="#fbf8ef" stroke="#c8bfa6" stroke-width=".8"/>`).join("")}<circle r="3.6" fill="#efe6c6"/><circle r="1.6" fill="#d5c48a"/>`,
    { scale: 3, defs: "" },
  );

const rose = () =>
  piece(
    "rose",
    { x: -16, y: -16, w: 32, h: 32 },
    `<circle r="12" fill="#9c1b2a"/><path d="M-9 2C-9 -8 -2 -11 3 -9C9 -7 10 0 6 5C2 10 -6 9 -9 2Z" fill="#c22e3f"/><path d="M-4 0C-4 -5 1 -6 3 -3C5 0 2 4 -1 3" stroke="#7c1220" stroke-width="1.6" fill="none"/><path d="M-7 6C-2 11 6 9 9 3" stroke="#7c1220" stroke-width="1.4" fill="none"/>`,
    { scale: 3 },
  );

const marigoldHead = (name, tone, seed) =>
  piece(name, { x: -24, y: -24, w: 48, h: 48 }, marigold(rng(seed), 0, 0, 20, { tone }), { scale: 2.4 });

const mote = () =>
  piece("mote", { x: -16, y: -16, w: 32, h: 32 }, `<circle r="14" fill="url(#mg)"/>`, {
    scale: 2,
    defs: rad("mg", [[0, "#fff7dc", 1], [0.25, "#f5d68a", 0.9], [1, "#d4aa5e", 0]]),
  });

/** Soft warm bloom; scaled up at runtime (a GPU-cheap replacement for big CSS gradients). */
const glow = () =>
  piece("glow", { x: -128, y: -128, w: 256, h: 256 }, `<circle r="128" fill="url(#gg)"/>`, {
    scale: 1,
    trim: false,
    quality: 0.9,
    defs: rad("gg", [[0, "#fbe7a8", 0.95], [0.3, "#f6d37e", 0.55], [0.62, "#f1c463", 0.16], [1, "#f1c463", 0]]),
  });

const flame = () =>
  piece(
    "flame",
    { x: -20, y: -62, w: 40, h: 66 },
    `<g filter="url(#fb)"><path d="M0 0C-15 -10 -12 -30 0 -56C12 -30 15 -10 0 0Z" fill="#ffb347" opacity=".7"/></g><path d="M0 0C-13 -10 -10 -28 0 -50C10 -28 13 -10 0 0Z" fill="url(#fl)"/><path d="M0 -3C-5 -9 -4 -18 0 -28C4 -18 5 -9 0 -3Z" fill="#fff6d0"/><ellipse cx="0" cy="-4" rx="3" ry="4" fill="#5c8ad6" opacity=".55"/>`,
    { scale: 3, defs: `${lin("fl", [[0, "#ffe58a"], [0.55, "#f7a232"], [1, "#de5a1e"]])}${blurFilter("fb", 2.2)}` },
  );

const diyaBowl = () =>
  piece(
    "diya",
    { x: -48, y: -30, w: 96, h: 50 },
    `<path d="M-32 -10C-26 14 26 14 32 -10C18 -17 -18 -17 -32 -10Z" fill="url(#clay)" stroke="${INK}" stroke-width="2.2"/>
<path d="M-32 -10Q0 -22 32 -10Q0 -2 -32 -10Z" fill="#6e3119" stroke="${INK}" stroke-width="1.8"/>
<path d="M-24 -9Q0 -15 24 -9" stroke="#e9b84f" stroke-width="2.4" fill="none" opacity=".75"/>
<path d="M-20 5Q0 11 20 5" stroke="#f0b483" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>
${[-18, -9, 0, 9, 18].map((x) => `<circle cx="${x}" cy="${r1(1 + Math.abs(x) * -0.05)}" r="2" fill="#f3d38a" opacity=".85"/>`).join("")}
<path d="M-35 -10Q-46 -14 -44 -23Q-35 -19 -31 -12" fill="#b5603a" stroke="${INK}" stroke-width="1.8"/>
<path d="M-1 -14L1 -22" stroke="#2a1b14" stroke-width="2.4" stroke-linecap="round"/>`,
    { scale: 2.5, defs: lin("clay", [[0, "#c8703f"], [1, "#8f4528"]]) },
  );

/** A glossy betel (paan) leaf, stalk at the origin, tip pointing up. */
const paan = () =>
  piece(
    "paan",
    { x: -60, y: -126, w: 120, h: 136 },
    `<path d="M0 6V-10" stroke="#3a5a30" stroke-width="5" stroke-linecap="round"/>
<path d="M0 -8C-16 0 -52 -18 -50 -58C-48 -92 -14 -100 0 -118C14 -100 48 -92 50 -58C52 -18 16 0 0 -8Z" fill="url(#leaf)" stroke="#24391f" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M0 -10V-104M0 -32L-26 -50M0 -32L26 -50M0 -56L-30 -74M0 -56L30 -74M0 -80L-20 -94M0 -80L20 -94" stroke="#2c4a26" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
<path d="M-30 -80C-38 -60 -36 -36 -20 -20" stroke="#ffffff" stroke-opacity=".28" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    { scale: 2, defs: lin("leaf", [[0, "#7aa04f"], [0.55, "#4f7a3a"], [1, "#3a5e2e"]], { x1: 0, y1: 0, x2: 1, y2: 1 }) },
  );

export const spriteArt = () => [
  petal("petal-pink", "#ef9faa", "#c4566a"),
  petal("petal-marigold", "#f4ac3a", "#c9701a"),
  petal("petal-white", "#fbf3e4", "#c49a52"),
  petal("petal-red", "#c8303f", "#7c1220"),
  marigoldHead("marigold-a", 0, 11),
  marigoldHead("marigold-b", 1, 12),
  marigoldHead("marigold-c", 3, 13),
  tuberose(),
  rose(),
  mote(),
  glow(),
  flame(),
  diyaBowl(),
  paan(),
];

```

## Appendix C: scripts/art/garden.mjs
```js
// The painted garden (far / mid / near parallax layers), the evening string lights and the paper ground.
// Layers are designed on a 1200×1920 canvas (60 px wider each side than the frame, for parallax drift).
import { INK, blossom, blurFilter, grainFilter, leafPath, lerp, lin, marigold, mix, pick, piece, r1, rad, rng, wcFilter } from "./common.mjs";

const GW = 1200;
const GH = 1920;
const HORIZON = 880;
const GREENS = ["#22352a", "#2f4a35", "#3f5e40", "#557648", "#6f8f52", "#93ab66", "#bccb84"];
const LIGHT = { x: 0.62, y: -0.78 }; // the sun sits up and to the right

const shadeColor = (pal, t) => {
  const i = Math.max(0, Math.min(pal.length - 1.001, t * (pal.length - 1)));
  return mix(pal[Math.floor(i)], pal[Math.ceil(i)], i - Math.floor(i));
};

/**
 * A painterly clump of foliage: a dark mass, then many leaves whose colour follows the light direction, then a few
 * sunlit highlights. Reads as volume rather than flat circles.
 */
const foliage = (R, cx, cy, rx, ry, { pal = GREENS, n = 80, len = [34, 70], haze = null, hazeAmt = 0 } = {}) => {
  const col = (c) => (haze ? mix(c, haze, hazeAmt) : c);
  let s = "";
  // the shadowed core
  for (let i = 0; i < 9; i++) {
    const a = R() * Math.PI * 2;
    const d = R() * 0.45;
    s += `<ellipse cx="${r1(cx + Math.cos(a) * rx * d)}" cy="${r1(cy + Math.sin(a) * ry * d + ry * 0.08)}" rx="${r1(rx * (0.55 + R() * 0.25))}" ry="${r1(ry * (0.5 + R() * 0.25))}" fill="${col(pal[1])}"/>`;
  }
  const leaves = [];
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2;
    const d = Math.sqrt(R());
    const ux = Math.cos(a) * d;
    const uy = Math.sin(a) * d;
    const lit = (ux * LIGHT.x + uy * LIGHT.y) * 0.5 + 0.5; // 0 shadow side … 1 sunlit side
    leaves.push({ x: cx + ux * rx, y: cy + uy * ry, ang: (a * 180) / Math.PI + 90 + (R() - 0.5) * 70, lit: lit * 0.8 + d * 0.15 + R() * 0.15, L: lerp(len[0], len[1], R()) });
  }
  leaves.sort((p, q) => p.lit - q.lit); // sunlit leaves on top
  for (const l of leaves) {
    const c = col(shadeColor(pal, Math.min(1, l.lit)));
    s += `<path d="${leafPath(l.L, l.L * 0.34)}" transform="translate(${r1(l.x)} ${r1(l.y)}) rotate(${r1(l.ang)})" fill="${c}" stroke="${mix(c, INK, 0.5)}" stroke-opacity=".35" stroke-width="1.1"/>`;
  }
  return s;
};

const trunk = (x, baseY, topY, w, lean) => {
  const d = `M${x - w} ${baseY}C${x - w * 0.8} ${baseY - 420} ${x - w * 0.45 + lean * 0.4} ${topY + 380} ${x - w * 0.25 + lean} ${topY}L${x + w * 0.3 + lean} ${topY}C${x + w * 0.5 + lean * 0.4} ${topY + 380} ${x + w * 0.85} ${baseY - 420} ${x + w} ${baseY}Z`;
  let s = `<path d="${d}" fill="url(#bark)" stroke="${INK}" stroke-opacity=".45" stroke-width="2.5"/>`;
  const R = rng(Math.round(x * 7 + baseY));
  for (let i = 0; i < 16; i++) {
    const yy = lerp(baseY - 40, topY + 60, i / 16);
    const xx = x + lerp(0, lean, (baseY - yy) / (baseY - topY)) + (R() - 0.5) * w * 0.9;
    s += `<path d="M${r1(xx - 14)} ${r1(yy)}q${r1(10)} ${r1(-8 - R() * 6)} ${r1(26)} ${r1(-2 + R() * 4)}" stroke="#2c1d14" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
  return s;
};

const branch = (x1, y1, x2, y2, w) =>
  `<path d="M${x1} ${y1}Q${r1((x1 + x2) / 2)} ${r1(Math.min(y1, y2) - 30)} ${x2} ${y2}" stroke="#5b4030" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;

/* ------------------------------------------------------------------ paper */
const paper = () => {
  const defs = `
<filter id="mottle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="3" seed="5"/><feColorMatrix type="matrix" values="0 0 0 0 .75  0 0 0 0 .6  0 0 0 0 .4  1.3 0 0 0 -.5"/></filter>
<filter id="fibre" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.35" numOctaves="2" seed="17"/><feColorMatrix type="matrix" values="0 0 0 0 .36  0 0 0 0 .27  0 0 0 0 .18  1.6 0 0 0 -.86"/></filter>
${rad("vig", [[0.6, "#8a5a3a", 0], [1, "#8a5a3a", 0.3]], { cx: 0.5, cy: 0.46, r: 0.75 })}`;
  const body = `<rect width="1080" height="1920" fill="#f5ebdd"/><rect width="1080" height="1920" filter="url(#mottle)" opacity=".5"/><rect width="1080" height="1920" filter="url(#fibre)" opacity=".55"/><rect width="1080" height="1920" fill="url(#vig)"/>`;
  return piece("paper", { x: 0, y: 0, w: 1080, h: 1920 }, body, { opaque: true, quality: 0.8, defs });
};

/* ------------------------------------------------------------------ far */
const far = () => {
  const R = rng(101);
  const defs = `
${lin("sky", [[0, "#f0d3a0"], [0.5, "#f6e3bd"], [1, "#f5ebdd"]])}
${lin("ground", [[0, "#d3c995"], [0.25, "#b3b678"], [0.7, "#86975a"], [1, "#5f7446"]])}
${lin("hazeband", [[0, "#f6e8c8", 0], [0.5, "#f6e8c8", 0.75], [1, "#f6e8c8", 0]])}
${rad("sun", [[0, "#fff6d8", 1], [0.25, "#fbe3a6", 0.7], [1, "#f3cf86", 0]])}
${blurFilter("b14", 14)}${blurFilter("b5", 5)}${blurFilter("b2", 1.6)}
${wcFilter("wc", 9, 0.02)}${grainFilter("grain", 0.16, 0.85)}`;
  let s = `<g filter="url(#grain)"><rect width="${GW}" height="${HORIZON + 60}" fill="url(#sky)"/>`;
  s += `<circle cx="900" cy="430" r="560" fill="url(#sun)"/>`;
  // soft light shafts from the sun
  s += `<g opacity=".22" filter="url(#b14)">`;
  for (let i = 0; i < 6; i++) {
    const a = 2.2 + i * 0.16 + R() * 0.05;
    s += `<path d="M900 430L${r1(900 + Math.cos(a) * 1500)} ${r1(430 + Math.sin(a) * 1500)}L${r1(900 + Math.cos(a + 0.05) * 1500)} ${r1(430 + Math.sin(a + 0.05) * 1500)}Z" fill="#fff4d2"/>`;
  }
  s += `</g>`;
  // distant hills
  s += `<g filter="url(#b5)"><path d="M0 ${HORIZON - 70}Q240 ${HORIZON - 190} 520 ${HORIZON - 100}T1200 ${HORIZON - 130}V${HORIZON + 60}H0Z" fill="#a9b493" opacity=".55"/>`;
  s += `<path d="M0 ${HORIZON - 30}Q300 ${HORIZON - 120} 660 ${HORIZON - 45}T1200 ${HORIZON - 60}V${HORIZON + 60}H0Z" fill="#8ea17a" opacity=".6"/></g>`;
  // distant tree line, hazed toward the sky colour
  s += `<g filter="url(#b2)">`;
  for (let x = -40; x < GW + 60; x += 70 + R() * 50) {
    const h = 90 + R() * 120;
    const by = HORIZON + 8 + R() * 14;
    s += `<path d="M${r1(x - 4)} ${r1(by)}L${r1(x - 2)} ${r1(by - h * 0.55)}L${r1(x + 3)} ${r1(by - h * 0.55)}L${r1(x + 5)} ${r1(by)}Z" fill="#6d6150" opacity=".5"/>`;
    s += foliage(R, x, by - h * 0.7, h * 0.32, h * 0.3, { n: 26, len: [14, 26], haze: "#e8dcb5", hazeAmt: 0.55 });
  }
  s += `</g><rect y="${HORIZON - 60}" width="${GW}" height="140" fill="url(#hazeband)"/>`;
  // meadow
  s += `<rect y="${HORIZON}" width="${GW}" height="${GH - HORIZON}" fill="url(#ground)"/><g filter="url(#wc)" opacity=".75">`;
  for (let i = 0; i < 34; i++) {
    const y = HORIZON + 20 + R() * (GH - HORIZON);
    const t = (y - HORIZON) / (GH - HORIZON);
    s += `<ellipse cx="${r1(R() * GW)}" cy="${r1(y)}" rx="${r1(60 + t * 240)}" ry="${r1(10 + t * 48)}" fill="${pick(R, ["#93a463", "#c2bf82", "#718c56", "#d0c690", "#5f7a49"])}" fill-opacity=".38"/>`;
  }
  s += `</g><g stroke-linecap="round" fill="none">`;
  for (let i = 0; i < 900; i++) {
    const y = HORIZON + 10 + Math.pow(R(), 0.75) * (GH - HORIZON);
    const t = (y - HORIZON) / (GH - HORIZON);
    const x = R() * GW;
    const h = 5 + t * 40 * (0.5 + R());
    const c = shadeColor(GREENS, 0.3 + R() * 0.6);
    s += `<path d="M${r1(x)} ${r1(y)}q${r1((R() - 0.5) * 8)} ${r1(-h * 0.6)} ${r1((R() - 0.4) * 14)} ${r1(-h)}" stroke="${c}" stroke-opacity="${r1(0.3 + R() * 0.3)}" stroke-width="${r1(1 + t * 2.4)}"/>`;
  }
  s += `</g>`;
  for (let i = 0; i < 300; i++) {
    const y = HORIZON + 30 + Math.pow(R(), 0.9) * (GH - HORIZON - 30);
    const t = (y - HORIZON) / (GH - HORIZON);
    const x = R() * GW;
    const rr = 2.5 + Math.pow(t, 1.5) * 18;
    const k = R();
    s += k < 0.45 ? marigold(R, x, y, rr, { tone: i }) : k < 0.78 ? blossom(R, x, y, rr) : blossom(R, x, y, rr, "#dc7488", "#f3cf86");
  }
  s += `</g>`;
  return piece("garden-far", { x: 0, y: 0, w: GW, h: GH }, s, { opaque: true, quality: 0.82, defs });
};

/* ------------------------------------------------------------------ mid (framing trees and bushes) */
const bush = (R, cx, cy, r) => {
  let b = foliage(R, cx, cy, r * 1.15, r * 0.7, { n: Math.round(r * 0.7), len: [26, 46] });
  for (let i = 0; i < Math.round(r / 12); i++) {
    const a = R() * Math.PI * 2;
    const d = Math.sqrt(R()) * 0.85;
    const px = cx + Math.cos(a) * d * r * 1.05;
    const py = cy + Math.sin(a) * d * r * 0.55 - r * 0.12;
    const k = R();
    b += k < 0.5 ? marigold(R, px, py, 14 + R() * 9, { tone: i }) : k < 0.8 ? blossom(R, px, py, 12 + R() * 7) : blossom(R, px, py, 12 + R() * 7, "#dc7488", "#f3cf86");
  }
  return b;
};

const midSide = (side) => {
  const R = rng(side === "l" ? 202 : 203);
  const left = side === "l";
  const x = left ? 50 : GW - 50;
  const s = left ? 1 : -1;
  const defs = `${lin("bark", [[0, "#7a5a40"], [0.45, "#5a4030"], [1, "#3b2a1e"]], { x1: 0, y1: 0, x2: 1, y2: 0 })}${wcFilter("wc2", 6, 0.03, left ? 3 : 4)}${grainFilter("grain", 0.14, 0.9, left ? 8 : 9)}`;
  let b = `<g filter="url(#grain)"><g filter="url(#wc2)">`;
  b += trunk(x, left ? 1130 : 1090, left ? 160 : 230, 78, s * 60);
  b += branch(x + s * 40, 520, x + s * 260, 360, 18) + branch(x + s * 30, 700, x + s * 210, 640, 13);
  // the canopy: several overlapping clumps, darker underneath
  const clumps = left
    ? [[90, 300, 260, 200], [260, 200, 200, 150], [300, 420, 190, 130], [40, 560, 200, 150], [380, 300, 140, 110], [170, 110, 220, 140]]
    : [[1110, 330, 260, 200], [930, 240, 200, 150], [900, 450, 190, 130], [1150, 600, 200, 150], [820, 340, 130, 100], [1030, 140, 220, 140]];
  for (const [cx, cy, rx, ry] of clumps) b += foliage(R, cx, cy, rx, ry, { n: Math.round(rx * 0.75), len: [36, 70] });
  b += `</g>`;
  // flowering bushes at the foot of the tree
  b += left ? bush(R, 100, 1160, 190) + bush(R, 270, 1010, 110) : bush(R, 1110, 1130, 200) + bush(R, 950, 1000, 120);
  b += `</g>`;
  const bounds = left ? { x: 0, y: 0, w: 560, h: 1400 } : { x: 640, y: 0, w: 560, h: 1400 };
  return piece(`garden-mid-${side}`, bounds, b, { quality: 0.84, defs });
};

/* ------------------------------------------------------------------ near (foreground framing) */
const nearSide = (side) => {
  const R = rng(side === "l" ? 303 : 304);
  const left = side === "l";
  const s = left ? 1 : -1;
  const X = (x) => (left ? x : GW - x);
  const defs = `${lin("leafg", [[0, "#2a4130"], [1, "#4d6d46"]])}${grainFilter("grain", 0.14, 0.9, left ? 11 : 12)}`;
  let b = `<g filter="url(#grain)">`;
  const fan = (cx, cy, n, len, spread, base) => {
    let f = "";
    for (let i = 0; i < n; i++) {
      const a = base + (i / (n - 1) - 0.5) * spread;
      const L = len * (0.7 + R() * 0.45);
      const W = 46 + R() * 34;
      const c = shadeColor(GREENS.slice(0, 5), 0.25 + R() * 0.75);
      f += `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${r1(a)})"><path d="${leafPath(L, W)}" fill="${c}" stroke="${INK}" stroke-opacity=".45" stroke-width="1.8"/>`;
      f += `<path d="M0 -4L0 ${r1(-L * 0.9)}" stroke="${mix(c, "#ffffff", 0.25)}" stroke-opacity=".7" stroke-width="2" fill="none"/>`;
      for (let k = 1; k < 6; k++) {
        const y = -L * (k / 6.5);
        f += `<path d="M0 ${r1(y)}l${r1(W * 0.55)} ${r1(-L * 0.08)}M0 ${r1(y)}l${r1(-W * 0.55)} ${r1(-L * 0.08)}" stroke="${mix(c, "#ffffff", 0.18)}" stroke-opacity=".45" stroke-width="1.3" fill="none"/>`;
      }
      f += `<path d="${leafPath(L * 0.92, W * 0.35)}" transform="translate(${r1(-W * 0.18)} 0)" fill="#ffffff" opacity=".07"/></g>`;
    }
    return f;
  };
  b += fan(X(40), 1960, 11, 560, 130, s * 28);
  b += fan(X(-30), 1760, 6, 360, 90, s * 55);
  for (let i = 0; i < 7; i++) {
    const x = X(30 + R() * 330);
    const y = 1700 + R() * 190;
    b += R() < 0.6 ? marigold(R, x, y, 34 + R() * 24, { tone: i }) : blossom(R, x, y, 30 + R() * 18, R() < 0.5 ? "#f8f1e6" : "#c4566a");
  }
  // foliage hanging from the top corner
  for (let i = 0; i < 6; i++) {
    const L = 150 + R() * 120;
    const c = shadeColor(GREENS, 0.2 + R() * 0.6);
    b += `<g transform="translate(${r1(X(R() * 230))} -10) rotate(${r1(s * 160 + (R() - 0.5) * 60)})"><path d="${leafPath(L, 28 + R() * 12)}" fill="${c}" stroke="${INK}" stroke-opacity=".4" stroke-width="1.6"/><path d="M0 -3L0 ${r1(-L * 0.88)}" stroke="#ffffff" stroke-opacity=".25" stroke-width="1.4" fill="none"/></g>`;
  }
  b += `</g>`;
  const bounds = left ? { x: -60, y: -40, w: 620, h: 1960 } : { x: 640, y: -40, w: 620, h: 1960 };
  return piece(`garden-near-${side}`, bounds, b, { quality: 0.84, defs });
};

/* ------------------------------------------------------------------ evening string lights */
const lights = () => {
  const R = rng(404);
  const defs = `${blurFilter("glow", 7)}`;
  let glow = "";
  let bulbs = "";
  let wires = "";
  const strand = (x1, y1, x2, y2, sag, n) => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push({ x: lerp(x1, x2, t), y: lerp(y1, y2, t) + Math.sin(Math.PI * t) * sag });
    }
    wires += `<path d="M${pts.map((p) => `${r1(p.x)} ${r1(p.y)}`).join("L")}" stroke="#3b2a1e" stroke-opacity=".55" stroke-width="2" fill="none"/>`;
    for (const p of pts.slice(1, -1)) {
      const warm = pick(R, ["#ffe7a3", "#ffd77a", "#fff2c6", "#ffcf8a"]);
      glow += `<circle cx="${r1(p.x)}" cy="${r1(p.y + 7)}" r="16" fill="${warm}" opacity=".9"/>`;
      bulbs += `<ellipse cx="${r1(p.x)}" cy="${r1(p.y + 7)}" rx="4.5" ry="6.5" fill="${warm}"/><circle cx="${r1(p.x - 1.2)}" cy="${r1(p.y + 5)}" r="1.8" fill="#ffffff"/>`;
    }
  };
  strand(150, 300, 1050, 320, 150, 26);
  strand(220, 520, 980, 540, 110, 20);
  strand(130, 260, 70, 900, 40, 14);
  strand(1070, 280, 1130, 900, -40, 14);
  const body = `<g filter="url(#glow)">${glow}</g>${wires}${bulbs}`;
  return piece("garden-lights", { x: 0, y: 200, w: GW, h: 760 }, body, { quality: 0.85, defs });
};

export const gardenArt = () => [paper(), far(), midSide("l"), midSide("r"), nearSide("l"), nearSide("r"), lights()];

```

## Appendix D: scripts/art/mandap.mjs
```js
// The wedding mandap (chhadnatala), baked as separate parts so each can be built with a transform:
// floor alpana, dome canopy, valance, two banana-stem posts, hanging marigold strings, banana leaves with mangal ghat.
// Coordinates are composition coordinates (1080×1920).
import { INK, blossom, grainFilter, leafPath, lin, marigold, mix, piece, r1, rad, rng } from "./common.mjs";

const CX = 540;
const BASE = 1500;
const POSTS = [205, 875];
const ARCH_CY = 650;
const ARCH_RX = 330;
const ARCH_RY = 235;
const GOLD = "#c9a052";
const GOLD_L = "#f0d48a";
const SINDOOR = "#7d1a28";

const floor = () => {
  const R = rng(51);
  let s = `<g transform="translate(${CX} ${BASE + 40})">`;
  s += `<ellipse rx="440" ry="84" fill="url(#ochre)"/>`;
  s += `<ellipse rx="430" ry="80" fill="none" stroke="#fbf3e0" stroke-width="5"/>`;
  s += `<ellipse rx="400" ry="70" fill="none" stroke="#fbf3e0" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>`;
  s += `<ellipse rx="320" ry="52" fill="none" stroke="#fbf3e0" stroke-width="3.5"/>`;
  // rice-paste lotus petals around the ring
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const x = Math.cos(a) * 362;
    const y = Math.sin(a) * 61;
    s += `<g transform="translate(${r1(x)} ${r1(y)}) scale(1 .2) rotate(${r1((a * 180) / Math.PI + 90)})"><path d="M0 0C14 -14 14 -36 0 -52C-14 -36 -14 -14 0 0Z" fill="none" stroke="#fbf3e0" stroke-width="12"/></g>`;
  }
  // the central lotus where the couple stand
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 360;
    s += `<g transform="scale(1 .2) rotate(${a})"><path d="M0 0C30 -40 30 -120 0 -170C-30 -120 -30 -40 0 0Z" fill="#fbf3e0" fill-opacity=".2" stroke="#fbf3e0" stroke-width="9"/></g>`;
  }
  for (let i = 0; i < 40; i++) {
    const a = R() * Math.PI * 2;
    s += `<circle cx="${r1(Math.cos(a) * 280)}" cy="${r1(Math.sin(a) * 46)}" r="2.6" fill="#fbf3e0" opacity=".8"/>`;
  }
  s += `</g>`;
  return piece("mandap-floor", { x: 80, y: BASE - 60, w: 920, h: 200 }, `<g filter="url(#grain)">${s}</g>`, {
    scale: 1,
    defs: `${rad("ochre", [[0, "#c8643d", 0.55], [0.75, "#a8482c", 0.45], [1, "#8f3b26", 0.2]])}${grainFilter("grain", 0.2)}`,
  });
};

const dome = () => {
  let s = `<path d="M${CX - ARCH_RX} ${ARCH_CY}A${ARCH_RX} ${ARCH_RY} 0 0 1 ${CX + ARCH_RX} ${ARCH_CY}Z" fill="url(#velvet)" stroke="${INK}" stroke-opacity=".7" stroke-width="3"/>`;
  // gold ribs and a border of zari
  for (let i = 0; i < 11; i++) {
    const a = Math.PI - ((i + 1) / 12) * Math.PI;
    s += `<path d="M${CX} ${ARCH_CY}L${r1(CX + ARCH_RX * Math.cos(a))} ${r1(ARCH_CY - ARCH_RY * Math.sin(a))}" stroke="${GOLD}" stroke-width="3" stroke-opacity=".6"/>`;
  }
  for (const k of [0.94, 0.62, 0.34]) {
    s += `<path d="M${r1(CX - ARCH_RX * k)} ${ARCH_CY}A${r1(ARCH_RX * k)} ${r1(ARCH_RY * k)} 0 0 1 ${r1(CX + ARCH_RX * k)} ${ARCH_CY}" fill="none" stroke="${GOLD_L}" stroke-width="${k === 0.94 ? 6 : 3}" stroke-opacity=".75" stroke-dasharray="${k === 0.94 ? "none" : "2 12"}" stroke-linecap="round"/>`;
  }
  // buti dots on the velvet
  const R = rng(61);
  for (let i = 0; i < 70; i++) {
    const a = Math.PI * R();
    const d = 0.15 + R() * 0.75;
    s += `<circle cx="${r1(CX + Math.cos(a) * ARCH_RX * d)}" cy="${r1(ARCH_CY - Math.sin(a) * ARCH_RY * d)}" r="2.6" fill="${GOLD_L}" opacity=".7"/>`;
  }
  // sheen
  s += `<path d="M${CX - ARCH_RX * 0.8} ${ARCH_CY - 20}A${ARCH_RX * 0.8} ${ARCH_RY * 0.85} 0 0 1 ${CX + ARCH_RX * 0.1} ${ARCH_CY - ARCH_RY * 0.85}" stroke="#ffffff" stroke-opacity=".12" stroke-width="40" fill="none" stroke-linecap="round"/>`;
  // kalash finial
  s += `<g transform="translate(${CX} ${ARCH_CY - ARCH_RY})"><path d="M-6 0V-16" stroke="${GOLD}" stroke-width="5"/><path d="M-22 -16C-26 -46 26 -46 22 -16Z" fill="url(#goldv)" stroke="${INK}" stroke-width="2"/><path d="M-12 -40C-10 -50 10 -50 12 -40" fill="${GOLD_L}" stroke="${INK}" stroke-width="1.5"/><circle cy="-60" r="10" fill="url(#goldv)" stroke="${INK}" stroke-width="1.6"/><path d="M0 -70V-86" stroke="${GOLD}" stroke-width="3"/></g>`;
  return piece("mandap-dome", { x: CX - ARCH_RX - 10, y: ARCH_CY - ARCH_RY - 100, w: ARCH_RX * 2 + 20, h: ARCH_RY + 110 }, `<g filter="url(#grain)">${s}</g>`, {
    scale: 1.2,
    defs: `${lin("velvet", [[0, "#5a0f1c"], [0.6, "#7e1a29"], [1, "#9a2636"]])}${lin("goldv", [[0, "#f3d98f"], [1, "#a8802f"]])}${grainFilter("grain", 0.18)}`,
  });
};

const valance = () => {
  const x0 = CX - ARCH_RX - 10;
  const W = ARCH_RX * 2 + 20;
  let s = `<rect x="${x0}" y="${ARCH_CY - 4}" width="${W}" height="50" fill="url(#val)" stroke="${INK}" stroke-width="3"/>`;
  s += `<rect x="${x0}" y="${ARCH_CY + 4}" width="${W}" height="7" fill="${GOLD}"/><rect x="${x0}" y="${ARCH_CY + 34}" width="${W}" height="6" fill="${GOLD}"/>`;
  for (let i = 0; i < 26; i++) {
    const x = x0 + 14 + i * ((W - 28) / 25);
    s += `<path d="M${r1(x)} ${ARCH_CY + 22}l7 -7l7 7l-7 7Z" fill="${GOLD_L}" opacity=".85"/>`;
  }
  const n = 24;
  for (let i = 0; i < n; i++) {
    const w = W / n;
    const x = x0 + i * w;
    s += `<path d="M${r1(x)} ${ARCH_CY + 46}q${r1(w / 2)} 38 ${r1(w)} 0Z" fill="${i % 2 ? GOLD : SINDOOR}" stroke="${INK}" stroke-opacity=".6" stroke-width="1.8"/>`;
    s += `<path d="M${r1(x + w / 2)} ${ARCH_CY + 64}v16" stroke="${GOLD}" stroke-width="2"/><circle cx="${r1(x + w / 2)}" cy="${ARCH_CY + 84}" r="4.5" fill="${i % 2 ? SINDOOR : GOLD_L}" stroke="${INK}" stroke-width="1"/>`;
  }
  return piece("mandap-valance", { x: x0 - 4, y: ARCH_CY - 10, w: W + 8, h: 104 }, s, {
    scale: 1.2,
    defs: lin("val", [[0, "#8e1c2c"], [1, "#6a1220"]]),
  });
};

const post = (side) => {
  const px = POSTS[side === "l" ? 0 : 1];
  const top = ARCH_CY + 5;
  const R = rng(side === "l" ? 71 : 72);
  let s = `<path d="M${px - 22} ${BASE}L${px - 16} ${top}L${px + 16} ${top}L${px + 22} ${BASE}Z" fill="url(#stem)" stroke="${INK}" stroke-width="3"/>`;
  for (let i = 0; i < 9; i++) {
    const y = lerpN(BASE - 40, top + 40, i / 8);
    s += `<path d="M${px - 18} ${r1(y)}Q${px} ${r1(y + 10)} ${px + 18} ${r1(y)}" stroke="#4d6b3a" stroke-opacity=".6" stroke-width="2" fill="none"/>`;
  }
  for (const f of [0.18, 0.5, 0.82]) {
    const y = BASE - (BASE - top) * f;
    s += `<rect x="${px - 22}" y="${r1(y - 6)}" width="44" height="12" rx="3" fill="url(#goldb)" stroke="${INK}" stroke-opacity=".6" stroke-width="1.6"/>`;
  }
  // a marigold and tuberose garland spiralling up the pillar
  for (let i = 0; i < 30; i++) {
    const f = i / 29;
    const y = BASE - 30 - f * (BASE - top - 60);
    const x = px + Math.sin(f * Math.PI * 7 + (side === "l" ? 0 : 1)) * 26;
    s += i % 4 === 3 ? blossom(R, x, y, 9, "#fbf8ef", "#d5c48a") : marigold(R, x, y, 13, { tone: i });
  }
  return piece(`mandap-post-${side}`, { x: px - 50, y: top - 10, w: 100, h: BASE - top + 20 }, s, {
    scale: 1.2,
    defs: `${lin("stem", [[0, "#a7b56f"], [0.5, "#7f9554"], [1, "#56693c"]], { x1: 0, y1: 0, x2: 1, y2: 0 })}${lin("goldb", [[0, "#f3d98f"], [1, "#a8802f"]])}`,
  });
};

const lerpN = (a, b, t) => a + (b - a) * t;

const banana = (side) => {
  const px = POSTS[side === "l" ? 0 : 1];
  const m = side === "l" ? 1 : -1;
  let s = "";
  [-64, -36, -10, 18, 46].forEach((ang, i) => {
    const L = 230 + (i % 2) * 30;
    const c = i % 2 ? "#4f6b4a" : "#60794f";
    s += `<g transform="translate(${px} ${BASE + 2}) rotate(${ang * m})"><path d="${leafPath(L, 30 + i * 2)}" fill="${c}" stroke="${INK}" stroke-opacity=".5" stroke-width="2"/><path d="M0 -4V${-L + 10}" stroke="#a7b56f" stroke-width="2.4"/>${Array.from({ length: 8 }, (_, k) => `<path d="M0 ${-20 - k * (L / 9)}l${24} ${-14}M0 ${-20 - k * (L / 9)}l-24 -14" stroke="#3b5536" stroke-opacity=".45" stroke-width="1.4"/>`).join("")}</g>`;
  });
  // mangal ghat: a brass pot with mango leaves and a coconut, beside the post
  const gx = px + m * 70;
  const gy = BASE + 10;
  s += `<g transform="translate(${gx} ${gy})">`;
  for (let i = 0; i < 5; i++) s += `<g transform="translate(0 -62) rotate(${-50 + i * 25})"><path d="${leafPath(46, 11)}" fill="#3f6b36" stroke="${INK}" stroke-opacity=".5" stroke-width="1.4"/></g>`;
  s += `<ellipse cx="0" cy="-72" rx="16" ry="18" fill="#7a4a24" stroke="${INK}" stroke-width="1.8"/><path d="M-6 -86q6 -8 12 0" stroke="#a5713c" stroke-width="2" fill="none"/>`;
  s += `<path d="M-14 -58C-34 -50 -36 -8 -18 0H18C36 -8 34 -50 14 -58Z" fill="url(#brass)" stroke="${INK}" stroke-width="2"/><rect x="-16" y="-62" width="32" height="7" rx="3" fill="url(#brass)" stroke="${INK}" stroke-width="1.5"/>`;
  s += `<path d="M-22 -30h44" stroke="${SINDOOR}" stroke-width="3"/><circle cx="0" cy="-30" r="5" fill="${SINDOOR}"/><path d="M-8 -20l8 -10l8 10" stroke="#fbf3e0" stroke-width="2" fill="none"/></g>`;
  const bx = side === "l" ? px - 270 : px - 150;
  return piece(`mandap-leaves-${side}`, { x: bx, y: BASE - 280, w: 420, h: 310 }, s, {
    scale: 1,
    defs: lin("brass", [[0, "#f0cc6c"], [0.5, "#c9962f"], [1, "#8a6420"]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
  });
};

const strings = () => {
  const R = rng(81);
  let s = "";
  for (let i = 0; i < 13; i++) {
    const x = CX - ARCH_RX + 22 + (i * (ARCH_RX * 2 - 44)) / 12;
    const len = 100 + ((i * 37) % 5) * 26 + (i === 6 ? 40 : 0);
    s += `<path d="M${r1(x)} ${ARCH_CY + 60}V${r1(ARCH_CY + 60 + len)}" stroke="#7a5a30" stroke-width="1.4"/>`;
    const n = Math.floor(len / 22);
    for (let j = 0; j < n; j++) {
      const y = ARCH_CY + 70 + j * 22;
      s += j % 3 === 2 ? blossom(R, x, y, 7.5, "#fbf8ef", "#d5c48a") : marigold(R, x, y, 11, { tone: i + j });
    }
    // little brass bell at the end
    const ey = ARCH_CY + 70 + n * 22;
    s += `<path d="M${r1(x - 6)} ${ey + 10}Q${r1(x)} ${ey - 6} ${r1(x + 6)} ${ey + 10}Z" fill="#d7aa45" stroke="${INK}" stroke-width="1.2"/><circle cx="${r1(x)}" cy="${ey + 12}" r="2" fill="#7a5a30"/>`;
  }
  return piece("mandap-strings", { x: CX - ARCH_RX, y: ARCH_CY + 50, w: ARCH_RX * 2, h: 260 }, s, { scale: 1.2 });
};

export const mandapArt = () => [floor(), dome(), valance(), post("l"), post("r"), banana("l"), banana("r"), strings()];

void mix;

```

## Appendix E: scripts/art/characters.mjs
```js
// Deep and Titas, as a cut-out puppet: every part is painted here in FIGURE coordinates (origin between the feet,
// y up is negative) in its rest pose and baked separately, so the runtime rig moves them with CSS transforms only.
// The geometry constants below are mirrored in src/remotion/rig/skeleton.ts — keep them in sync.
// Faces (eyes, brows, mouth) are NOT baked: they stay vector so expressions can change (see WeddingCouple.tsx).
import { INK, grainFilter, lin, mix, piece, r1, rad, rng } from "./common.mjs";

const SCALE = 1.6;
const GOLD = "#d2a74e";
const GOLD_L = "#f4da92";
const GOLD_D = "#94702c";
const HAIR = "#1b1210";
const RED = "#a3162a";
const RED_D = "#6e0c1a";
const RED_L = "#c8313f";

export const SKIN = {
  groom: { base: "#c98d5e", light: "#e2a97a", shade: "#a26a42" },
  bride: { base: "#dba27a", light: "#efc29a", shade: "#b77e56" },
};

/* --- skeleton (rest pose), shared with the runtime rig --- */
export const BONES = {
  groom: { shoulder: { x: 62, y: -496 }, elbow: { x: 72, y: -384 }, wrist: { x: 78, y: -282 } },
  bride: { shoulder: { x: 54, y: -490 }, elbow: { x: 62, y: -382 }, wrist: { x: 68, y: -286 } },
};

const OUT = `stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"`;
const OUT_T = `stroke="${INK}" stroke-opacity=".55" stroke-width="1.3" stroke-linejoin="round"`;

/** A group whose local +y runs from `a` to `b` (a bone). */
const bone = (a, b, body) => {
  const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI - 90;
  return `<g transform="translate(${a.x} ${a.y}) rotate(${r1(ang)})">${body}</g>`;
};
const len = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

const skinDefs = (who) => {
  const s = SKIN[who];
  return `${lin(`sk-${who}`, [[0, s.light], [0.45, s.base], [1, s.shade]], { x1: 0, y1: 0, x2: 1, y2: 0 })}${rad(`skf-${who}`, [[0, s.light], [0.55, s.base], [1, s.shade]], { cx: 0.38, cy: 0.38, r: 0.75 })}`;
};

const fabric = (id, light, base, shade) => lin(id, [[0, light], [0.4, base], [1, shade]], { x1: 0, y1: 0, x2: 1, y2: 0 });

/* ------------------------------------------------------------------ hands */
const hand = (who, L, { alta = false } = {}) => {
  const s = SKIN[who];
  const y0 = L - 4;
  return `<path d="M-9 ${y0} C-12 ${y0 + 10} -12 ${y0 + 22} -8 ${y0 + 31} C-5 ${y0 + 37} 4 ${y0 + 37} 7 ${y0 + 31} C11 ${y0 + 23} 11 ${y0 + 10} 8 ${y0}Z" fill="url(#sk-${who})" ${OUT}/>
<path d="M-8 ${y0 + 7} C-15 ${y0 + 10} -17 ${y0 + 18} -12 ${y0 + 22}" fill="${s.base}" ${OUT}/>
<path d="M-3 ${y0 + 22}V${y0 + 32}M1 ${y0 + 22}V${y0 + 33}M5 ${y0 + 21}V${y0 + 30}" stroke="${s.shade}" stroke-width="1.2" stroke-linecap="round"/>
${alta ? `<path d="M-8 ${y0 + 31} C-5 ${y0 + 37} 4 ${y0 + 37} 7 ${y0 + 31}" stroke="#c1121f" stroke-width="3.2" fill="none" stroke-linecap="round"/><circle cx="0" cy="${y0 + 16}" r="3.4" fill="#c1121f" opacity=".75"/>` : ""}`;
};

/* ------------------------------------------------------------------ groom */
const groomUpperArm = () => {
  const { shoulder: S, elbow: E } = BONES.groom;
  const L = len(S, E);
  const body = `<path d="M-17 -4 C-17 -18 17 -18 17 -4 L14.5 ${L} C14.5 ${L + 12} -14.5 ${L + 12} -14.5 ${L}Z" fill="url(#silk)" ${OUT}/>
<path d="M-6 6 C-4 ${L * 0.4} -8 ${L * 0.7} -5 ${L}" stroke="${mix("#f3e6c8", INK, 0.25)}" stroke-width="1.6" fill="none" opacity=".6"/>
<path d="M8 10 C10 ${L * 0.5} 6 ${L * 0.8} 9 ${L + 4}" stroke="${mix("#f3e6c8", INK, 0.3)}" stroke-width="1.4" fill="none" opacity=".5"/>`;
  return bone(S, E, body);
};

const groomForearm = () => {
  const { elbow: E, wrist: W } = BONES.groom;
  const L = len(E, W);
  const body = `${hand("groom", L)}
<path d="M-14.5 -2 C-14.5 -14 14.5 -14 14.5 -2 L13 ${L - 6} L-13 ${L - 6}Z" fill="url(#silk)" ${OUT}/>
<path d="M2 8 C0 ${L * 0.4} 4 ${L * 0.7} 1 ${L - 10}" stroke="${mix("#f3e6c8", INK, 0.28)}" stroke-width="1.4" fill="none" opacity=".55"/>
<rect x="-14" y="${L - 16}" width="28" height="12" rx="3" fill="url(#gold)" ${OUT_T}/>
${[-8, -3, 2, 7].map((x) => `<circle cx="${x}" cy="${L - 10}" r="1.6" fill="${RED}"/>`).join("")}`;
  return bone(E, W, body);
};

const groomHead = () => {
  const sk = SKIN.groom;
  let s = `<ellipse cx="-43" cy="-598" rx="8" ry="14" fill="${sk.base}" ${OUT}/><ellipse cx="43" cy="-598" rx="8" ry="14" fill="${sk.shade}" ${OUT}/>
<path d="M-44 -598q4 -6 2 -10M44 -598q-4 -6 -2 -10" stroke="${sk.shade}" stroke-width="1.6" fill="none"/>
<path d="M0 -652C-26 -652 -43 -634 -43 -606C-43 -584 -38 -566 -26 -555C-17 -548 -8 -545 0 -545C8 -545 17 -548 26 -555C38 -566 43 -584 43 -606C43 -634 26 -652 0 -652Z" fill="url(#skf-groom)" ${OUT}/>
<path d="M26 -555C38 -566 43 -584 43 -606C40 -588 34 -570 20 -558Z" fill="${sk.shade}" opacity=".45"/>
<path d="M-1 -598C-3 -586 -6 -578 -4 -573" stroke="${sk.shade}" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M-8 -572Q-4 -567 0 -569Q4 -567 8 -572" stroke="${mix(sk.shade, INK, 0.3)}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<ellipse cx="-2" cy="-576" rx="2.5" ry="1.6" fill="${sk.light}" opacity=".8"/>
<path d="M-17 -563C-10 -569 -3 -567 0 -564C3 -567 10 -569 17 -563C12 -561 5 -561.5 0 -562C-5 -561.5 -12 -561 -17 -563Z" fill="${HAIR}"/>
<path d="M-12 -548Q0 -543 12 -548" stroke="${sk.shade}" stroke-width="1.6" fill="none" opacity=".6"/>`;
  // hair: hairline and sideburns (the topor covers the crown)
  s += `<path d="M-44 -604C-48 -640 -30 -666 0 -666C30 -666 48 -640 44 -604C42 -620 37 -632 29 -638C14 -633 -14 -633 -29 -638C-37 -632 -42 -620 -44 -604Z" fill="${HAIR}"/>
<path d="M-26 -640C-10 -646 12 -646 26 -640" stroke="#4a3830" stroke-width="2" fill="none" opacity=".7"/>
<path d="M-43 -612L-41 -586L-37 -588L-38 -612Z" fill="${HAIR}"/><path d="M43 -612L41 -586L37 -588L38 -612Z" fill="${HAIR}"/>`;
  // chandan: an arc of dots over each brow and a mark at the centre of the forehead
  for (const side of [-1, 1]) {
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      const x = side * (7 + t * 30);
      const y = -621 - Math.sin(t * Math.PI) * 6 + t * 3;
      s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${k % 2 ? 1.5 : 2}" fill="#fff8ea" stroke="${GOLD_D}" stroke-width=".5"/>`;
    }
  }
  s += `<path d="M0 -632V-622" stroke="#fff8ea" stroke-width="3.6" stroke-linecap="round"/><circle cx="0" cy="-635" r="2.4" fill="${RED}"/>`;
  return s;
};

const topor = () => {
  const R = rng(91);
  let s = `<path d="M-74 -652C-90 -720 -60 -800 0 -812C60 -800 90 -720 74 -652Z" fill="url(#shola)" ${OUT}/>`;
  // scalloped edge of the back fan
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI * (0.06 + (i / 16) * 0.88);
    const x = -Math.cos(a) * 80;
    const y = -652 - Math.sin(a) * 158;
    s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="6" fill="#fbf7ec" ${OUT_T}/>`;
  }
  // the tall cone
  s += `<path d="M-52 -648C-56 -702 -30 -792 0 -886C30 -792 56 -702 52 -648Z" fill="url(#shola)" ${OUT}/>
<path d="M14 -880C26 -790 48 -702 50 -650L30 -650C30 -710 20 -790 6 -870Z" fill="#d9cbaa" opacity=".45"/>`;
  // tiers of cut-work
  [-684, -722, -760, -798, -836].forEach((y, i) => {
    const w = 48 - i * 9;
    s += `<path d="M${-w} ${y}Q0 ${y + 10} ${w} ${y}" stroke="${GOLD_D}" stroke-width="2.2" fill="none"/>`;
    for (let k = -2; k <= 2; k++) {
      if (Math.abs(k) * 12 > w) continue;
      s += `<path d="M${k * 12 - 6} ${y - 4}q6 -12 12 0" stroke="${GOLD_D}" stroke-width="1.6" fill="none"/><circle cx="${k * 12}" cy="${y - 13}" r="1.8" fill="${i % 2 ? RED : GOLD}"/>`;
    }
  });
  for (let i = 0; i < 26; i++) {
    const t = R();
    const y = -660 - t * 210;
    const half = 50 * (1 - t * 0.92);
    s += `<circle cx="${r1((R() - 0.5) * 2 * half * 0.8)}" cy="${r1(y)}" r="1.2" fill="${GOLD}" opacity=".8"/>`;
  }
  // finial and the gold band that sits on the forehead
  s += `<circle cx="0" cy="-890" r="7" fill="url(#gold)" ${OUT_T}/><path d="M0 -897V-914" stroke="${GOLD}" stroke-width="2.6"/><path d="M0 -914l-5 -8M0 -914l5 -8" stroke="${RED}" stroke-width="2"/>
<path d="M-56 -640Q0 -626 56 -640L54 -656Q0 -644 -54 -656Z" fill="url(#gold)" ${OUT}/>
${[-40, -20, 0, 20, 40].map((x) => `<circle cx="${x}" cy="${r1(-644 + Math.abs(x) * 0.08)}" r="3.2" fill="${RED}" stroke="${GOLD_D}" stroke-width=".8"/>`).join("")}
${[-1, 1].map((m) => `<path d="M${m * 54} -644C${m * 62} -626 ${m * 60} -606 ${m * 56} -590" stroke="#fbf7ec" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="${m * 56}" cy="-588" r="3" fill="${GOLD}"/>`).join("")}`;
  return s;
};

const groomTorso = () => {
  const sk = SKIN.groom;
  let s = `<path d="M-15 -564L-15 -518L15 -518L15 -564Z" fill="url(#sk-groom)" ${OUT}/><ellipse cx="0" cy="-556" rx="16" ry="6" fill="${sk.shade}" opacity=".55"/>
<path d="M-18 -526C-34 -522 -56 -516 -68 -506C-76 -498 -78 -480 -76 -460C-73 -420 -70 -380 -72 -330C-76 -290 -82 -260 -86 -232Q0 -218 86 -232C82 -260 76 -290 72 -330C70 -380 73 -420 76 -460C78 -480 76 -498 68 -506C56 -516 34 -522 18 -526Z" fill="url(#silk)" ${OUT}/>`;
  // folds
  const folds = [[-44, -470, -52, -236], [-20, -420, -26, -226], [26, -430, 34, -226], [52, -470, 60, -238]];
  for (const [x1, y1, x2, y2] of folds) s += `<path d="M${x1} ${y1}C${x1 - 4} ${(y1 + y2) / 2} ${x2 + 4} ${(y1 + y2) / 2 + 30} ${x2} ${y2}" stroke="${mix("#f3e6c8", INK, 0.3)}" stroke-width="1.6" fill="none" opacity=".45"/>`;
  s += `<path d="M-70 -380Q-40 -372 -10 -380M10 -384Q40 -374 70 -384" stroke="${mix("#f3e6c8", INK, 0.3)}" stroke-width="1.4" fill="none" opacity=".4"/>`;
  // embroidered yoke, placket, buttons, collar
  s += `<path d="M-64 -500C-40 -486 -20 -478 -6 -476M64 -500C40 -486 20 -478 6 -476" stroke="${GOLD}" stroke-width="2.6" fill="none"/>`;
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    s += `<circle cx="${r1(-60 + t * 50)}" cy="${r1(-496 + t * 16 - Math.sin(t * Math.PI) * 4)}" r="1.8" fill="${GOLD_D}"/><circle cx="${r1(60 - t * 50)}" cy="${r1(-496 + t * 16 - Math.sin(t * Math.PI) * 4)}" r="1.8" fill="${GOLD_D}"/>`;
  }
  s += `<rect x="-6" y="-526" width="12" height="108" fill="url(#gold)" ${OUT_T}/>
<path d="M0 -522c4 6 -4 10 0 16c4 6 -4 10 0 16c4 6 -4 10 0 16c4 6 -4 10 0 16c4 6 -4 10 0 16c4 6 -4 10 0 16" stroke="${GOLD_D}" stroke-width="1.2" fill="none"/>
${[-508, -486, -464, -442].map((y) => `<circle cx="0" cy="${y}" r="3.6" fill="${GOLD_L}" stroke="${GOLD_D}" stroke-width="1.2"/>`).join("")}
<path d="M-18 -528C-10 -520 10 -520 18 -528L18 -542C10 -534 -10 -534 -18 -542Z" fill="url(#gold)" ${OUT_T}/>
<path d="M-84 -246Q0 -232 84 -246L85 -236Q0 -222 -85 -236Z" fill="url(#gold)" ${OUT_T}/>
<path d="M-74 -262L-82 -232M74 -262L82 -232" stroke="${INK}" stroke-opacity=".5" stroke-width="1.6"/>`;
  return `<g filter="url(#grain)">${s}</g>`;
};

const uttariya = () => {
  const strip = (m) => {
    const x0 = m * 64;
    const x1 = m * 30;
    const end = m < 0 ? -292 : -306;
    return `<path d="M${x0} -510L${x1} -524C${m * 30} -450 ${m * 26} -380 ${m * 24} ${end}L${m * 58} ${end + 4}C${m * 62} -380 ${m * 66} -450 ${x0} -510Z" fill="url(#red)" ${OUT}/>
<path d="M${x1 + m * 4} -520C${m * 34} -450 ${m * 30} -380 ${m * 29} ${end}" stroke="${GOLD}" stroke-width="4" fill="none"/>
<path d="M${x0 - m * 5} -506C${m * 58} -450 ${m * 61} -380 ${m * 54} ${end + 4}" stroke="${GOLD}" stroke-width="4" fill="none"/>
${Array.from({ length: 6 }, (_, k) => `<circle cx="${r1(m * (42 + (k % 2) * 4))}" cy="${-480 + k * 30}" r="2.2" fill="${GOLD_L}"/>`).join("")}
<path d="M${m * 24} ${end}L${m * 58} ${end + 4}L${m * 58} ${end + 12}L${m * 24} ${end + 8}Z" fill="url(#gold)" ${OUT_T}/>
${Array.from({ length: 7 }, (_, k) => `<path d="M${r1(m * (27 + k * 5))} ${end + 10}v14" stroke="${GOLD_D}" stroke-width="2.2" stroke-linecap="round"/>`).join("")}`;
  };
  // the band that wraps the back of the neck, seen above the shoulders
  return `<g filter="url(#grain)"><path d="M-66 -508C-50 -532 -30 -538 0 -538C30 -538 50 -532 66 -508L52 -506C40 -522 22 -526 0 -526C-22 -526 -40 -522 -52 -506Z" fill="${RED_D}" ${OUT}/>${strip(-1)}${strip(1)}</g>`;
};

const dhoti = () => {
  let s = `<path d="M-70 -340C-76 -250 -88 -120 -96 -14Q-60 -4 -8 -10L0 -64L8 -10Q60 -4 96 -14C88 -120 76 -250 70 -340Z" fill="url(#cotton)" ${OUT}/>`;
  // legs folds and the pleated kochi down the front
  s += `<path d="M-40 -230C-46 -150 -56 -80 -60 -12M40 -230C46 -150 56 -80 60 -12" stroke="${INK}" stroke-opacity=".22" stroke-width="2" fill="none"/>`;
  for (let i = 0; i < 6; i++) s += `<path d="M${-12 + i * 3} -300L${-34 + i * 8} -16" stroke="${INK}" stroke-opacity=".2" stroke-width="1.5"/>`;
  s += `<path d="M-14 -300L-38 -16" stroke="${RED}" stroke-width="5"/><path d="M-10 -300L-32 -16" stroke="${GOLD}" stroke-width="2"/>`;
  s += `<path d="M-96 -26Q-60 -16 -8 -22L-8 -10Q-60 -4 -96 -14Z" fill="${RED}"/><path d="M96 -26Q60 -16 8 -22L8 -10Q60 -4 96 -14Z" fill="${RED}"/>
<path d="M-95 -30Q-60 -20 -8 -26M95 -30Q60 -20 8 -26" stroke="${GOLD}" stroke-width="2.2" fill="none"/>`;
  return `<g filter="url(#grain)">${s}</g>`;
};

const mojari = (m) =>
  `<g transform="translate(${m * 30} 0) scale(${m} 1)"><path d="M-22 -2Q-24 -16 -4 -18Q16 -20 28 -12Q38 -8 44 -18Q46 -6 34 -2Z" fill="url(#gold)" ${OUT}/><path d="M-8 -16Q6 -10 20 -14" stroke="${RED}" stroke-width="2.4" fill="none"/>${[-4, 4, 12].map((x) => `<circle cx="${x}" cy="-9" r="1.6" fill="${RED}"/>`).join("")}</g>`;

/* ------------------------------------------------------------------ bride */
const brideUpperArm = () => {
  const { shoulder: S, elbow: E } = BONES.bride;
  const L = len(S, E);
  const body = `<path d="M-13.5 0 L-12 ${L} C-12 ${L + 13} 12 ${L + 13} 12 ${L} L13.5 0Z" fill="url(#sk-bride)" ${OUT}/>
<path d="M-16 -6C-16 -20 16 -20 16 -6L15.5 ${L * 0.42}Q0 ${L * 0.48} -15.5 ${L * 0.42}Z" fill="url(#blouse)" ${OUT}/>
<path d="M-15 ${L * 0.36}Q0 ${L * 0.42} 15 ${L * 0.36}L15 ${L * 0.42}Q0 ${L * 0.48} -15 ${L * 0.42}Z" fill="url(#gold)" ${OUT_T}/>
<path d="M-13 ${L * 0.66}Q0 ${L * 0.7} 13 ${L * 0.66}" stroke="${GOLD}" stroke-width="5" fill="none"/>
<path d="M-4 ${L * 0.66}l4 7l4 -7" fill="${RED}" stroke="${GOLD_D}" stroke-width=".8"/>`;
  return bone(S, E, body);
};

const brideForearm = () => {
  const { elbow: E, wrist: W } = BONES.bride;
  const L = len(E, W);
  let body = `${hand("bride", L, { alta: true })}<path d="M-12 -2C-12 -15 12 -15 12 -2L9.5 ${L}L-9.5 ${L}Z" fill="url(#sk-bride)" ${OUT}/>`;
  // gold churi, pola (red), shakha (white conch), gold bala at the wrist
  const bangles = [
    [0.56, GOLD, 3.2],
    [0.62, GOLD, 3.2],
    [0.7, "#b3202c", 6],
    [0.8, "#f6f1e4", 7],
    [0.9, GOLD_L, 5],
  ];
  for (const [t, c, w] of bangles) {
    const y = L * t;
    body += `<path d="M-13 ${r1(y)}Q0 ${r1(y + 4)} 13 ${r1(y)}" stroke="${INK}" stroke-opacity=".6" stroke-width="${w + 2}" fill="none" stroke-linecap="round"/><path d="M-13 ${r1(y)}Q0 ${r1(y + 4)} 13 ${r1(y)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
    if (c === "#f6f1e4") body += `<path d="M-8 ${r1(y)}l3 2M-1 ${r1(y + 1)}l3 2M6 ${r1(y)}l3 2" stroke="#b8ad94" stroke-width="1"/>`;
  }
  return bone(E, W, body);
};

const brideHead = () => {
  const sk = SKIN.bride;
  let s = `<path d="M-42 -604C-46 -580 -44 -560 -40 -546L-33 -550C-37 -566 -37 -584 -37 -604Z" fill="${HAIR}"/><path d="M42 -604C46 -580 44 -560 40 -546L33 -550C37 -566 37 -584 37 -604Z" fill="${HAIR}"/>
<ellipse cx="-40" cy="-592" rx="7" ry="12" fill="${sk.base}" ${OUT}/><ellipse cx="40" cy="-592" rx="7" ry="12" fill="${sk.shade}" ${OUT}/>
<path d="M0 -646C-24 -646 -40 -628 -40 -602C-40 -580 -35 -564 -24 -553C-16 -546 -8 -542 0 -542C8 -542 16 -546 24 -553C35 -564 40 -580 40 -602C40 -628 24 -646 0 -646Z" fill="url(#skf-bride)" ${OUT}/>
<path d="M24 -553C35 -564 40 -580 40 -602C37 -584 32 -568 19 -556Z" fill="${sk.shade}" opacity=".4"/>
<path d="M0 -590C-2 -580 -5 -574 -3 -569" stroke="${sk.shade}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<path d="M-6 -567Q-3 -563 0 -565Q3 -563 6 -567" stroke="${mix(sk.shade, INK, 0.25)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<ellipse cx="-1.5" cy="-571" rx="2.2" ry="1.4" fill="${sk.light}" opacity=".9"/>`;
  // hair, centre-parted
  s += `<path d="M-42 -598C-46 -634 -26 -652 0 -652C26 -652 46 -634 42 -598C40 -616 34 -628 22 -634C14 -632 6 -636 0 -644C-6 -636 -14 -632 -22 -634C-34 -628 -40 -616 -42 -598Z" fill="${HAIR}"/>
<path d="M-30 -636C-20 -642 -10 -644 -3 -646M30 -636C20 -642 10 -644 3 -646" stroke="#4a3830" stroke-width="2" fill="none" opacity=".75"/>`;
  // tikli down the parting
  s += `<path d="M0 -652V-634" stroke="${GOLD}" stroke-width="1.6"/><circle cx="0" cy="-630" r="4.6" fill="${GOLD}" ${OUT_T}/><circle cx="0" cy="-630" r="2" fill="${RED}"/><circle cx="0" cy="-623" r="1.6" fill="#f8f4ea"/>`;
  // teep and chandan (kalka): arcs of white dots over the brows, a trail down each cheek
  s += `<circle cx="0" cy="-614" r="3.8" fill="#b3121f"/>`;
  for (const m of [-1, 1]) {
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      const x = m * (6 + t * 32);
      const y = -620 - Math.sin(t * Math.PI) * 9 + t * 8;
      s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${k % 2 ? 1.3 : 1.8}" fill="#fff8ea" stroke="${GOLD_D}" stroke-width=".4"/>`;
      if (k % 2 === 0 && k < 8) s += `<circle cx="${r1(x + m * 2)}" cy="${r1(y - 4.5)}" r="1" fill="#b3121f"/>`;
    }
    for (let k = 0; k < 6; k++) s += `<circle cx="${r1(m * (37 - k * 1.2))}" cy="${r1(-600 + k * 6)}" r="${r1(1.7 - k * 0.15)}" fill="#fff8ea" stroke="${GOLD_D}" stroke-width=".4"/>`;
    s += `<path d="M${m * 31} -566c${m * 4} -2 ${m * 6} 2 ${m * 3} 6c${m * -3} 3 ${m * -6} 0 ${m * -3} -6Z" fill="none" stroke="#fff8ea" stroke-width="1.4"/>`;
  }
  // nath (nose ring) with its chain, and jhumka earrings
  s += `<circle cx="13" cy="-560" r="11" fill="none" stroke="${GOLD}" stroke-width="2"/><circle cx="20" cy="-551" r="2.4" fill="${RED}" stroke="${GOLD_D}" stroke-width=".6"/><circle cx="5" cy="-567" r="1.8" fill="${GOLD_L}"/>
<path d="M22 -557C30 -566 34 -580 36 -596" stroke="${GOLD}" stroke-width="1" fill="none" stroke-dasharray="1.5 1.5"/>`;
  for (const m of [-1, 1]) {
    s += `<circle cx="${m * 41}" cy="-584" r="3.2" fill="${GOLD}" ${OUT_T}/><path d="M${m * 41} -581v4" stroke="${GOLD}" stroke-width="1.6"/>
<path d="M${m * 41 - 7} -566C${m * 41 - 7} -576 ${m * 41 + 7} -576 ${m * 41 + 7} -566Z" fill="url(#gold)" ${OUT_T}/>
${[-5, 0, 5].map((d) => `<circle cx="${m * 41 + d}" cy="-563" r="1.6" fill="#f8f4ea"/>`).join("")}`;
  }
  return s;
};

const veilBack = () => {
  let s = `<path d="M0 -672C-54 -672 -82 -632 -86 -584C-90 -540 -98 -500 -118 -440C-126 -410 -130 -380 -126 -346L-80 -352C-74 -420 -66 -470 -58 -500L58 -500C66 -470 74 -420 80 -352L126 -346C130 -380 126 -410 118 -440C98 -500 90 -540 86 -584C82 -632 54 -672 0 -672Z" fill="url(#red)" fill-opacity=".96" ${OUT}/>`;
  s += `<path d="M-126 -350C-130 -384 -126 -412 -118 -442C-98 -502 -90 -542 -86 -586C-82 -634 -54 -672 0 -672C54 -672 82 -634 86 -586C90 -542 98 -502 118 -442C126 -412 130 -384 126 -350" stroke="${GOLD}" stroke-width="9" fill="none" stroke-linejoin="round"/>
<path d="M-126 -350C-130 -384 -126 -412 -118 -442C-98 -502 -90 -542 -86 -586C-82 -634 -54 -672 0 -672C54 -672 82 -634 86 -586C90 -542 98 -502 118 -442C126 -412 130 -384 126 -350" stroke="${RED_D}" stroke-width="2" fill="none" stroke-dasharray="3 6"/>`;
  const R = rng(17);
  for (let i = 0; i < 40; i++) {
    const m = R() < 0.5 ? -1 : 1;
    const y = -560 + R() * 200;
    const x = m * (86 + (y + 560) * 0.14 - R() * 20);
    s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="1.8" fill="${GOLD_L}" opacity=".8"/>`;
  }
  s += `<path d="M-126 -346L-80 -352L-80 -344L-126 -338ZM126 -346L80 -352L80 -344L126 -338Z" fill="url(#gold)"/>`;
  return `<g filter="url(#grain)">${s}</g>`;
};

const veilFront = () =>
  `<path d="M-47 -596C-52 -640 -28 -674 0 -674C28 -674 52 -640 47 -596L39 -598C41 -632 22 -658 0 -658C-22 -658 -41 -632 -39 -598Z" fill="url(#red)" ${OUT}/>
<path d="M-40 -600C-42 -634 -22 -660 0 -660C22 -660 42 -634 40 -600" stroke="${GOLD}" stroke-width="4" fill="none"/>
${Array.from({ length: 11 }, (_, k) => {
  const a = Math.PI * (0.1 + (k / 10) * 0.8);
  return `<circle cx="${r1(-Math.cos(a) * 44)}" cy="${r1(-604 - Math.sin(a) * 62)}" r="1.8" fill="${GOLD_L}"/>`;
}).join("")}`;

const mukut = () => {
  let s = `<path d="M-60 -650C-76 -702 -54 -776 0 -800C54 -776 76 -702 60 -650Q0 -638 -60 -650Z" fill="url(#shola)" ${OUT}/>`;
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI * (0.08 + (i / 14) * 0.84);
    s += `<path d="M${r1(-Math.cos(a) * 64)} ${r1(-652 - Math.sin(a) * 140)}l${r1(-Math.cos(a) * 12)} ${r1(-Math.sin(a) * 14)}" stroke="#fbf7ec" stroke-width="6" stroke-linecap="round"/><circle cx="${r1(-Math.cos(a) * 78)}" cy="${r1(-652 - Math.sin(a) * 156)}" r="2.2" fill="${GOLD}"/>`;
  }
  [0.84, 0.62, 0.4].forEach((k, i) => {
    s += `<path d="M${r1(-58 * k)} -652C${r1(-72 * k)} ${r1(-652 - 60 * k)} ${r1(-50 * k)} ${r1(-652 - 128 * k)} 0 ${r1(-652 - 140 * k)}C${r1(50 * k)} ${r1(-652 - 128 * k)} ${r1(72 * k)} ${r1(-652 - 60 * k)} ${r1(58 * k)} -652" stroke="${i === 1 ? RED : GOLD_D}" stroke-width="${i === 1 ? 2.6 : 1.8}" fill="none"/>`;
  });
  // lotus at the centre of the crown
  s += `<g transform="translate(0 -700)">${[-50, -25, 0, 25, 50].map((a) => `<path d="M0 0C6 -6 6 -18 0 -26C-6 -18 -6 -6 0 0Z" transform="rotate(${a})" fill="#f6d9d4" stroke="${RED}" stroke-width="1.2"/>`).join("")}<circle r="3" cy="2" fill="${GOLD}"/></g>`;
  s += `<path d="M-60 -642Q0 -628 60 -642L58 -658Q0 -646 -58 -658Z" fill="url(#gold)" ${OUT}/>${[-42, -21, 0, 21, 42].map((x) => `<circle cx="${x}" cy="${r1(-646 + Math.abs(x) * 0.07)}" r="3" fill="${RED}" stroke="${GOLD_D}" stroke-width=".8"/>`).join("")}`;
  return s;
};

const brideTorso = () => {
  const sk = SKIN.bride;
  let s = `<path d="M-13 -556L-13 -508L13 -508L13 -556Z" fill="url(#sk-bride)" ${OUT}/><ellipse cx="0" cy="-548" rx="14" ry="5" fill="${sk.shade}" opacity=".5"/>
<path d="M-15 -514C-30 -512 -48 -508 -58 -500C-66 -492 -64 -470 -60 -452C-56 -436 -50 -424 -46 -408L46 -408C50 -424 56 -436 60 -452C64 -470 66 -492 58 -500C48 -508 30 -512 15 -514C10 -498 -10 -498 -15 -514Z" fill="url(#blouse)" ${OUT}/>
<path d="M-15 -514C-10 -498 10 -498 15 -514" stroke="${GOLD}" stroke-width="4" fill="none"/>`;
  // the pallu across the chest and over the left shoulder, with its zari borders
  s += `<path d="M-50 -400L-34 -414C-2 -440 26 -472 42 -510L62 -500C54 -462 30 -420 -6 -396Z" fill="url(#red)" ${OUT}/>
<path d="M-34 -414C-2 -440 26 -472 42 -510" stroke="${GOLD}" stroke-width="6" fill="none"/><path d="M-6 -396C30 -420 54 -462 62 -500" stroke="${GOLD}" stroke-width="6" fill="none"/>
${[0.25, 0.45, 0.65].map((t) => `<circle cx="${r1(-20 + t * 60)}" cy="${r1(-410 - t * 70)}" r="3" fill="${GOLD_L}"/>`).join("")}`;
  // choker and sitahar
  s += `<path d="M-14 -526Q0 -516 14 -526" stroke="${INK}" stroke-opacity=".5" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M-14 -526Q0 -516 14 -526" stroke="url(#gold)" stroke-width="7" fill="none" stroke-linecap="round"/>
${[-8, 0, 8].map((x) => `<circle cx="${x}" cy="${r1(-521 + (8 - Math.abs(x)) * 0.15)}" r="2" fill="${RED}"/>`).join("")}
<path d="M-24 -512C-34 -470 -16 -446 0 -440C16 -446 34 -470 24 -512" stroke="${GOLD}" stroke-width="3.4" fill="none"/>
<path d="M-30 -508C-44 -456 -18 -426 0 -420C18 -426 44 -456 30 -508" stroke="${GOLD}" stroke-width="2.6" fill="none" stroke-dasharray="3 3"/>
<path d="M-8 -440C-8 -428 8 -428 8 -440C8 -446 -8 -446 -8 -440Z" fill="url(#gold)" ${OUT_T}/><circle cx="0" cy="-437" r="3" fill="${RED}"/>`;
  return `<g filter="url(#grain)">${s}</g>`;
};

const saree = () => {
  let s = `<path d="M-50 -426C-62 -330 -92 -160 -110 -12Q0 6 110 -12C92 -160 62 -330 50 -426Z" fill="url(#red)" ${OUT}/>`;
  // buti pattern
  const R = rng(23);
  for (let i = 0; i < 70; i++) {
    const y = -400 + R() * 340;
    const half = 50 + ((y + 426) / 414) * 56;
    const x = (R() - 0.5) * 2 * half * 0.86;
    s += `<path d="M${r1(x)} ${r1(y)}c2 -4 5 -4 4 0c-1 3 -4 4 -4 0Z" fill="${GOLD_L}" opacity=".85"/>`;
  }
  // folds and the front pleats (kuchi)
  for (const [x1, x2] of [[-30, -80], [-12, -40], [14, 36], [30, 84]]) s += `<path d="M${x1} -400C${x1} -260 ${(x1 + x2) / 2} -120 ${x2} -14" stroke="${RED_D}" stroke-width="2" fill="none" opacity=".55"/>`;
  for (let i = 0; i < 5; i++) s += `<path d="M${-4 + i * 4} -410L${-30 + i * 14} -10" stroke="${RED_D}" stroke-width="1.4" opacity=".5"/>`;
  s += `<path d="M-8 -410L-36 -12L-18 -10L6 -410Z" fill="url(#gold)" opacity=".95"/><path d="M-6 -400L-30 -16" stroke="${RED}" stroke-width="2" stroke-dasharray="4 5"/>`;
  // the broad zari border at the hem
  s += `<path d="M-106 -46Q0 -30 106 -46L110 -12Q0 6 -110 -12Z" fill="url(#gold)" ${OUT_T}/>
<path d="M-108 -38Q0 -22 108 -38" stroke="${RED}" stroke-width="4" fill="none"/>
${Array.from({ length: 15 }, (_, k) => {
  const x = -98 + k * 14;
  const y = -22 + Math.abs(x) * -0.03;
  return `<path d="M${x} ${r1(y)}l5 -6l5 6l-5 6Z" fill="${RED}"/>`;
}).join("")}
<path d="M-48 -422Q0 -412 48 -422" stroke="${GOLD}" stroke-width="4" fill="none"/>`;
  return `<g filter="url(#grain)">${s}</g>`;
};

const brideFeet = (m) =>
  `<g transform="translate(${m * 28} -4)"><path d="M-14 0C-14 -10 14 -10 14 0C14 5 -14 5 -14 0Z" fill="url(#sk-bride)" ${OUT}/><path d="M-14 0C-14 5 14 5 14 0" stroke="#c1121f" stroke-width="3.4" fill="none"/>${[-8, -3, 2, 7].map((x) => `<circle cx="${x}" cy="-5" r="1.6" fill="#c1121f" opacity=".75"/>`).join("")}<circle cx="-6" cy="-6" r="1.8" fill="none" stroke="#e6e2d8" stroke-width="1"/></g>`;

/* ------------------------------------------------------------------ export */
export const characterArt = () => {
  const defs = (who) => `${skinDefs(who)}
${fabric("silk", "#fff7e2", "#f1e2c0", "#cdb688")}
${fabric("cotton", "#ffffff", "#f7f1e3", "#d9cfb6")}
${fabric("red", RED_L, RED, RED_D)}
${fabric("blouse", "#9e1c2e", "#7f1022", "#5a0814")}
${fabric("shola", "#ffffff", "#fbf6ea", "#ddd0b2")}
${lin("gold", [[0, GOLD_L], [0.5, GOLD], [1, GOLD_D]])}
${grainFilter("grain", 0.16, 0.8)}`;
  const p = (name, who, bounds, body) => piece(name, bounds, body, { scale: SCALE, defs: defs(who), quality: 0.88 });
  // arms are baked about their shoulder/elbow with the right side drawn; the left side is the mirror image
  const mirror = (body) => `<g transform="scale(-1 1)">${body}</g>`;
  const g = BONES.groom;
  const b = BONES.bride;
  return [
    p("groom-dhoti", "groom", { x: -110, y: -350, w: 220, h: 360 }, dhoti()),
    p("groom-foot-l", "groom", { x: -90, y: -30, w: 90, h: 36 }, mojari(-1)),
    p("groom-foot-r", "groom", { x: 0, y: -30, w: 90, h: 36 }, mojari(1)),
    p("groom-torso", "groom", { x: -100, y: -572, w: 200, h: 352 }, groomTorso()),
    p("groom-stole", "groom", { x: -80, y: -546, w: 160, h: 290 }, uttariya()),
    p("groom-arm-r", "groom", { x: g.shoulder.x - 40, y: g.shoulder.y - 30, w: 80, h: 150 }, groomUpperArm()),
    p("groom-arm-l", "groom", { x: -g.shoulder.x - 40, y: g.shoulder.y - 30, w: 80, h: 150 }, mirror(groomUpperArm())),
    p("groom-fore-r", "groom", { x: g.elbow.x - 40, y: g.elbow.y - 30, w: 80, h: 170 }, groomForearm()),
    p("groom-fore-l", "groom", { x: -g.elbow.x - 40, y: g.elbow.y - 30, w: 80, h: 170 }, mirror(groomForearm())),
    p("groom-head", "groom", { x: -60, y: -680, w: 120, h: 145 }, groomHead()),
    p("groom-topor", "groom", { x: -100, y: -930, w: 200, h: 300 }, topor()),
    p("bride-veil", "bride", { x: -140, y: -690, w: 280, h: 360 }, veilBack()),
    p("bride-saree", "bride", { x: -120, y: -440, w: 240, h: 450 }, saree()),
    p("bride-foot-l", "bride", { x: -50, y: -20, w: 40, h: 24 }, brideFeet(-1)),
    p("bride-foot-r", "bride", { x: 10, y: -20, w: 40, h: 24 }, brideFeet(1)),
    p("bride-torso", "bride", { x: -80, y: -566, w: 160, h: 180 }, brideTorso()),
    p("bride-arm-r", "bride", { x: b.shoulder.x - 40, y: b.shoulder.y - 30, w: 80, h: 150 }, brideUpperArm()),
    p("bride-arm-l", "bride", { x: -b.shoulder.x - 40, y: b.shoulder.y - 30, w: 80, h: 150 }, mirror(brideUpperArm())),
    p("bride-fore-r", "bride", { x: b.elbow.x - 40, y: b.elbow.y - 30, w: 80, h: 160 }, brideForearm()),
    p("bride-fore-l", "bride", { x: -b.elbow.x - 40, y: b.elbow.y - 30, w: 80, h: 160 }, mirror(brideForearm())),
    p("bride-head", "bride", { x: -60, y: -670, w: 120, h: 140 }, brideHead()),
    p("bride-veil-front", "bride", { x: -60, y: -690, w: 120, h: 100 }, veilFront()),
    p("bride-mukut", "bride", { x: -100, y: -830, w: 200, h: 200 }, mukut()),
  ];
};

```
