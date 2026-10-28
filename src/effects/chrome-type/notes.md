## How it works

The heading comes from the text field (`src/gpu/text/`). Anton's outlines are flattened to polylines at build time (`scripts/font-outlines.mjs`, 13 kB gzipped). At load, a compute pass writes an exact single-channel signed distance atlas from them (96 px per em, a 16 px spread), and each frame the line is drawn as glyph quads into an `r16float` target with `min` blending: the distance to the nearest letter, in pixels.

`lettering.wgsl` turns that distance into chrome. Inside the letters, the distance to the edge gives a quarter-round bevel, and its gradient gives the normal's direction (`chrome_normal` in `src/wgsl/chrome.wgsl`). Where two edges meet, on a stroke's centre line, the gradient's length drops, and the bevel fades flat there, so no specks appear. The normal reflects a horizon, the way an airbrush artist painted chrome: a sky gradient above, a bright line, dark ground warming downwards below. The line is bent by the bevel, so it curves round each letter (`chrome_horizon`). Around the letters: a dark outline, a drop shadow, and a gleam that sweeps across now and then. Glints are four-pointed stars at each glyph's top-left extreme, drawn additively in a second pass, with intensity from the band-limited flicker signal.

It needs no 3D model and no environment map.

## Cost

On an Apple M1 Max on Dawn ([docs/studies/epic-6.md](../../../docs/studies/epic-6.md)): 0.5 to 0.9 ms per frame at 1080p across presets, 1.4 ms at the largest cap height. In Chrome, one 1920 × 1080 frame reads 0.96 ms. Tier A, provisional; the plan guessed B. The atlas is built once at load. 18.6 kB gzipped of its own, nearly all of it Anton's outlines, 45 kB in all.

Flash `low`: the glints flicker, held under three a second and small. Pattern `none`.

## Pitfalls

- Only Anton's printable ASCII is in the atlas. Kerning is not read; the layout uses advance widths and a tracking control.
- A thin face would leave little bevel: the effect is made for heavy display type.
- On a light page, the dark outline and shadow carry it; the sky and ground palettes are dark-page natives (`lightPage` untested).

## When to use it

A logo or heading on a retro, music or game page. The CSS version, a gradient clipped to the text with `background-clip: text`, gets the sky and ground but cannot bend the horizon with the letterforms, and has no bevel; use it when the heading is small or must be selectable text with no canvas.

## References

- [plan.md](../../../plan.md), stories 1.6 and 6.1; [docs/eras.md](../../../docs/eras.md), the 1980s.
- Chris Green, [Improved Alpha-Tested Magnification for Vector Textures and Special Effects](https://steamcdn-a.akamaihd.net/apps/valve/2007/SIGGRAPH2007_AlphaTestedMagnification.pdf) (Valve, 2007).
- Anton, by Vernon Adams, [SIL Open Font License 1.1](../../../fonts/Anton-OFL.txt).
