## How it works

One fragment pass (`fade.wgsl`) over the shared picture, on the dye model in `src/gpu/photo/fade.ts`. A chromogenic print holds three dyes, cyan, magenta and yellow, each absorbing mostly one band and a little of the others (`DYES`). Each pixel:

1. takes the picture's densities, held between the paper's base and the densest black a print holds;
2. solves for the dye amounts that print them, by the inverse of the absorption matrix;
3. thins each dye by what is left of it after the years: first-order fading at that dye's rate for that storage;
4. adds the base's stain, and turns density back into reflectance.

The rates are set to the sources' figures ([docs/eras.md](../../../docs/eras.md), the 1970s, Photographs):

- **In an album (dark),** cyan goes first, about 10% in 8.5 years, and yellow second. Blue density rises in the whites, so the print drifts red, then magenta, and its borders yellow.
- **On the wall (light),** magenta goes first, so the print drifts green and blue.

Blacks lift as every dye thins, so contrast falls. The print has a white border, rounded corners and a little emulsion grain, and lies on an album page. `age it as you watch` adds 45 years over half a minute, then holds.

`method` shows the usual CSS recipe instead, `filter: sepia() hue-rotate()` with the Filter Effects matrices on sRGB-encoded values as Chrome applies them, or splits the two, CSS on the left. The filter tints the whole picture brown: whites go cream, but no dye fades before another, so a sky stays blue-grey, blacks stay black, and there is no drift that depends on how the print was kept.

`tests/fade.test.ts` checks that a fresh print reproduces its picture, that grey drifts red with yellowed whites in the dark and green on the wall, and that blacks lift.

## Cost

On an Apple M1 Max on Dawn ([docs/studies/epic-2.md](../../../docs/studies/epic-2.md)): 0.22 to 0.31 ms per frame at 1080p, 0.09 at 540p. In Chrome, one 1920 × 1080 frame reads 0.69 ms. Tier A, provisional. 1.7 kB gzipped of its own, 34.0 kB in all.

Flash `none`, pattern `none` at the default, at 0.7 and at every preset. `age it as you watch` changes the colour by about a year every two-thirds of a second, far slower than a flash.

## Pitfalls

- The rates are this family's, set to published figures for Kodak papers of the period at room temperature; real prints vary with paper, processing (wash pH matters) and heat. Rates are not a measurement of any one print.
- The dye absorptions are a plausible set, not a measured spectrum: the model is three bands, not spectral.
- A picture with colours outside what three dyes can print (deep saturated blues) is clamped on the way in.

## When to use it

A period treatment for a page photograph: a family-history, archive or retro brand page. Where a warm tint is all that is wanted, the CSS filter is free and the honest choice. Tier A.

## References

- [plan.md](../../../plan.md), story 2.6; [docs/eras.md](../../../docs/eras.md), the 1970s.
- Henry Wilhelm, [Monitoring the Fading and Staining of Color Photographic Prints](https://cool.culturalheritage.org/jaic/articles/jaic21-01-003.html), JAIC 21(1), 1981.
- Charles Anderson and Lloyd Ellison, [Natural Aging of Photographs](https://cool.culturalheritage.org/jaic/articles/jaic31-02-005_4.html), JAIC 31(2), 1992.
- [Filter Effects Module Level 1](https://www.w3.org/TR/filter-effects-1/), the `sepia()` and `hue-rotate()` matrices.
