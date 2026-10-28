## How it works

One fragment pass (`press.wgsl`) on the print pipeline (`src/gpu/print/print.ts` and its twin `src/wgsl/print.wgsl`). Each pixel, for each of four plates:

1. reads the picture where that plate lands, shifted by the plate's misregistration: the family's shared picture (`src/gpu/picture/`), drawn once into a texture, or the printer's swatches;
2. separates it into cyan, magenta, yellow and black, with grey component replacement moving the shared grey into black;
3. compensates the tone for dot gain if the press does, then spreads it by the paper's gain, t + 4gt(1 − t);
4. screens it at the plate's angle (C 15°, M 75°, Y 0°, K 45°) with a cosine spot function, through a measured table so a tint covers its nominal area, and anti-aliased so even the 0° screen prints every tone;
5. multiplies the paper by the ink's transmittance where the dot covers.

The paper's fibres add a little noise to its tone and roughen every dot's edge. Papers set the gain at 50%: newsprint 28%, from the newspaper aim of 30% ± 4% ([docs/eras.md](../../../docs/eras.md)); uncoated 15%; coated 8%.

A screen is a lattice of dots, which the pattern rule counts, and full process inks step far over it. So, as in `pop-dots`, the dots keep only as much contrast as holds the step under `patternStepAt(dose)`, summed over the inks dotted at each pixel, and the rest is flattened into each tint's average (`print_flattened`). At the default intensity this is the print as seen at arm's length: the colours a press makes, its rosettes faint. `real dots` shows the press's own dots and starts behind the gate. The picture is generated, not loaded: image input is story 8.4.

`tests/print.test.ts` checks that a flat tint screens to its coverage after gain, that compensation inverts the gain, and that the traditional angles give rosettes where two screens 5° apart give a moiré.

## Cost

On an Apple M1 Max on Dawn ([docs/studies/epic-2.md](../../../docs/studies/epic-2.md)): 0.7 to 0.85 ms per frame at 1080p. In Chrome, one 1920 × 1080 frame reads 1.49 ms, down from 5.38 ms in M0, when each of the four plates drew the poster again at its own offset: the plates now read one picture texture. Tier A, provisional. 1.7 kB gzipped of its own, 36.3 kB in all.

Flash `none`, pattern `none` at the default and at 0.7. `real dots` prints the press's full-contrast screen; `moiré: one angle` prints every plate at 45°, the moiré the angles exist to avoid; `swatches` alias into a moiré in the 480 px analysis frame. All three are declared and gated.

## Pitfalls

- At the default intensity the dots are faint; the halftone look at full contrast is the gated `real dots`.
- At a screen finer than about 3 device pixels, dots alias and a moiré appears that a press would not make.
- The screen pitch is in CSS pixels, as a print's lines per inch are physical: it scales with device pixel ratio.
- It is a light-page native: the paper is the page.

## When to use it

A print treatment for a hero image, an editorial or poster page. A CSS halftone (a radial-gradient dot pattern masked over the image) gets one screen at one angle: no separation, no rosette, no gain.

## References

- [plan.md](../../../plan.md), story 2.1; [docs/eras.md](../../../docs/eras.md), the 1960s.
- J. A. C. Yule, _Principles of Color Reproduction_ (Wiley, 1967): screens, dot gain and grey component replacement.
