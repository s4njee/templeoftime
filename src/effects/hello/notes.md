## How it works

One fragment pass (`fan.wgsl`) into the HDR scene, then the shared tail with the tonemap off. Each pixel's angle from a point below the view's bottom edge, in ray units, picks ray or gap. `fwidth` sets the edge's width, so the rays stay smooth at any size and never alias into a moiré near the centre.

The two colours are set on the CPU. The ground is a dark OKLCH colour in the chosen hue. The ray's lightness is solved (`lightnessForLuminance`) so that its relative luminance sits exactly `patternStepAt(dose)` above the ground's. A fan of more than five rays is a radial pattern under the broadcast rule, so the step is what keeps it under. Both colours go through the red cap. The only motion is a slow turn, at most 0.05 rad/s.

## Cost

On an Apple M1 Max on Dawn ([docs/studies/epic-1.md](../../../docs/studies/epic-1.md)): 0.26 ms per frame at 1080p, 0.09 at 540p. In Chrome, one 1920 × 1080 frame reads 0.33 ms ([browser-check.md](../../../docs/studies/browser-check.md)). Tier A, provisional until the device matrix. 0.9 kB gzipped of its own, 24.3 kB with the shared chunks.

Flash `none`, pattern `none` at the default and at 0.7.

## Pitfalls

- Held under the pattern step, it is a dim fan: the contrast you would expect of a Deco door is over the rule at this size.
- Additive light on an opaque dark ground: on a light page it is a dark block.

## When to use it

As the template for a new effect: one pass, `dose` wired, colours solved for the pattern step. `sunburst` is the one to ship. A `repeating-conic-gradient` in CSS does this whole effect, and is the right choice when the fan does not need to turn.

## References

- [plan.md](../../../plan.md), story 1.2; [docs/eras.md](../../../docs/eras.md), Art Deco.
- Björn Ottosson, [A perceptual color space for image processing](https://bottosson.github.io/posts/oklab/) (2020).
