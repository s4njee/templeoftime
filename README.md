# Temple of Time

A research gallery of WebGPU effects for the look of the decades: Art Deco and the 1960s, 70s, 80s and 90s. Every look is rebuilt from the process that made it, such as the halftone press, the silkscreen, the photocopier, the airbrush, the neon tube and the fading dye. Each effect comes with a live demo, readable source, a write-up and a practicality scorecard, and is judged the way the temples judge theirs: **would you actually ship this on a website?**

Periods and their sources are in [docs/eras.md](docs/eras.md). Patterns are generated from a style's vocabulary; no specific artwork, logo, typeface or trademarked pattern is copied.

Sunbursts, op art and halftone screens are regular patterns, which photosensitivity guidance warns about. Every effect has a `dose` control from 0 to 1, labelled "intensity", calm by default. Every effect and preset runs through The Hero's Journey's checks in `npm test`, at the default and at the strong dose (0.7): the WCAG 2.3.1 flash and red-flash analyser, a regular-pattern analyser after the broadcast guidance, and caps on whole-field rotation, zoom and drift. Presets past the limits start paused behind a click-to-start notice. See [docs/safety.md](docs/safety.md).

It is built on Fire Temple's page structure and the shared temple core (`@mk7s/hologpu-temple-core`), from The Hero's Journey's copy of the shell. The accent is avocado. See [plan.md](./plan.md) for the roadmap.

## Getting started

```sh
npm install
npm run dev        # http://localhost:5480
npm test           # unit tests, plus the flash, pattern and motion checks and the held-frame audit over every effect
npm run build      # registry, typecheck, static build to dist/ and the bundle check
npm run study -- --epic 2   # cost study on Dawn: docs/studies/epic-2.md and the Scorecard numbers
npm run shot -- sunburst --times 2   # render an effect headlessly to PNG (output/shots)
npm run browser-check -- --report docs/studies/browser-check.md   # every effect in headless Chrome (dev server running)
npm run posters -- --force   # fallback posters from held frames, as WebP
npm run fonts      # rebuild the font outlines from fonts/*.ttf
npm run deploy     # build and upload dist/ to Cloudflare Pages (project templeoftime)
```

`?effect=<id>` opens an effect, `&hud=1` the performance HUD, and `&p.<param>=<value>` sets a parameter, `&p.dose=0.6` included.

## Effects

| Id             | What                                                                                                   | Tier |
| -------------- | ------------------------------------------------------------------------------------------------------ | ---- |
| `hello`        | The smallest effect: a Deco fan of rays turning slowly, held under the pattern rule                       | A    |
| `offset-print` | Four-colour process printing: separation, halftone screens at the traditional angles, dot gain, register | A    |
| `pop-dots`     | Ben-Day dots: a picture posterised to a comic's tints and screens, with contours and spotted blacks      | A    |
| `screen-print` | A silkscreen: flat inks, each its own stencil and pass, out of register, with squeegee texture           | A    |
| `photocopy`    | The photocopier: a copy of a copy, each generation blurred, skewed, thresholded, specked and streaked    | A    |
| `airbrush`     | An airbrushed 80s sunset sprayed through friskets, pass by pass, with overspray and droplets             | A    |
| `faded-print`  | A 1970s colour print aged dye by dye, cyan first in an album, magenta on the wall; against CSS sepia     | A    |
| `sunburst`     | The Art Deco sunburst: tapered, tiered rays from a rising sun, a centre or a corner                       | A    |
| `chrome-type`  | Airbrushed 1980s chrome lettering: a bevelled heading reflecting a painted horizon, with star glints      | A    |

## Layout

```
src/gpu/print/      the print pipeline: separation, the spot function and its table, dot gain, screen angles,
                    and screens held under the pattern rule
src/gpu/picture/    the generated pictures the processes work on, drawn once into a texture
src/gpu/airbrush/   strokes, sprayed gradients, droplets and friskets (twin of src/wgsl/airbrush.wgsl)
src/gpu/photo/      dye fading of colour prints
src/gpu/still.ts    the cache that lets a still effect pay its cost once per change
src/gpu/text/       the text field: font outlines, an exact signed distance atlas built on the GPU, glyph quads
src/wgsl/print.wgsl, chrome.wgsl   shader twins of the print pipeline, and chrome by horizon reflection
src/gpu/safety/     dose, the pattern analyser, motion estimate, colour caps and the start gate's rules
src/gpu/colour/     OKLab and OKLCH, palettes, Display P3
src/effects/<id>/   meta.ts, index.ts, shaders, notes.md, poster.webp
docs/eras.md        the periods: what each look was, its sources and palettes
fonts/              Anton (SIL Open Font License 1.1)
```

## License

MIT for the code. Anton is under the SIL Open Font License 1.1 ([fonts/Anton-OFL.txt](fonts/Anton-OFL.txt)).
