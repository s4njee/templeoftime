# Browser check

Every registered effect, loaded in Google Chrome 156.0.8078.48 (headless, this machine's GPU) on 2026-10-28 by `npm run browser-check`.

Views per effect: `hero-light` (1280 × 900), `hero-dark` (1280 × 900), `cards-dark` (1280 × 900), `band-light` (1280 × 900), `backdrop-dark` (1280 × 900), `phone-light` (390 × 844 at 2x), `phone-dark` (390 × 844 at 2x), `hud-1080p` (1920 × 1080). The layouts are the mock pages of the effect page; "light" and "dark" are the page tone of the stage.

- **Started** counts the views in which the effect got a canvas and drew more than a flat fill, with no fallback notice and no console error.
- **Animates** means two captures a second apart differ by more than dither in at least one view.
- **HUD** is what the performance HUD showed on a 1920 × 1080 canvas: frames per second, and the GPU time of one frame as the browser reports it (first pass start to last pass end), as the median of several page loads with the range beside it. The range is wide for the lightest effects: when there is little to draw the GPU idles, and the same page reads either near the timing floor or about twice that from one load to the next.

The HUD time is not the number the cost studies report. It is one frame measured alone, through Chrome's coarse timestamps, on a GPU that idles between frames, so it carries a floor and reads higher than the per-frame cost in `docs/studies/epic-*.md`. It is here because it is what a visitor's browser actually does. This check says nothing about how an effect looks: the screenshots do.

| Effect | Started | Animates | HUD at 1080p |
| --- | ---: | --- | --- |
| airbrush | 8 of 8 | yes | 60 fps, 0.29 ms (0.27 to 0.31 over 3 loads) |
| chrome-type | 8 of 8 | yes | 60 fps, 0.96 ms (0.89 to 0.96 over 3 loads) |
| faded-print | 8 of 8 | yes | 60 fps, 0.69 ms (0.68 to 0.70 over 3 loads) |
| hello | 8 of 8 | yes | 60 fps, 0.33 ms (0.33 to 0.34 over 3 loads) |
| offset-print | 8 of 8 | yes | 60 fps, 1.49 ms (1.48 to 1.50 over 3 loads) |
| photocopy | 8 of 8 | yes | 60 fps, 0.27 ms (0.27 to 0.28 over 3 loads) |
| pop-dots | 8 of 8 | no (a still picture) | 60 fps, 0.32 ms (0.29 to 0.34 over 3 loads) |
| screen-print | 8 of 8 | no (a still picture) | 60 fps, 0.31 ms (0.28 to 0.32 over 3 loads) |
| sunburst | 8 of 8 | yes | 60 fps, 0.37 ms (0.37 to 0.38 over 3 loads) |

No view logged a console error.
