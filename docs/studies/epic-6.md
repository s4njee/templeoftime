# Cost study: Epic 6

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
| (floor) | one constant-colour pass | 1 | 0.07 | 0.07 | 0.02 to 0.17 |
| (tail) | constant scene + bloom + output | 11 | 0.72 | 0.59 | 0.31 to 0.92 |
| chrome-type | default | 12 | 0.79 | 0.87 | 0.68 to 1.35 |
| chrome-type | preset sunset | 12 | 0.85 | 0.61 | 0.24 to 1.33 |
| chrome-type | preset on its sunset | 12 | 0.59 | 0.57 | 0.33 to 0.87 |
| chrome-type | preset steel | 12 | 0.59 | 0.50 | 0.31 to 0.76 |
| chrome-type | preset gold | 12 | 0.72 | 0.70 | 0.15 to 1.20 |
| chrome-type | preset still, no glints | 11 | 0.72 | 0.81 | 0.02 to 1.31 |
| chrome-type | size=0.12 | 12 | 0.72 | 0.63 | 0.13 to 1.05 |
| chrome-type | size=0.25 | 12 | 0.72 | 0.68 | 0.15 to 1.20 |
| chrome-type | size=0.4 | 12 | 0.72 | 1.38 | 0.98 to 2.12 |

## 960 × 540

| Effect | Configuration | Passes | Span (ms) | Per frame (ms) | Range (ms) |
| --- | --- | ---: | ---: | ---: | --- |
| (floor) | one constant-colour pass | 1 | 0.00 | 0.04 | 0.02 to 0.09 |
| (tail) | constant scene + bloom + output | 9 | 0.46 | 0.39 | 0.31 to 0.83 |
| chrome-type | default | 10 | 0.52 | 0.39 | -0.50 to 1.38 |
| chrome-type | preset sunset | 10 | 0.59 | 0.42 | -0.26 to 1.29 |
| chrome-type | preset on its sunset | 10 | 0.52 | 0.44 | -0.15 to 1.29 |
| chrome-type | preset steel | 10 | 0.52 | 0.92 | -0.13 to 1.27 |
| chrome-type | preset gold | 10 | 0.52 | 0.44 | -0.33 to 1.22 |
| chrome-type | preset still, no glints | 9 | 0.46 | 0.44 | -0.35 to 1.18 |
| chrome-type | size=0.12 | 10 | 0.52 | 0.39 | -0.13 to 0.85 |
| chrome-type | size=0.25 | 10 | 0.52 | 0.42 | -0.33 to 1.40 |
| chrome-type | size=0.4 | 10 | 0.52 | 0.85 | -0.02 to 1.22 |

## Download size

What the page fetches to show the effect, beyond the first-load bundle (7.3 kB gzipped, no shaders).

| Effect | Chunks | Own chunk (kB gzip) | Total (kB gzip) |
| --- | ---: | ---: | ---: |
| chrome-type | 17 | 18.6 | 45.0 |
