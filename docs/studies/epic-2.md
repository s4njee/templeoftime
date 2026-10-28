# Cost study: Epic 2

Measured 2026-10-28 on **Metal driver on macOS Version 26.6.2 (Build 25G83)** (unclassified), Dawn (node webgpu bindings).

Method: GPU timestamps: frame span (first pass start to last pass end) and marginal cost per extra frame. 12 warm-up frames, then the median of 11 rounds; each round encodes the frame once and 4 times in one command buffer.

- **span** is one frame alone, first pass start to last pass end. It includes the timing floor of this adapter (the `(floor)` row).
- **per frame** is the cost of one more frame of the same work (the slope). It is the number to compare effects by, and the one the Scorecard shows.
- `(tail)` is the HDR tail alone at its default settings. Every effect below includes it.

Only this adapter was measured. spanMs includes the timing floor (see the "(floor)" rows); slopeMs is the cost of one more frame of the same work and is the number to compare by. A slope at or below zero means the work is below what this method can resolve.

Two limits on reading these numbers. Repeated runs of a light effect differ by up to about half a millisecond (see the Range column), and a GPU's clock follows its load, so a light effect can read slower per unit of work than a heavy one: differences under about half a millisecond mean nothing. And the Tier A and B budgets are set for an integrated GPU; a time measured on a faster one can show an effect is over budget but cannot show that it fits.

## 1920 × 1080

| Effect | Configuration | Passes | Span (ms) | Per frame (ms) | Range (ms) |
| --- | --- | ---: | ---: | ---: | --- |
| (floor) | one constant-colour pass | 1 | 0.07 | 0.07 | 0.04 to 0.07 |
| (tail) | constant scene + bloom + output | 11 | 0.52 | 0.37 | 0.28 to 0.68 |
| airbrush | default | 2 | 0.20 | 0.09 | 0.04 to 0.13 |
| airbrush | preset sunset | 2 | 0.20 | 0.09 | 0.09 to 0.15 |
| airbrush | preset dusk | 2 | 0.20 | 0.11 | 0.09 to 0.15 |
| airbrush | preset spraying it in | 3 | 4.92 | 4.81 | 4.81 to 4.83 |
| airbrush | preset a rough hand | 2 | 0.13 | 0.11 | 0.07 to 0.13 |
| faded-print | default | 2 | 0.26 | 0.22 | 0.20 to 0.24 |
| faded-print | preset forty years in an album | 2 | 0.26 | 0.24 | 0.20 to 0.24 |
| faded-print | preset ten years on the wall | 2 | 0.26 | 0.22 | 0.20 to 0.24 |
| faded-print | preset against CSS sepia | 2 | 0.33 | 0.22 | 0.20 to 0.31 |
| faded-print | preset age it as you watch | 2 | 0.33 | 0.31 | 0.26 to 0.39 |
| offset-print | default | 2 | 0.79 | 0.76 | 0.44 to 1.27 |
| offset-print | preset poster | 2 | 0.92 | 0.85 | 0.74 to 0.90 |
| offset-print | preset newsprint | 2 | 0.79 | 0.72 | 0.50 to 1.40 |
| offset-print | preset fine, coated | 2 | 0.92 | 0.79 | 0.61 to 1.11 |
| offset-print | preset swatches | 2 | 0.79 | 0.68 | 0.61 to 0.81 |
| offset-print | preset moiré: one angle | 2 | 0.79 | 0.72 | 0.55 to 1.11 |
| offset-print | preset real dots | 2 | 0.79 | 0.70 | 0.55 to 0.90 |
| photocopy | default | 2 | 0.20 | 0.13 | 0.13 to 0.17 |
| photocopy | preset third generation | 2 | 0.26 | 0.24 | 0.20 to 0.26 |
| photocopy | preset clean copy | 2 | 0.33 | 0.22 | 0.22 to 0.24 |
| photocopy | preset copy of a copy of a copy | 2 | 0.20 | 0.11 | 0.07 to 0.13 |
| photocopy | preset snapshot, dark | 2 | 0.20 | 0.15 | 0.13 to 0.20 |
| pop-dots | default | 2 | 0.26 | 0.24 | 0.22 to 0.26 |
| pop-dots | preset comic | 2 | 0.26 | 0.24 | 0.22 to 0.26 |
| pop-dots | preset poster | 2 | 0.33 | 0.24 | 0.20 to 0.24 |
| pop-dots | preset fine, white paper | 2 | 0.26 | 0.24 | 0.22 to 0.24 |
| pop-dots | preset full ink | 2 | 0.26 | 0.24 | 0.22 to 0.26 |
| screen-print | default | 2 | 0.26 | 0.24 | 0.17 to 0.28 |
| screen-print | preset pop | 2 | 0.26 | 0.22 | 0.20 to 0.26 |
| screen-print | preset gig poster | 2 | 0.26 | 0.24 | 0.22 to 0.26 |
| screen-print | preset duotone | 2 | 0.26 | 0.24 | 0.22 to 0.26 |
| screen-print | preset loose register | 2 | 0.26 | 0.22 | 0.15 to 0.28 |

## 960 × 540

| Effect | Configuration | Passes | Span (ms) | Per frame (ms) | Range (ms) |
| --- | --- | ---: | ---: | ---: | --- |
| (floor) | one constant-colour pass | 1 | 0.07 | 0.07 | 0.02 to 0.11 |
| (tail) | constant scene + bloom + output | 9 | 0.52 | 0.33 | 0.31 to 0.37 |
| airbrush | default | 2 | 0.13 | 0.11 | 0.07 to 0.11 |
| airbrush | preset sunset | 2 | 0.13 | 0.11 | 0.07 to 0.11 |
| airbrush | preset dusk | 2 | 0.13 | 0.11 | 0.09 to 0.11 |
| airbrush | preset spraying it in | 3 | 1.44 | 1.33 | 1.29 to 1.51 |
| airbrush | preset a rough hand | 2 | 0.07 | 0.09 | 0.09 to 0.11 |
| faded-print | default | 2 | 0.13 | 0.09 | 0.09 to 0.13 |
| faded-print | preset forty years in an album | 2 | 0.13 | 0.09 | 0.04 to 0.11 |
| faded-print | preset ten years on the wall | 2 | 0.13 | 0.11 | 0.07 to 0.13 |
| faded-print | preset against CSS sepia | 2 | 0.20 | 0.13 | 0.11 to 0.20 |
| faded-print | preset age it as you watch | 2 | 0.26 | 0.20 | 0.15 to 0.28 |
| offset-print | default | 2 | 0.46 | 0.39 | 0.37 to 0.46 |
| offset-print | preset poster | 2 | 0.46 | 0.39 | 0.35 to 0.44 |
| offset-print | preset newsprint | 2 | 0.46 | 0.39 | 0.37 to 0.44 |
| offset-print | preset fine, coated | 2 | 0.46 | 0.39 | 0.37 to 0.46 |
| offset-print | preset swatches | 2 | 0.39 | 0.35 | 0.35 to 0.37 |
| offset-print | preset moiré: one angle | 2 | 0.46 | 0.39 | 0.39 to 0.42 |
| offset-print | preset real dots | 2 | 0.46 | 0.39 | 0.37 to 0.42 |
| photocopy | default | 2 | 0.13 | 0.11 | 0.09 to 0.13 |
| photocopy | preset third generation | 2 | 0.13 | 0.11 | 0.07 to 0.11 |
| photocopy | preset clean copy | 2 | 0.13 | 0.09 | 0.09 to 0.11 |
| photocopy | preset copy of a copy of a copy | 2 | 0.13 | 0.11 | 0.07 to 0.11 |
| photocopy | preset snapshot, dark | 2 | 0.13 | 0.11 | 0.09 to 0.15 |
| pop-dots | default | 2 | 0.13 | 0.11 | 0.09 to 0.13 |
| pop-dots | preset comic | 2 | 0.13 | 0.11 | 0.11 to 0.13 |
| pop-dots | preset poster | 2 | 0.13 | 0.11 | 0.07 to 0.13 |
| pop-dots | preset fine, white paper | 2 | 0.13 | 0.11 | 0.09 to 0.13 |
| pop-dots | preset full ink | 2 | 0.13 | 0.11 | 0.09 to 0.11 |
| screen-print | default | 2 | 0.13 | 0.11 | 0.09 to 0.11 |
| screen-print | preset pop | 2 | 0.13 | 0.11 | 0.09 to 0.11 |
| screen-print | preset gig poster | 2 | 0.13 | 0.11 | 0.09 to 0.11 |
| screen-print | preset duotone | 2 | 0.13 | 0.11 | 0.09 to 0.11 |
| screen-print | preset loose register | 2 | 0.13 | 0.11 | 0.07 to 0.13 |

## Download size

What the page fetches to show the effect, beyond the first-load bundle (8.7 kB gzipped, no shaders).

| Effect | Chunks | Own chunk (kB gzip) | Total (kB gzip) |
| --- | ---: | ---: | ---: |
| airbrush | 20 | 1.5 | 33.3 |
| faded-print | 17 | 1.7 | 34.0 |
| offset-print | 21 | 1.7 | 36.3 |
| photocopy | 17 | 1.5 | 33.6 |
| pop-dots | 22 | 1.6 | 37.1 |
| screen-print | 20 | 1.6 | 35.9 |
