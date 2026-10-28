## How it works

A chain of passes (`copy.wgsl`), one per generation, each copying the one before through two ping-pong targets, then one pass that lays the last copy's reflectance on its paper. A generation does what a copier does:

- **Placement.** It looks at the original through a small skew, a scale a little off 100% and a shift: the original never lies quite square on the glass.
- **Optics.** It blurs what it sees over a small disc of samples.
- **Toner.** It thresholds steeply, with a little noise in the drum's charge, so a grey prints black or does not.
- **Faults.** Toner specks land on white, dropouts leave holes in black, and the drum's scratches and dirt add thin streaks and faint grey bands down the feed.
- **The lid.** Off the original is the lid: black when it was left open, as on many a flyer.

The next generation copies that, so blur, skew and noise compound: a copy of a copy of a copy falls apart. The default picture is a club flyer (`picture_page`): a headline, a photograph printed light for copying, and short captions.

The chain runs again only when its inputs change. A copy is a still, so each frame after the first draws only the final pass.

## Cost

On an Apple M1 Max on Dawn ([docs/studies/epic-2.md](../../../docs/studies/epic-2.md)): the chain runs only when its inputs change, so a frame costs 0.11 to 0.24 ms at 1080p, the final pass and the tail. A generation is one pass of eight samples; the chain's own cost after a change is not measured separately yet. In Chrome a frame reads 0.27 ms. Tier A, provisional. 1.5 kB gzipped of its own, 33.6 kB in all.

Flash `none`, pattern `none` at the default, at 0.7 and at every preset.

## Pitfalls

- A column of body text is a grating: lines of type on regular leading are stripes by the pattern rule, at high contrast once copied. The flyer keeps every block of type to three lines. A page of continuous text through this effect, at a size where its lines span a 10° field, would fail the rule.
- Stripes in the original (a woven texture, a banded sun) harden into gratings when copied; the shared pictures avoid them.
- Specks are a CSS pixel each, so they stay the same size at any device pixel ratio.

## When to use it

A zine, flyer or grunge page; the base of grunge type (7.4). A CSS version (`filter: grayscale(1) contrast(4)` with a noise overlay) gets one threshold, with no generation loss, no skew and no streaks. Tier A.

## References

- [plan.md](../../../plan.md), story 2.4; [docs/eras.md](../../../docs/eras.md), the 1990s.
