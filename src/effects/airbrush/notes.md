## How it works

One fragment pass (`spray.wgsl`) on the airbrush library (`src/wgsl/airbrush.wgsl`, with its TypeScript twin `src/gpu/airbrush/airbrush.ts`):

- **A stroke** is a Gaussian across a line: the airbrush's cone of droplets.
- **A gradient** is many overlapping passes, weighted towards the dark end, each wandering a little and varying in pressure, never a linear ramp (`airbrush_ramp`).
- **Paint builds up** as 1 − exp(−density), so passes over paint add less and less.
- **Close up, thin spray is droplets.** A share of the cells holds a whole speck, and the rest holds the mist, lowered so the mean coverage stays exact (`airbrush_deposit`).
- **A frisket**, a cut mask, stops the spray dead: the only hard edges in the picture.

The picture is an 80s sunset, sprayed in the illustrator's order, each layer through its frisket. First the sky violet from the top, then the glow up from the horizon. Next, the sun cut with three bands, yellow flat, then orange up from its foot. Last, the mountains: flat in their mid-tone, dark sprayed up from the bottom, and a rim of light along the ridge. `spray it in` sprays the layers pass by pass over about seven seconds, then holds; a held frame is the finished picture.

`tests/airbrush.test.ts` checks that a sprayed gradient falls all the way, carries past its ends (overspray) and bends away from a straight line. It also checks that droplets keep the mean, that a frisket edge falls in under 1.6 px where the spray's own takes over 12, and that the shader agrees with the TypeScript.

## Cost

On an Apple M1 Max on Dawn ([docs/studies/epic-2.md](../../../docs/studies/epic-2.md)): painting the picture is 34 sprayed passes per pixel, about 4.8 ms at 1080p (1.3 at 540p). The finished picture is a still, cached (`src/gpu/still.ts`), so a frame costs about 0.1 ms. In Chrome a frame reads 0.29 ms. Tier A for the finished picture, provisional. `spraying it in` repaints every frame for its seven seconds, at the 4.8 ms cost, which is Tier B while it runs. 1.5 kB gzipped of its own, 33.3 kB in all.

Flash `none`, pattern `none` at the default, at 0.7 and at every preset. The sun's frisket has three bands, under the pattern rule's five pairs.

## Pitfalls

- Mixing in linear light, paint at 85% cover over a white board still shows a lot of white: a gradient that fades to the board reads grey. The mountains get a flat mid-tone under their gradient for this reason, as an illustrator would lay one.
- Droplets are a hash per cell; at a `dose` near 1 the speckle starts to look like noise rather than spray.

## When to use it

A retro hero backdrop, and the shared base of chrome lettering's painted sky and the 80s sunsets (6.1, 6.2). CSS gradients are linear or eased ramps with no overspray, droplets or wandering passes; for a flat retro backdrop they are the cheaper choice. Tier A.

## References

- [plan.md](../../../plan.md), story 2.5; [docs/eras.md](../../../docs/eras.md), the 1980s.
