# Temple of Time — WebGPU research site for the look of the decades

A research site that implements, measures and documents the visual aesthetics of the 1960s, 70s, 80s and 90s, and the Art Deco they kept returning to:
- sunbursts and gold leaf;
- op art and Ben-Day dots;
- supergraphics, disco balls and lava lamps;
- airbrushed chrome, neon signs and Memphis patterns;
- translucent candy plastic, raytraced chrome and photocopied grunge.

It asks one question of each: **would you actually ship this on a website?** Every effect gets a live demo, readable source, a write-up and a practicality scorecard. A sibling of [Fire Temple](../firetemple/plan.md), [The Bazaar](../thebazaar/plan.md), [The Hero's Journey](../herosjourney/plan.md) and [Snow Temple](../snowtemple/plan.md), on the same page structure and the shared temple core.

The name is time itself. The showpiece (Epic 8) is a page that travels: the same content restyled decade by decade as the visitor scrolls, from Deco to the turn of the millennium.

What separates this family from a pile of retro filters is that every look was made by a process, and the process can be rebuilt:
- **Pop art and posters.** Their dots are halftone screens at fixed angles, which moiré into rosettes where colours overlap, and spread on absorbent paper (dot gain).
- **Screen prints** misregister because each colour is a separate pass.
- **Airbrushed chrome lettering** is a horizon reflected in a curved surface: sky above, desert below, a hard line between, and star-shaped glints where the light catches.
- **A neon sign** is a bent glass tube of a known gas or phosphor, mounted off a wall, flickering as it strikes.
- **A disco ball** throws one spot of light for every mirror tile.
- **A lava lamp** is convection.
- **Faded photographs of the 70s** are dyes failing at different rates: in many papers of the period, cyan first in the dark and yellow first in the light (to be confirmed in 1.7).

Each effect starts from how it was made, and the look follows.

## Goals

- Cover the main looks of each period, each from its process or material:
  - **Art Deco and Streamline (1920s–30s, and its 60s–80s revivals):** sunbursts and fans, stepped and chevron borders, gold leaf, etched glass, speed lines;
  - **the 1960s:** op art, Ben-Day dots and pop outlines, space-age white plastic and chrome, Swiss grid layout, warped poster lettering;
  - **the 1970s:** supergraphics wrapping a page, disco-ball spots, lava lamps, rainbow stripes and outlined type, faded photographs;
  - **the 1980s:** airbrushed chrome type, outrun sunsets, Memphis patterns, glass-tube neon, laser backdrops, glowing grid lines;
  - **the 1990s:** translucent candy plastic, raytraced chrome with lens flares, photocopied grunge type, confetti-and-brush patterns, web 1.0 bevels and tiles, screensavers.
- Build the period's processes once, as shared pieces:
  - a print pipeline (separation, screen angles, dot gain, misregistration, paper);
  - an airbrush (soft gradients, overspray speckle, masks);
  - chrome by horizon reflection;
  - glass-tube neon;
  - era palettes in OKLCH;
  - a text distance field for type treatments.
- Be era-honest, not era-copied. Patterns are generated in a style and documented with dated sources (`docs/eras.md`). No designer's artwork, trademark or commercial typeface is reproduced.
- Ship effects shaped like website parts: a decade-themed hero, a neon sign over a heading, chrome lettering for a logo, supergraphic stripes wrapping sections, disco spots across a party page, a Memphis background, a faded-photo treatment for a page's own images, and era themes for buttons and cards.
- Say plainly when CSS does the job, which for this family is often. Web 1.0 is CSS by definition, and much of Deco is borders and gradients. The scorecard is where an effect earns its WebGPU.
- Keep it safe. Op art is the textbook high-contrast pattern. Disco spots sweep the whole page. Neon flickers as it strikes, and a laser show strobes. Every effect runs through The Hero's Journey's flash, pattern and motion checks.

## Non-goals

- **Display and signal technology.** CRTs, VHS, broadcast snow, film gates, split-flaps, nixies and vector scopes are The Bazaar's. This family is the design shown on them, not the screen.
- **Psychedelic light shows.** The 1960s liquid light show, the form constants and colour cycling belong to The Hero's Journey. This family's 60s is the print and product design of the decade, and poster lettering.
- **Copies.** No reproduction of specific artworks, posters, logos, characters, typefaces or trademarked patterns. A Memphis-style pattern is generated from the style's vocabulary, not traced from a Sottsass laminate.
- **Vaporwave and later nostalgia.** The 2010s remix of the 80s and 90s is a later aesthetic about these ones. Where a look is mostly known through it (outrun), the notes say so and build from the original period sources.
- **Strobe.** The disco strobe and the laser-show chase are classic and dangerous. They are not built, not even as declared presets.

## Decisions

These are defaults chosen so work can start. Each is cheap to revisit before Epic 1 is finished.

| Decision         | Default                                                                                                                                           | Why                                                                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation       | The Hero's Journey's shell (from Moon Temple, via Storm Temple, The Bazaar and Fire Temple) on `@mk7s/hologpu-temple-core`                       | It has what this family leans on most: palettes and their editor, OKLCH colour, the fold library (sunbursts and fans are rosettes), the colour stage, and the flash, pattern and motion checks.                                         |
| Build tooling    | Vite + TypeScript (strict), with WGSL `#include` resolved per effect at build time                                                                | Same as every temple, so shader text never reaches the first load.                                                                                                                                                                       |
| Rendering API    | Raw WebGPU + WGSL, thin helpers                                                                                                                   | The research subject is WebGPU itself.                                                                                                                                                                                                   |
| Colour pipeline  | Linear HDR `rgba16float` scene → tonemap → sRGB, with era palettes as OKLCH stops. Print effects work in ink densities and multiply onto paper    | Neon and chrome glints are light, brighter than paper white. Print is the opposite: ink subtracts from paper, so it composites by multiplying, and reads best on a light page.                                                           |
| Era palettes     | One palette per period and style, from dated sources (paint charts, product catalogues, print specimens), as OKLCH stops in `docs/eras.md`        | "Seventies colours" is a cliché until it is a palette someone documented. The palette editor (The Hero's Journey 3.2) edits them.                                                                                                        |
| Type             | Open-licensed fonts only (SIL OFL), rendered to a multi-channel signed distance field atlas, shared with Storm Temple's and Snow Temple's text work | Chrome, neon, outlines and grunge are all type treatments, and they need a text field. Commercial period typefaces cannot be shipped.                                                                                                    |
| Intensity        | The shared `dose` control, labelled "intensity": pattern contrast, motion, glitter and flicker together. Default 0.35                            | One control a page can turn down; the analysers' contract holds up to its strong end (0.7).                                                                                                                                              |
| Safety checks    | Flash, red-flash, pattern and motion checks over every effect and preset, at the default and at the strong dose, in `npm test`                  | Op art and Memphis are regular patterns; disco spots and supergraphic sweeps are whole-field motion; neon strikes and glints are flicker.                                                                                                 |
| Accent           | Avocado (`#b8c95c` dark, `#5b6b14` light). The tier colours are checked against it in story 1.1; Tier A moves off green if they clash             | No colour was named. Avocado is the 1970s kitchen green, and no other family has it.                                                                                                                                                     |
| Neutrals         | Warm paper greys, light and dark equally                                                                                                         | Print looks are light-page natives, chrome and neon dark-page ones. Both themes are primary.                                                                                                                                             |
| CSS prefix, port | `tt-`, dev port 5480, launch config `templeoftime`                                                                                                | 5373, 5390, 5410 to 5470 and 5441 are taken by the other holofx projects.                                                                                                                                                                |
| Hosting          | Cloudflare Pages (classic) project `templeoftime`, direct upload                                                                                  | No server needed. Create the project with `wrangler pages project create --force`, or wrangler converts the repo to Workers.                                                                                                             |
| No-WebGPU        | A poster per effect, and the CSS version wherever one is honest, which is often (story 9.4)                                                       | Deco borders, web 1.0 bevels, 70s stripes and outlined type are CSS. A disco ball's spots, a halftone of the page's own image and chrome by reflection are not.                                                                         |

## Carried over from the other temples

These findings shape this plan, so they need not be rediscovered.

- **A canvas cannot read the page** (Water and Fire Temple). Element geometry is available every frame (`src/gpu/dom-rects.ts`); element pixels are not, except an image or canvas the page owns, uploaded with `copyExternalImageToTexture`. Halftoning or fading the page's own photograph works on images the page hands over.
- **A rosette is a regular pattern** (The Hero's Journey M1). A sunburst of more than five rays at a luminance step of 0.1 or more, filling a 10° field, fails the pattern rule. So does op art, which is its point. Sunbursts and fans hold their step down by default, or stay small, and op art at full contrast is a gated preset.
- **Patterns of dots are a known gap** (The Hero's Journey 2.2). The pattern analyser does not flag dot lattices, though the guidance counts rows of dots. Halftone screens and Ben-Day dots are exactly that, so their notes say so, and story 9.3 revisits it.
- **Apparent motion counts** (The Hero's Journey 2.4). Disco spots crossing the page, scrolling supergraphics and a turning sunburst are whole-field motion to the motion check.
- **Optical flow cannot see sparse, faint particles** (Snow Temple 2.4). A few dozen disco spots on a dark page may be invisible to the motion check, so their motion is held to the caps from the effect's own transform.
- **A tonemap widens a luminance step** (The Hero's Journey M1). Effects that limit their step for the pattern rule draw untonemapped.
- **Glitter is flicker** (Fire Temple `flicker.wgsl`). Disco glints, neon strike flicker and chrome stars use the band-limited flicker signal, so they cannot exceed three flashes a second.
- **Envelopes that dip are extra flashes** (Storm Temple). A neon tube's strike is tested at many frame phases.
- **A held frame is the frame** (Storm Temple 6.2). The held frame of a disco ball or a neon sign is a calm, lit moment, never the instant a glint peaks.
- **A dozen elements is a CSS job; hundreds is the shader's** (Moon Temple, Snow Temple 2.5). CSS keyframes cost main-thread time per element. A page of disco spots or Memphis confetti crosses over at a few dozen.
- **The stroke renderer** (Storm Temple 6.3). Neon tubes, grid lines and Tron-style edges are thick HDR strokes.
- **Spectral and thin-film chunks exist** (Light Temple `holo-card`, Moon Temple `spectral.wgsl`, The Hero's Journey `thinfilm.wgsl`). 90s holographic foil and raytraced dispersion reuse them.
- **Halftone and dither exist** (hologpu `halftone-ascii`, `dither`). Story 2.1 builds the full print pipeline on top of them rather than beside them.
- **Scratch work needs a home.** Long sweeps and probes go in `experiments/`, outside test, typecheck and lint.

## Overlaps and who owns what

| Nearby work                                       | Where                    | Temple of Time's part                                                                                                                 |
| ------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| CRT, VHS, film gate, split-flap, nixie, LED wall  | The Bazaar               | Not rebuilt. An era page here can be shown through The Bazaar's `crt` or `vhs`.                                                         |
| Liquid light show, form constants, hue cycling    | The Hero's Journey       | Not rebuilt. This family's 60s is print, product and poster lettering.                                                                  |
| `halftone-ascii`, `dither`, `grain-overlay`       | hologpu                  | 2.1's print pipeline (separations, screen angles, dot gain, misregistration) builds on their halftone and dither.                      |
| `grid-horizon` (eighties floor grid)              | hologpu                  | 6.2's outrun scene uses it; this family adds the sun, the chrome and the period palette.                                                |
| `liquid-chrome`                                   | Water Temple             | 6.1's chrome is lettering by horizon reflection, the airbrush artist's chrome, not a fluid.                                             |
| Lens flare, star filter                           | Moon Temple              | 7.2's raytraced logo and 5.6's soft-focus photo use Moon Temple's flare and glints.                                                     |
| `holo-card` foil                                  | Light Temple             | 7.7's holographic sticker reuses the foil.                                                                                              |
| Neon calligraphy                                  | Water Temple             | 6.4's neon is a glass tube on a wall with a gas and a strike, not ink.                                                                  |
| Paper and print                                   | research.md §4.6         | This family owns the period's print processes (halftone, screen print, photocopy). Page curls, folds and torn paper stay with that family. |
| Fur, shag, velvet                                 | research.md §4.4 (Wind and growth) | 5.5 is a flat textile surface; shell-and-strand fur belongs to Wind and growth.                                               |

## Practicality tiers

Every effect is tagged with a tier. Budgets are starting targets, to be validated in Epic 10.

| Tier            | Meaning                                             | Shape                                                        | GPU budget @1080p                   |
| --------------- | --------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------- |
| **A** Drop-in   | Safe as ambient decoration, including mobile        | One or two fragment passes, no compute, no history           | ≤ 2 ms on integrated GPU            |
| **B** Feature   | Hero sections and interactive set pieces            | Multi-pass, a small simulation, a text field                 | ≤ 6 ms on integrated GPU            |
| **C** Showpiece | Dedicated page or landing experience, desktop-first | Raytraced chrome, the time machine page, a full lava lamp    | ≤ 12 ms on discrete / Apple Silicon |

Budgets include the HDR tail.

## Architecture sketch

```
templeoftime/
  index.html
  vite.config.ts
  src/
    main.ts            bootstrap: one shared GPU session, mounts an effect
    gpu/               device, canvas, frame loop, shaders, uniforms, targets, passes, post/
                       (bloom, tonemap, colour stage), dom-rects, pointer, scroll, safety/
                       (dose, pattern, motion, colour caps, gate), colour/ (OKLab, palettes), plus
                       print/ (separation, screens, dot gain, misregistration, paper),
                       airbrush/ (gradients, overspray, masks), chrome/ (horizon environment,
                       bevel normals, glints), neon/ (tubes, gases, strike), text/ (MSDF atlas)
                       and era/ (era palettes and pattern vocabularies)
    wgsl/              shared chunks: hash, noise, sdf, oklab, fold, palette, plus halftone,
                       ink, paper, airbrush, chrome, neon and msdf
    effects/<id>/      meta.ts (eager), index.ts + *.wgsl (lazy chunk), notes.md, poster.webp
    shell/             app frame, gallery, effect page, contexts, controls, notes, scorecard, HUD
    lib/               the library entry: mount an effect on a caller's canvas
  tests/               vitest on Dawn's Node bindings: real WebGPU, no browser
  experiments/         scratch sweeps and probes; not part of the test run
  docs/                eras.md (dated sources and palettes), studies, findings
```

The effect contract is The Hero's Journey's, unchanged, `dose` included, so effects and shell code move between the families.

## Definition of done (per effect story)

1. **Budget.** It runs inside its tier budget on the reference devices, with the numbers recorded. Until the device matrix exists (10.2), the only reference device is the development machine, an M1 Max. It is measured per frame on Dawn and as one frame in Chrome, and gets the lowest tier whose budget neither number exceeds. An A or B label is provisional until 10.2, and the scorecard says so.
2. **Parameters.** They are exposed through the schema with `dose` honoured, and there are at least two presets.
3. **Lifecycle.** It handles resize, DPR changes, device loss, offscreen pause and `prefers-reduced-motion`. The held frame shows a calm moment (`tests/still.test.ts`).
4. **Flash, red flash, pattern and motion.** It stays under all four at its defaults and at the strong dose. Every preset that goes over is declared and starts behind the gate.
5. **Era.** Its look is documented in `docs/eras.md` with at least one dated source, and it reproduces no specific artwork, logo, typeface or trademark.
6. **Contexts.** It is shown in at least one realistic web context, over a dark and a light page and at phone size, and its screenshots have been looked at.
7. **Notes.** `notes.md` is written: how it works and what the process was, cost, pitfalls, safety, when to use it, and references. Where a CSS version exists, the notes say how close it gets.
8. **Release.** The scorecard is filled in and the fallback poster captured.

## Milestones

| Milestone                 | Scope                                       | Proves                                                                              |
| ------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| **M0** Vertical slice     | Epic 1, stories 2.1, 3.1, 6.1               | Tooling → the print pipeline → a Deco sunburst → chrome by reflection → deploy       |
| **M1** Process            | Rest of Epic 2, story 1.7's sources         | Every period process as a shared piece: print, screen print, photocopy, airbrush, fade |
| **M2** Deco and the 60s   | Rest of Epic 3, Epic 4                      | Gold, glass and borders; op art behind the gate; pop dots on the page's images       |
| **M3** The 70s            | Epic 5                                      | Supergraphics on page shapes, disco spots within the motion caps, a convecting lamp   |
| **M4** The 80s and 90s    | Rest of Epic 6, Epic 7                      | Chrome, neon, Memphis; candy plastic, raytraced chrome, grunge                       |
| **M5** On the page        | Epic 8, stories 9.1–9.5, 10.2               | The time machine page, era themes for components, on more than one device             |
| **M6** Release            | Rest of Epics 9 and 10                      | Published findings, shared pieces moved into the core                                |

The decade milestones (M2 to M4) depend only on M0 and M1, and can run in any order.

Story format: `ID Title [tier] (size)`. Sizes: S ≈ a day or less, M ≈ a few days, L ≈ a week or more.

---

## Epic 1 — Foundation and tooling

- [x] **1.1 Scaffold** (S) — The Hero's Journey's committed tree copied (`git archive HEAD`). Its effects and psychedelic-only code are removed; the fold library, palettes and editor, colour stage and safety checks stay. The `hj-` prefix is renamed `tt-`; watch template literals such as `` `--hj-${string}` ``. Avocado accent and warm paper neutrals, with the tier colours checked against it. Dev port 5480, launch config `templeoftime`. The `dose` control is labelled "intensity". The inherited modules' story numbers are marked as The Hero's Journey's. _Done from The Hero's Journey's commit d64c836. Its effects (`kaleidoscope`, `chroma-bloom`, `hue-cycle`) and the psychedelic-only code were removed; the fold library, palettes and editor, colour stage and safety checks stayed. Accent `#b8c95c` dark and `#5b6b14` light on warm paper neutrals; Tier A is teal and Tier B violet so neither is taken for the accent, and `tests/contrast.test.ts` passes. The headless harness now passes a device-pixel ratio (`viewDpr`), so effects sized in CSS pixels are analysed at true size._
- [x] **1.2 `hello`** [A] (S) — the smallest effect: a slowly turning Deco sunburst in an era palette, one fragment pass through the tail, with `dose` wired from the start and its step held under the pattern rule. _A Deco fan of rays turning at most 0.05 rad/s, its ray lightness solved so the step sits at `patternStepAt(dose)` above the ground. 0.26 ms on Dawn at 1080p, 0.69 ms in Chrome; flash and pattern `none`. Tier A on this machine._
- [ ] **1.3 Repository and CI** (S) — its own git repository and public GitHub remote, and the CI workflow on software Vulkan (lint, format, typecheck, tests, build), green once.
- [ ] **1.4 Deploy** (S) — Cloudflare Pages project `templeoftime` (classic, created with `--force`), and an `npm run deploy` that builds, checks the bundle and uploads `dist`.
- [ ] **1.5 Posters, catalogue and the holofx site** (S) — posters from held frames, `catalogue.json`, and Temple of Time in the holofx site's dropdown, lab and effect pages. _Partly done: posters from held frames and `catalogue.json`. The holofx site's dropdown, lab and effect pages are still to do._
- [x] **1.6 Text field** (M) — `src/gpu/text/`: open-licensed fonts rendered to a multi-channel signed distance field atlas (Chlumský's MSDF) at build time, with a WGSL sampler for crisp edges, outlines, bevels and glows at any size. Shared with Storm Temple's `electric-text` and Snow Temple's `frost-text`, and shaped to move into the core. _Changed from the plan: an exact single-channel distance field built on the GPU at load, not MSDF at build time. `scripts/font-outlines.mjs` reads a TrueType font itself (no font tooling) and writes its outlines flattened to polylines within 1.5 font units (13 kB gzipped for Anton's printable ASCII). A compute pass writes the atlas (96 px per em, a 16 px spread, `r16float`), and lines are drawn as glyph quads with `min` blending into a distance target. An exact field has no MSDF corner artefacts and needs no build-time tool; kerning is not read. `tests/text.test.ts` checks it against the CPU distance._
- [x] **1.7 Era sources** (M) — `docs/eras.md`: for each look, what it was, when, who documented it, and how it was made, with dated primary or catalogue sources. Each period gets palettes as OKLCH stops, and each pattern style a vocabulary of shapes. This is the research behind Definition of done 5, written before the effects so they are not built from clichés. _Written in M0 and checked against sources in M1: every "to verify" settled against a museum, archive, manufacturer or journal source and cited in place. Biba's big store was 1973–75; Memphis dissolved in 1988, not 1987; GE's gold was "Harvest", and "Burnt Orange" was not an appliance name (the appliance colours stay partly sourced, from collectors' records); newsprint dot gain is about 30% at 50%, not 20%; the 3D screensavers came with Windows NT 3.5 (1994). Wilhelm's 1993 book was not read; the dye-fade figures come from his 1981 JAIC paper, Anderson and Ellison (1992) and Nishimura (1996)._

## Epic 2 — Process

The processes the period's looks came from, each a shared piece with its own tests.

- [x] **2.1 Print pipeline** [—] (M) — `src/gpu/print/`, on hologpu's halftone and dither. It works like this: _`src/gpu/print/print.ts` and `src/wgsl/print.wgsl`, checked against each other. A cosine spot function linearised by a measured table, so a flat tint covers its nominal area; dot gain t + 4gt(1 − t) and its exact inverse; grey component replacement; inks multiplied as transmittances. Anti-aliased coverage, because a 0° screen sampled once per pixel cannot print every tone (a test records the limit). The traditional angles mottle less than half as much as two screens 5° apart. `offset-print` is its effect: 1.1 ms on Dawn, 5.4 ms in Chrome, so Tier B in M0; Tier A after M1 (2.2)._
  - an image or scene is separated into CMYK (or spot) inks;
  - each ink is screened as halftone dots at its own angle: 15°, 75°, 0° and 45° for cyan, magenta, yellow and black, the traditional set, which forms a rosette where the inks overlap;
  - dots grow with dot gain on absorbent paper;
  - each plate is offset a little by misregistration;
  - the inks multiply onto a paper with tooth and tone.

  Tested: a flat tint screens to its nominal coverage after dot gain; the screen angles give the rosette, not a moiré.
- [x] **2.2 `pop-dots`** [A] (S) — Ben-Day dots: flat colour areas filled with one ink's regular dots at a coarse screen, under heavy black outlines, the comic-print look of 1960s pop art. Over a generated scene or an image the page hands over. Dots are a lattice, which the pattern analyser does not flag (a known gap), so the notes measure the screen against the guidance by hand. _A shared picture (`src/gpu/picture/`, generated subjects drawn once into a texture) stands in for the page's image until 8.4. Separation without black, posterised to none, 25%, 50% or solid; black is the line plate (contours from lightness edges, spotted blacks). Not by hand after all: screens are dot lattices the ITC note counts, so the pattern analyser gained a `lattice` reading (two peaks and their sum and difference), which catches 7 of the 10 test lattices it used to miss, and the dots keep only as much contrast as holds the step under `patternStepAt(dose)`, summed over the inks dotted at each pixel (`screenContrast`, `print_flattened`); tints keep their true colour. `full ink` is gated. A still, cached (`src/gpu/still.ts`): 0.24 ms a frame on Dawn, 0.32 in Chrome; printing costs about 3 ms in Chrome once per change. Tier A. 2.1's `offset-print` takes the same rule, with `real dots` gated, and now reads the picture texture: 5.4 ms in Chrome became 1.5, so Tier A._
- [x] **2.3 `screen-print`** [A] (S) — a few flat ink layers, each a separate pass with its own misregistration, ink texture and slightly uneven coverage, as in a 1960s silkscreen. Over an image the page hands over, posterised to the layers. _Up to six passes in one shader, light inks first, each its own stencil cut from the softened picture's lightness, its own misregistration, ragged mesh edge, starved squeegee bands, mottle and pinholes, at 94% opacity. Pop, gig-poster and duotone ink sets in OKLCH. A still, cached: 0.24 ms a frame, 0.31 in Chrome; about 4.2 ms in Chrome once per change. Tier A._
- [x] **2.4 `photocopy`** [A] (S) — the 1990s photocopier and fax: a threshold with toner speckle, edge spread, generation loss from copying a copy, and streaks from a dirty drum. The base of 7.4's grunge type. _A real chain: one pass per generation through ping-pong targets, each skewed, scaled and shifted a little, blurred, thresholded with noise in the charge, with specks, dropouts and drum streaks, then laid on paper; the lid shows black off the original. The chain reruns only when its inputs change. The default subject is a club flyer: a column of body text is a grating by the pattern rule once copied, so no block of type has more than three lines. 0.11 to 0.24 ms a frame, 0.27 in Chrome. Tier A._
- [x] **2.5 Airbrush** [—] (M) — `src/gpu/airbrush/`: soft gradients built as overlapping sprays rather than linear ramps, overspray speckle at their edges, and hard masks (the frisket) cutting them. The base of chrome (6.1), 80s sunsets (6.2) and the period's illustration. _`src/wgsl/airbrush.wgsl` with its TypeScript twin `src/gpu/airbrush/airbrush.ts`, tested against each other on the GPU: Gaussian strokes, gradients of weighted overlapping passes that wander and vary in pressure, build-up as 1 − exp(−density), mean-preserving droplets, friskets. Its effect, `airbrush`, sprays an 80s sunset layer by layer through friskets, and can spray itself in. Painting costs 4.8 ms at 1080p, so the finished picture is cached: 0.1 ms a frame, 0.29 in Chrome, Tier A; spraying in is Tier B while it runs._
- [x] **2.6 `faded-print`** [A] (S) — a photograph aged as a 1970s colour print ages: each dye layer fades at its own rate (for many papers of the period, cyan fastest in dark storage and yellow in light, per Wilhelm, to be confirmed), so prints drift magenta or cyan. Then the base whitens and the contrast lifts. Over an image the page hands over, with the age in years as a parameter. Compared with a CSS `sepia()` and `hue-rotate()` filter, which does none of this. _`src/gpu/photo/fade.ts`: three dyes with side absorptions, densities solved for the dye amounts by the matrix inverse, first-order fading per dye, stain in the base. Rates set to the sources (1.7): in the dark cyan first, about 10% in 8.5 years, and blue stain in the whites, so prints drift red; on display magenta first, so they drift green and blue. Confirmed, with the plan's "yellow in light" corrected to magenta. A white-bordered print on an album page, with an ageing sweep, and `filter: sepia() hue-rotate()` beside it on sRGB-encoded values. 0.22 ms on Dawn, 0.69 in Chrome. Tier A._

## Epic 3 — Art Deco and Streamline

The 1920s–30s, and the revivals that kept returning to it: Biba in the late 1960s and 70s, Miami Beach's pastel Deco in the 1980s.

- [x] **3.1 `sunburst`** [A] (M) — Deco's sunburst, fan and stepped ray: rays from a point, alternating or tapered, stepped into tiers, in gold on black or in a revival palette. The fold library's rosettes make the rays. A sunburst of more than five rays is a radial pattern, so its luminance step is held under the pattern rule at the default (as The Hero's Journey's rosettes are), and full contrast is gated. _Rays from the bottom edge, the centre or a corner, tapered from `taper` to equal ray and gap at the rim, stepped into tiers that each mix between ground and ray. Gold on black, jade and gold, Miami. 0.17 to 0.26 ms on Dawn, 0.48 ms in Chrome; Tier A. `full contrast` is declared and gated._
- [ ] **3.2 `gold-leaf`** [B] (M) — gilding: thin metal leaf laid in overlapping squares with visible seams, burnished in places and cracked in others, reflecting a soft environment with metal's coloured highlights. Under the pointer the light moves. For a luxury heading or a Deco frame.
- [ ] **3.3 `deco-frame`** [A] (S) — stepped, chevron and zigzag borders drawn around the page's own elements from their rectangles, in gold or chrome lines, with corner fans. Compared with the CSS version (`border-image` and gradients), which does most of it.
- [ ] **3.4 `streamline`** [A] (S) — speed lines trailing an element as it moves or the page scrolls, as on 1930s streamlined trains and typography, and a chrome-strip highlight.
- [ ] **3.5 `etched-glass`** [B] (M) — a frosted glass panel with a design etched into it, lit from its edge so the etched lines glow, after the pressed and etched glass of the period. Over content the effect draws.
- [ ] **3.6 `miami-deco`** [A] (S) — the 1980s revival: a pastel facade at dusk, neon edge lines, palm shadows. The bridge to Epic 6.

## Epic 4 — The sixties

- [ ] **4.1 `op-art`** [B] (M) — op art in the style of the 1960s: generated grids and waves of stripes, squares and circles whose spacing, size and curvature vary across the field, so the flat image bulges, rotates or vibrates. It is the family's sharpest safety case: op art is a regular high-contrast pattern by design, and its vibration is the hazard. The default holds the luminance step under the rule; full black and white is a gated preset with a warning that says what it is.
- [ ] **4.2 `pop-outline`** [A] (S) — 2.2's dots with the pop art comic's heavy black contours and speech-balloon panels, as a hero treatment for an image the page hands over.
- [ ] **4.3 `space-age`** [B] (M) — the space-age interior: glossy white moulded plastic and chrome in organic curves, under soft studio light, as in the product design of the late 1960s. A product hero.
- [ ] **4.4 `poster-lettering`** [B] (M) — 1960s concert-poster lettering, where type is warped to fill a shape and letters swell into each other until they are hard to read. Text from 1.6's field, warped by a field that fills a chosen outline. Vibrating complementary colours are a red-flash and pattern case.
- [ ] **4.5 Swiss grid** [—] (S) — the International Typographic Style as a layout, not an effect. A study of what CSS Grid already does, with a short animated reveal, to settle that WebGPU has nothing to add here.

## Epic 5 — The seventies

- [ ] **5.1 `supergraphics`** [B] (M) — the 1970s supergraphic: bold stripes and arcs that wrap around a room's walls, here around the page's own sections and cards from their rectangles, bending around corners and continuing across gaps. They are drawn in the period palette, and slide gently on scroll inside the motion caps.
- [ ] **5.2 `disco-ball`** [B] (M) — a mirror ball turning above the page: a sphere of flat tiles reflecting a spotlight. Each tile throws one moving spot of light across the page, with the ball's own glints. Spots are energy-conserving points, and their sweep is held to the motion caps from the ball's own rotation, since a few dozen spots may be too sparse for the motion check (Snow Temple 2.4). A turning ball is whole-field motion; a fast one is gated, and a strobe is not built.
- [ ] **5.3 `lava-lamp`** [B] (M) — a lava lamp: wax that warms at the bottom, rises, cools and sinks, as 2D convection with temperature-dependent buoyancy, drawn as merging metaballs through a tapered glass vessel with its own glow. Slow by nature, which is the point.
- [ ] **5.4 `seventies-type`** [A] (S) — rainbow-striped headings in the period's brown-orange-gold, with multiple offset outlines and drop shadows. Mostly CSS (`text-shadow`, gradients), and the notes say so; WebGPU adds the stripes following the letterforms through 1.6's field.
- [ ] **5.5 Textiles** [A] (S) — period surfaces as flat textures: wood-grain laminate, crushed velvet with its directional sheen, and corduroy. Shag and fur are Wind and growth's.
- [ ] **5.6 `soft-focus`** [A] (S) — the 1970s portrait look: diffusion filter glow around highlights and a star filter's crossed glints, from Moon Temple's lens pieces, over an image the page hands over.

## Epic 6 — The eighties

- [x] **6.1 `chrome-type`** [B] (M) — airbrushed chrome lettering, as on 1980s album covers and arcade marquees. Text from 1.6's field is bevelled into a rounded profile. Its normals reflect a horizon environment: a sky gradient above, a dark ground below and a hard horizon line between, which is what an airbrush artist painted. Star-shaped glints sit at the highlights, and a sunset palette tints the sky. It needs no 3D model and no environment map file, which makes it a good effect to ship. Compared with the CSS gradient-and-`background-clip: text` version, which cannot bend the horizon with the letterforms. _On 1.6's field: a quarter-round bevel from the distance, faded flat on the strokes' centre lines where the gradient collapses; the horizon (`src/wgsl/chrome.wgsl`) bent by the bevel's normal; outline, drop shadow, a sweeping gleam, and star glints at each glyph's top-left extreme on the flicker signal. Sunset, steel and gold horizons. 0.5 to 0.9 ms on Dawn, 1.56 ms in Chrome: Tier A, not the B the plan guessed. 18.6 kB of its own, nearly all Anton._
- [ ] **6.2 `outrun`** [A] (S) — the sunset: a banded sun sliced by horizontal gaps, a perspective grid (hologpu's `grid-horizon`), distant mountains and a gradient sky, in the period palette. The notes say how much of this look is the 2010s revival's rather than the 80s'.
- [ ] **6.3 `memphis`** [A] (M) — patterns in the style of the Memphis Group (1981–87): squiggles, confetti, terrazzo flecks, zigzags, dots and solid geometric shapes in clashing pastels and black, scattered by a Poisson-disc sampler so nothing overlaps awkwardly. Generated from the style's vocabulary (1.7), not traced from any laminate. A background for a playful page.
- [ ] **6.4 `neon-sign`** [B] (M) — a glass-tube neon sign over a heading, drawn as tubes along the glyphs from 1.6's field:
  - the gas or phosphor sets the colour (neon's red-orange, argon and mercury's blue);
  - the glass has a hot core and a soft glow;
  - the tube sits off the wall, casting a dim shadow;
  - painted-over back-bends join the letters;
  - it flickers and buzzes as it strikes, through the flicker cap.

  Compared with the CSS `text-shadow` neon, which gets the glow and none of the tube.
- [ ] **6.5 `laser-backdrop`** [A] (S) — the 1980s portrait studio's laser background: thin coloured beams fanning across a dark field with soft haze, as a hero backdrop. The beams are a radial pattern, held under the rule.
- [ ] **6.6 `glow-grid`** [A] (S) — glowing edge lines on dark geometry, as in early 1980s computer-generated film, from Storm Temple's stroke renderer, around the page's elements.

## Epic 7 — The nineties

- [ ] **7.1 `candy-plastic`** [B] (M) — translucent coloured plastic, as on late-90s computers and handheld consoles: a tinted, slightly frosted shell that lets the light and the internal parts show through, with soft internal scattering and glossy highlights. Over the page's own cards, as a material.
- [ ] **7.2 `raytraced-logo`** [C] (M) — the 1990s 3D logo: an extruded, bevelled word of chrome or glass over a checkerboard floor and a gradient sky, raytraced in the fragment shader with reflections. It gets the lens flare it always had (Moon Temple's flare).
- [ ] **7.3 Web 1.0** [—] (S) — tiled backgrounds, bevelled buttons, marquees, visitor counters and starfield backdrops: built in CSS, as they were in HTML. A study of what WebGPU adds (the starfield, at most), and a style sheet for 8.2.
- [ ] **7.4 `grunge-type`** [A] (S) — 1990s grunge typography: type through 2.4's photocopier, overprinted, cropped and distressed, with ink spread and registration slips.
- [ ] **7.5 `confetti-brush`** [A] (S) — early-90s pattern: brush strokes and confetti shapes in teal, purple and magenta on white, generated from the style's vocabulary, not copied from any product.
- [ ] **7.6 `screensaver`** [B] (M) — a 1990s 3D screensaver in its own words: growing pipes with ball joints, or a flying-through-a-maze run, as a background or an idle state. The vector ones are The Bazaar's scope. A fly-through is vection, so the default is slow and the motion caps decide.
- [ ] **7.7 `holo-sticker`** [A] (S) — a holographic sticker or trading-card foil, from Light Temple's `holo-card`, tilted by the pointer.

## Epic 8 — Time on the page

- [ ] **8.1 `time-machine`** [C] (L) — the showpiece: one page of content (a heading, an image, three cards, a button) that travels through the decades as the visitor scrolls, from Deco through the 60s, 70s, 80s and 90s. Each era restyles the same elements with its effects and its CSS. Transitions are era-appropriate: a halftone dissolve, a wipe of supergraphic stripes, a chrome sweep, a photocopied cut. Motion stays inside the caps, and reduced motion gets a still page per era.
- [ ] **8.2 Era themes** (M) — buttons, cards, inputs and headings styled per era, CSS first, with WebGPU only where it earns it (chrome, neon, halftone images). A drop-in stylesheet and the effects that pair with it.
- [ ] **8.3 Decade hero** [B] (S) — a hero section per decade, each built from the family's effects, as copy-paste starting points.
- [ ] **8.4 Image treatments** [A] (S) — the page's own images through the period: Ben-Day, screen print, faded print, photocopy, soft focus. One component, one parameter: the year.

## Epic 9 — Production readiness

- [ ] **9.1 Library entry** (S) — mount any effect on a caller's canvas, with element tracking for the page effects, as the other families do.
- [ ] **9.2 Light pages** (M) — print looks are light-page natives and composite by multiplying; chrome, neon and disco are dark-page natives. Each effect's notes say which, and dark-page effects get a decided treatment over a light page: a dark band, an underlay, or none.
- [ ] **9.3 Accessibility** (M) — `docs/accessibility.md`, covering:
  - flash, pattern and motion over every preset;
  - op art and halftone dots against the guidance, by hand where the analyser has its dot-lattice gap;
  - disco and neon held to the flicker cap;
  - legibility: poster lettering and grunge type are hard to read by design, so they are for headings only, never for body text or controls.
- [ ] **9.4 CSS fallbacks** (S) — for each Tier A effect, the best CSS version beside it, with its cost and what it cannot do. For this family that is often most of the effect, and the scorecard says so.
- [ ] **9.5 Adaptive quality** (S) — screen resolution, glint count, spot count and simulation resolution scale with the measured frame time.
- [ ] **9.6 Into the temple core** (M) — move the print pipeline (2.1), the airbrush (2.5), chrome by horizon reflection (6.1), the neon tube (6.4) and the MSDF text field (1.6) into `@mk7s/hologpu-temple-core`.

## Epic 10 — Measurement and findings

- [ ] **10.1 Cost studies** (S) — every epic's effects on Dawn and in Chrome, filed in `docs/studies/`.
- [ ] **10.2 Device matrix** (M) — an integrated GPU, a phone, and Safari and Firefox, to settle the provisional tiers.
- [ ] **10.3 CSS against WebGPU** (M) — 9.4's pairs measured on the same devices: frame time, main-thread time, and where each breaks.
- [ ] **10.4 Decision guide** (S) — "which decade for which brand", "CSS or WebGPU for each look", and the cases where the answer is "use CSS".

## Risks and open questions

- **Cliché.** The period looks are so familiar that a rebuild can land as parody. Story 1.7's sources, and building from the process rather than the stereotype, are the defence. A look that cannot be sourced is cut.
- **Copying.** Memphis, 90s confetti and 80s chrome lettering have famous originals. Where is the line between a style's vocabulary and a specific design? The rule: generate from documented elements, never trace, and say in the notes which originals the style is known from.
- **Fonts.** Period display faces are mostly commercial. Are there open-licensed faces close enough for Deco, 70s and 80s headings, or does the family need to design its own letterforms in the text field?
- **Dots and the pattern rule.** Halftone and Ben-Day screens are regular dot lattices, the analyser's known gap. How do they compare with the guidance's "rows of repetitive elements", measured by hand?
- **Op art.** Is there an op-art default that is still op art under the pattern rule's step, or is op art only ever a gated preset?
- **CSS does most of it.** For several looks (Deco borders, web 1.0, 70s type) the honest answer may be "CSS". That is a finding, not a failure, and the plan keeps those as studies rather than effects.
- **Disco and motion.** A few dozen bright spots sweeping a dark page are whole-field motion that optical flow may not see. Is the ball's own rotation the right measure?

## Starting references

From memory, as the other families' plans began; each is to be confirmed against the source when its story is built (1.7).

- Bevis Hillier, _Art Deco of the 20s and 30s_ (1968), the book that named the style and helped revive it.
- Alastair Duncan, _Art Deco_ (Thames & Hudson, World of Art).
- Bridget Riley and Victor Vasarely's 1960s work, and the 1965 MoMA exhibition _The Responsive Eye_, which named op art for the public.
- Barbara Radice, _Memphis: Research, Experiences, Results, Failures and Successes of New Design_ (1984).
- Josef Müller-Brockmann, _Grid Systems in Graphic Design_ (1981).
- A printing trade manual of the period for the traditional CMYK screen angles and dot gain, to be chosen in 1.7.
- Henry Wilhelm, _The Permanence and Care of Color Photographs_ (1993), on dye fading rates.
- Viktor Chlumský, "Shape decomposition for multi-channel distance fields" (2015), the MSDF method.
- Rudi Stern, _Let There Be Neon_ (1979), on neon tube making and gases.
- David Carson and Lewis Blackwell, _The End of Print_ (1995), on 90s grunge typography.
