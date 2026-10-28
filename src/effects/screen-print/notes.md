## How it works

One fragment pass (`screen.wgsl`) over the shared picture. A silkscreen prints each ink as its own pass through its own stencil, so the effect does the same, up to six passes in one shader:

- **Stencils.** Each is cut from the picture's lightness (sRGB-encoded), softened over a few CSS pixels, as a cut or photo stencil holds no finer detail. The first and lightest ink covers everything darker than its threshold; each later, darker ink covers a smaller, darker area. The thresholds run evenly from near the paper to the deep shadows.
- **Register.** Each pass is placed by hand, so each lands a few pixels off the others, more as `dose` rises.
- **The pass itself.** Screen inks are nearly opaque (94% here), so a later pass covers an earlier one. The mesh makes the stencil's edge wander by about a CSS pixel. The squeegee starves the ink in broad faint bands along its pull. The ink's thickness mottles, and dust leaves pinholes.

Ink sets are in OKLCH: bright inks over a dark key, a warm gig-poster set, and one colour with black. Fewer layers take a set's lightest and darkest inks and spread the rest between.

## Cost

On an Apple M1 Max on Dawn ([docs/studies/epic-2.md](../../../docs/studies/epic-2.md)): a still, cached between changes, so a frame costs 0.22 to 0.24 ms at 1080p. Printing it, up to six passes in one shader, costs 0.8 to 1.8 ms on Dawn and about 4.2 ms in Chrome at 1920 × 1080, once after each change. In Chrome a frame reads 0.31 ms. Tier A, provisional. 1.6 kB gzipped of its own, 35.9 kB in all.

Flash `none`, pattern `none` at the default, at 0.7 and at every preset.

## Pitfalls

- Posterising by lightness alone gives the umbrella's red and the sky's blue the same ink where they are equally light: a silkscreen's tonal separation does that too.
- The starved bands are a vertical texture; at a high `dose` they can read as streaks of rain.
- Stencils from a picture with regular stripes harden them into a grating, which the pattern rule counts: the shared pictures avoid stripes for this reason.

## When to use it

A poster treatment for a hero image; a gig, event or exhibition page; light pages. CSS cannot posterise an image into stencils; SVG filters (`feComponentTransfer` with discrete tables, offset copies) get close for one picture at a time, at a cost on large images. Tier A.

## References

- [plan.md](../../../plan.md), story 2.3; [docs/eras.md](../../../docs/eras.md), the 1960s.
- The Andy Warhol Museum, [Andy Warhol's Life: 1960s](https://www.warhol.org/andy-warhols-life/1960s/).
