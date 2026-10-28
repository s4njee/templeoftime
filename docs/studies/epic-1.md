# Cost study: Epic 1

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
| (floor) | one constant-colour pass | 1 | 0.07 | 0.07 | 0.02 to 0.35 |
| (tail) | constant scene + bloom + output | 11 | 0.66 | 0.63 | 0.17 to 1.38 |
| hello | default | 2 | 0.39 | 0.26 | -0.46 to 0.92 |
| hello | preset gold | 2 | 0.33 | 0.26 | 0.04 to 0.68 |
| hello | preset jade | 2 | 0.33 | 0.26 | 0.24 to 0.28 |
| hello | preset nearly still | 2 | 0.33 | 0.22 | -0.20 to 0.44 |

## 960 × 540

| Effect | Configuration | Passes | Span (ms) | Per frame (ms) | Range (ms) |
| --- | --- | ---: | ---: | ---: | --- |
| (floor) | one constant-colour pass | 1 | 0.07 | 0.09 | -0.15 to 0.39 |
| (tail) | constant scene + bloom + output | 9 | 0.46 | 0.35 | -0.20 to 1.07 |
| hello | default | 2 | 0.13 | 0.09 | 0.07 to 0.28 |
| hello | preset gold | 2 | 0.13 | 0.09 | -0.11 to 0.24 |
| hello | preset jade | 2 | 0.13 | 0.11 | 0.07 to 0.50 |
| hello | preset nearly still | 2 | 0.13 | 0.11 | 0.07 to 0.52 |

## Download size

What the page fetches to show the effect, beyond the first-load bundle (7.3 kB gzipped, no shaders).

| Effect | Chunks | Own chunk (kB gzip) | Total (kB gzip) |
| --- | ---: | ---: | ---: |
| hello | 15 | 0.9 | 24.3 |
