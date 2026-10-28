## How it works

One fragment pass (`rays.wgsl`) into the HDR scene, then the tail with the tonemap off. Around the burst's origin, each pixel's angle in ray units picks ray or gap. The rays taper: a ray's half-width grows from `taper` of its unit at the centre to a quarter at the rim, where ray and gap are equal. Concentric tiers step outwards, each a little nearer the full ray colour, with a fine line at each step, and a solid disc at the centre is the sun. Edges use `fwidth`, so the rays never alias.

The origin can be the bottom edge (a rising sun), the centre, or a corner (a fan). The schemes are the period's: gold on black, jade and gold, and the pastel pink of the 1980s Miami revival ([docs/eras.md](../../../docs/eras.md)).

A sunburst is a radial pattern: more than five ray and gap pairs, regular, over most of the view. As with `hello`, the ray's lightness is solved on the CPU so its luminance sits `patternStepAt(dose)` above the ground's, and every tier mixes between the two, so no part has a larger step. The held frame draws at `heldDose`.

## Cost

On an Apple M1 Max on Dawn ([docs/studies/epic-3.md](../../../docs/studies/epic-3.md)): 0.17 to 0.26 ms per frame at 1080p across presets. In Chrome, one 1920 × 1080 frame reads 0.37 ms. Tier A, provisional. 1.3 kB gzipped of its own, 25.2 kB in all.

Flash `none`, pattern `none` at the default and at 0.7. `full contrast` (dose 0.9, centred, 24 rays) is Deco's own contrast, over the pattern rule: it is declared and starts behind the gate.

## Pitfalls

- Under the pattern step the default is soft: gold on black reads as low-relief gilt rather than a polished door. Full contrast is safe only small, under a quarter of a 10° field, about 180 × 135 CSS pixels at typical viewing, which is a badge, not a background.
- The tier lines are one pixel of mixing: at very small sizes they disappear.

## When to use it

A hero or section background on a Deco-styled page, or a seal or badge. If the rays need not turn, taper or tier, a CSS `repeating-conic-gradient` does it with no GPU at all.

## References

- [plan.md](../../../plan.md), story 3.1; [docs/eras.md](../../../docs/eras.md), Art Deco and Streamline.
- Bevis Hillier, _Art Deco of the 20s and 30s_ (1968).
- The ITC (Ofcom) guidance on regular patterns, summarised in [The Hero's Journey's docs/safety.md](../../../../herosjourney/docs/safety.md).
