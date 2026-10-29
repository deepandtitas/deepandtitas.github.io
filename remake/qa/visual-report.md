# Visual QA report (qa-visual)

Checked: 59 bn frames + 59 en frames (0-2940 step 60, 478, 1138, 1400, 1540, 1750, 1960, 2098, 2200, 2999) + 4 reduced-motion (300, 1400, 1750, 2999). Montages in `out/compare/`. All montages were generated; the ones I opened and inspected closely: bn 540, 780, 1260, 1540, 2098, 2160, 2700, en 2999 (plus the mean/changed-px% trend on all others, which is smooth with no outlier except 540 bn). Residual diff everywhere else is edge/AA resampling (means 0.2-3.5, as in differences.md).

| frame | bn mean | en mean | verdict |
|---|---|---|---|
| 0 | 0.16 | 0.16 | ok |
| 60 | 0.17 | 0.17 | ok |
| 120 | 0.20 | 0.20 | ok |
| 180 | 0.33 | 0.33 | ok |
| 240 | 0.43 | 0.43 | ok |
| 300 | 0.47 | 0.46 | ok |
| 360 | 0.46 | 0.46 | ok |
| 420 | 0.49 | 0.48 | ok |
| 478 | 0.50 | 0.49 | ok |
| 480 | 0.51 | 0.50 | ok |
| 540 | 1.26 | 0.82 | issue 1 |
| 600 | 0.85 | 0.86 | ok |
| 660 | 0.60 | 0.60 | ok |
| 720 | 0.77 | 0.77 | ok |
| 780 | 1.33 | 1.34 | ok |
| 840 | 1.17 | 1.17 | ok |
| 900 | 1.36 | 1.37 | ok |
| 960 | 1.81 | 1.81 | ok |
| 1020 | 1.69 | 1.69 | ok |
| 1080 | 1.76 | 1.76 | ok |
| 1138 | 1.72 | 1.72 | ok |
| 1140 | 1.73 | 1.73 | ok |
| 1200 | 2.06 | 2.06 | ok |
| 1260 | 2.67 | 2.67 | ok |
| 1320 | 2.71 | 2.71 | ok |
| 1380 | 2.72 | 2.73 | ok |
| 1400 | 2.79 | 2.79 | ok |
| 1440 | 3.04 | 3.05 | ok |
| 1500 | 3.44 | 3.44 | ok |
| 1540 | 3.51 | 3.51 | ok |
| 1560 | 3.53 | 3.54 | ok |
| 1620 | 3.54 | 3.54 | ok |
| 1680 | 3.15 | 3.15 | ok |
| 1740 | 3.17 | 3.17 | ok |
| 1750 | 3.18 | 3.19 | ok |
| 1800 | 3.19 | 3.19 | ok |
| 1860 | 3.34 | 3.35 | ok |
| 1920 | 3.37 | 3.38 | ok |
| 1960 | 3.10 | 3.05 | ok |
| 1980 | 2.97 | 2.98 | ok |
| 2040 | 2.94 | 2.94 | ok |
| 2098 | 3.25 | 3.25 | ok |
| 2100 | 3.25 | 3.25 | ok |
| 2160 | 1.20 | 1.20 | ok |
| 2200 | 0.98 | 0.98 | ok |
| 2220 | 1.23 | 1.23 | ok |
| 2280 | 0.92 | 0.92 | ok |
| 2340 | 1.30 | 1.30 | ok |
| 2400 | 1.02 | 0.93 | ok |
| 2460 | 0.93 | 0.93 | ok |
| 2520 | 0.94 | 0.95 | ok |
| 2580 | 1.35 | 0.94 | ok (issue 2 minor) |
| 2640 | 1.36 | 1.27 | ok (issue 2 minor) |
| 2700 | 1.35 | 0.94 | ok (issue 2 minor) |
| 2760 | 1.35 | 1.23 | ok (issue 2 minor) |
| 2820 | 1.43 | 1.06 | ok (issue 2 minor) |
| 2880 | 1.45 | 1.07 | ok (issue 2 minor) |
| 2940 | 1.43 | 1.08 | ok (issue 2 minor) |
| 2999 | 1.45 | 1.08 | ok (issue 2 minor) |

Reduced motion means: 300 0.47, 1400 2.64, 1750 2.66, 2999 1.45 (ok).

## Transition checks (frame-to-frame mean abs difference, old vs remake, half-size stills)
- 478-482: 0.07/0.00 vs 0.06/0.00. 1138-1142: 0.15/0.14 vs 0.15/0.15. No pop in either build.
- Leaf release 1240-1260: 4.49/3.78/3.18/2.65 (old) vs 4.59/3.80/3.20/2.62 (remake): same.
- Front/back swap 1810-1814: 0.84/1.69 vs 0.94/1.78: same, no jump.
- Card rise 2080-2140: matches within 0.2 everywhere except 2100->2102: old 0.58, remake 0.14. Both stills are visually identical (checked 2102); probably the old build's quantised petals/dust stepping. Not visible, no action.
- Face blend at the wedding start is the deliberate difference.

## Issues

### 1. bn heading/subtitle too opaque mid-reveal (frame 540) - owner: scenes-a
`out/compare/bn-0540.png`. Title "দীপ ও তিতাস" (about x 140-500, y 330-480 comp px, half-size montage y 170-250) and subtitle "একটি নতুন গল্পের শুরু" (y ~600) are noticeably darker/fuller in the remake than in the reference, which is still partly faded (title looks ~60% opacity, remake ~100%). bn 540 mean 1.26 vs en 540 0.82; frames 480 and 600 are fine, so the title fade-out/in timing or the `TEXT_WIDTH`-remapped reveal/opacity curve is off around beat 270 (the reference is mid-fade, the remake already settled, or the reverse). Check the title opacity keyframes near 540 (en shows a smaller version of the same).

### 2. bn invitation names line ~1-2 px low (frames 2160-2999, bn) - owner: scenes-a
`out/compare/bn-2700.png`. "দীপ ও তিতাস" on the card is drawn about 1-2 comp px higher/lower than the reference (white outline in the diff around x 190-430, y 580-700 comp px). Already known in BOARD (Bengali baseline). Bn means 1.35-1.45 vs en 0.94-1.08 confirm it. Text content, wrapping and colour match.

### 3. en invitation: tiny text offsets (frames 2160-2999 en) - owner: renderer (minor)
`out/compare/en-2999.png`. "(House of Sambhu Ghosh)" is shifted about 1 px horizontally from the reference (VENUE_SPLIT measured width), and the digits "2" in "25/27 November" and "1", "c", "o" in the labels show 1 px glyph-edge differences (old-style numerals subpixel positioning). Visually negligible, no clipping, same wrapping.

No missing/extra elements, wrong layer order, wrong colours or wrong timing were found elsewhere (incl. garland exchange, mandap, leaves, card rise, final invitation, reduced motion). No issues for scenes-b (their frames are all edge resampling only).
