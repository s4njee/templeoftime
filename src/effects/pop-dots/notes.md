## How it works

One fragment pass (`pop.wgsl`) over the family's shared picture (`src/gpu/picture/`), on the print pipeline. It works as a comic's colourist and printer did:

- **Separation.** The picture, softened over a few CSS pixels first (a colourist flats areas, not grain), is separated into cyan, magenta and yellow with no black.
- **Posterising.** Each ink is posterised to a colourist's tints: none, a light screen (25%), a heavy one (50%), or solid. Anything past half a tone prints solid, as strong colours did.
- **Screens.** A tint is a screen of even dots at the ink's traditional angle, through the spot function and its measured table.
- **The black plate** is line art. Heavy contours go where the barely softened picture's lightness changes fast, and solid ("spotted") black goes in its darkest parts.
- **Register.** Every plate is a little out of register.

A screen is a lattice of dots, which the pattern rule counts ("rows of repetitive elements such as polka dots"). So the dots keep only as much contrast as holds the screen's light–dark step under `patternStepAt(dose)`; the rest is flattened into the tint's average colour (`print_flattened`). The contrast is set per pixel, from which inks are dotted there: each ink's own step on this paper (`inkStep`) is summed, since overprinting inks' steps add at most. So a tint always has its true colour, and how visible its dots are follows `dose`. `tests/print.test.ts` checks the bound for every combination of inks on two papers.

## Cost

On an Apple M1 Max on Dawn ([docs/studies/epic-2.md](../../../docs/studies/epic-2.md)): the print is a still, cached between changes (`src/gpu/still.ts`), so a frame costs 0.24 ms at 1080p, the copy and the tail. Printing it costs about 1.0 ms on Dawn and 3.0 ms in Chrome at 1920 × 1080, once after each change (measured before the cache, in the same run of [browser-check.md](../../../docs/studies/browser-check.md)). In Chrome a frame reads 0.32 ms. Tier A, provisional. 1.6 kB gzipped of its own, 37.1 kB in all.

Flash `none`, pattern `none` at the default and at 0.7. `full ink` is declared and gated.

## Pitfalls

- At the default intensity the dots are faint: the tints read as flat colour, and the dots show only close up. That is the pattern rule, not a bug. `full ink` shows a comic's real dots, a coarse lattice far over the rule, and starts behind the gate.
- Posterising photographic texture (sand, cloud) makes speckled tint boundaries; the softening hides most of it, at the cost of rounding small shapes.
- Contours come from lightness alone, so two colours of the same lightness meet without a line.
- The picture is generated until a page can hand over its own image (story 8.4).

## When to use it

A pop-art treatment for a hero image, or a comic-styled section, over a light page: it is a light-page native. A CSS halftone (a `radial-gradient` dot mask over an image) gets one screen of one colour, no tints, no contours. Tier A.

## References

- [plan.md](../../../plan.md), story 2.2; [docs/eras.md](../../../docs/eras.md), the 1960s; [docs/safety.md](../../../docs/safety.md) on screens.
- National Gallery of Art, [An Eye for Art: Roy Lichtenstein](https://www.nga.gov/content/dam/ngaweb/Education/learning-resources/an-eye-for-art/AnEyeforArt-RoyLichtenstein.pdf).
