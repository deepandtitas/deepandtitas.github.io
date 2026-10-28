
## scenes-b (garden, meeting, wedding, figures, frame assembly)
- Figure idle life (breathing, blinks, cloth in the breeze) runs on the exact fractional beat; the old build floored `t` to whole beats (30 Hz) only to spare React re-renders. Sub-pixel difference, smoother at 60 FPS.
- One persistent couple from `couplePose` for the whole meeting + wedding span (old build: two scene-owned pairs); faces ease over 14 wedding beats (story FACE_BLEND). Already in CONTRACTS.
- A figure below full opacity (reduced motion fade-in) is one `group` op (the old shell div's opacity), as the old CSS did.
- Guided hotspot size is multiplied by the camera zoom (the old hotspot sat inside the scaled camera div); labels are unscaled.
- Atmosphere is drawn at full canvas resolution (the old SpriteField used res .75).
- Residual vs reference stills (mean diff 1-3.5 of 255): edge resampling of the dense art (figure parts, mandap, foliage) between the DOM image pipeline and canvas drawImage. A sub-pixel shift scan (+-1 px) and blur scan both confirm 0,0 is best; `imageSmoothingQuality = "high"` and `canvasScale 0.5` change the mean by < 0.1.

## scenes-a
- Card box-shadow (`0 34px 90px`) is seven stacked translucent rounded rects following the Gaussian edge, not a true blur (faint banding in the diff, mean < 1.5).
- Fade-in of fill+stroke shapes with both (card divider drop, flourish drop, corner dots) uses per-op alpha, not SVG element opacity: during the fade the stroke's inner half is slightly denser. Settled frames are identical.
- Text reveal (title, subtitle): the overlay box fits its text, so `reveal` is remapped to wipe across the same screen pixels as the old full-width box (`TEXT_WIDTH` in awakening.ts; re-measure if the strings or fonts change). The gold glow rides the remapped value, so its peak lands a few beats off.
- Heading rules and venue name/note split use measured text widths (`HEADING_WIDTH` in text.ts, `VENUE_SPLIT` in invitation.ts); the invitation message is assumed to wrap to 2 lines. Re-measure if those strings or fonts change.
- The map button: card layout reserves 136 px (the old build's global border-box); the old `<a>` hover/pin live in the renderer's link item.
