import { luminance, type Vec3 } from '../colour/oklab.ts';

/*
 * Story 2.1: four-colour process printing. TypeScript twin of src/wgsl/print.wgsl.
 *
 *  1. Separation: an sRGB-encoded colour into cyan, magenta and yellow (1 - R, 1 - G, 1 - B),
 *     with black taking over `gcr` of the grey the three share (grey component replacement).
 *  2. Screening: each ink is a grid of dots at its own angle and pitch. A dot's shape is a spot
 *     function over its cell, the classic cosine one: round dots that grow, touch at 50% in a
 *     checkerboard, and become round holes. A threshold table (`SPOT_TABLE`), found here by
 *     measuring the spot function, makes a tint of t cover exactly t of the paper.
 *  3. Dot gain: on absorbent paper every dot spreads, most at the middle tones. Printed coverage
 *     is t + 4 g t (1 - t), g the gain at 50%. A press compensates by printing a smaller dot.
 *  4. Inks filter the light that reaches the paper and comes back, so overprints multiply.
 *
 * The traditional screen angles keep the inks' grids 30° apart (yellow, the faintest, at 0°,
 * between cyan and magenta), so where they overlap they form small rosettes instead of a moiré.
 */

export const SCREEN_ANGLES = { cyan: 15, magenta: 75, yellow: 0, black: 45 } as const;

/** Process inks as linear-light transmittances (what each lets through), and paper. */
export const INKS = {
  cyan: [0.02, 0.38, 0.72] as Vec3,
  magenta: [0.82, 0.05, 0.3] as Vec3,
  yellow: [0.95, 0.82, 0.03] as Vec3,
  black: [0.04, 0.04, 0.045] as Vec3,
};
export const PAPER: Vec3 = [0.9, 0.87, 0.8];

const encode = (v: number) =>
  v <= 0.0031308 ? v * 12.92 : 1.055 * Math.max(v, 0) ** (1 / 2.4) - 0.055;

/** Linear RGB to CMYK tones 0..1, black replacing `gcr` of the common grey. */
export function separate(c: Readonly<Vec3>, gcr = 0.6): [number, number, number, number] {
  const [r, g, b] = c.map((v) => Math.min(1, Math.max(0, encode(v))));
  const cyan = 1 - r!;
  const magenta = 1 - g!;
  const yellow = 1 - b!;
  const k = gcr * Math.min(cyan, magenta, yellow);
  const rest = 1 - k;
  return rest < 1e-6
    ? [0, 0, 0, 1]
    : [(cyan - k) / rest, (magenta - k) / rest, (yellow - k) / rest, k];
}

/** The cosine spot function at cell coordinates (u, v) in [0, 1): 0 at the dot's centre. */
export function spot(u: number, v: number): number {
  return 0.5 + 0.25 * (Math.cos(2 * Math.PI * u) + Math.cos(2 * Math.PI * v));
}

/** Entries in the threshold table. */
export const SPOT_STEPS = 64;

/**
 * Thresholds that linearise the spot function: a pixel is inked when spot < SPOT_TABLE(t), and
 * the share of a cell inked is then t. Measured by sampling the spot function over a cell.
 */
export const SPOT_TABLE: Float32Array = (() => {
  const n = 256;
  const values: number[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) values.push(spot((x + 0.5) / n, (y + 0.5) / n));
  }
  values.sort((a, b) => a - b);
  const table = new Float32Array(SPOT_STEPS + 1);
  for (let i = 0; i <= SPOT_STEPS; i++) {
    const t = i / SPOT_STEPS;
    table[i] = t >= 1 ? 1.0001 : t <= 0 ? -0.0001 : values[Math.floor(t * (values.length - 1))]!;
  }
  return table;
})();

/** The threshold for coverage t, interpolated from the table. */
export function spotThreshold(t: number): number {
  const x = Math.min(1, Math.max(0, t)) * SPOT_STEPS;
  const i = Math.min(SPOT_STEPS - 1, Math.floor(x));
  return SPOT_TABLE[i]! + (SPOT_TABLE[i + 1]! - SPOT_TABLE[i]!) * (x - i);
}

/** Printed coverage of a plate dot of coverage t with dot gain g (at 50%). */
export function dotGain(t: number, g: number): number {
  return Math.min(1, t + 4 * g * t * (1 - t));
}

/** The plate coverage that prints as t under gain g: the inverse of `dotGain`. */
export function compensate(t: number, g: number): number {
  if (g <= 0) return t;
  // t + 4g p (1 - p) = target: a quadratic in p, taking the root in [0, 1].
  const a = -4 * g;
  const b = 1 + 4 * g;
  const disc = b * b + 4 * a * t;
  return Math.min(1, Math.max(0, (-b + Math.sqrt(Math.max(disc, 0))) / (2 * a)));
}

/** Whether pixel (x, y) is inked by a screen of `pitch` px at `angle` degrees, for coverage t. */
export function screened(x: number, y: number, t: number, angle: number, pitch: number): boolean {
  const a = (angle * Math.PI) / 180;
  const u = (Math.cos(a) * x + Math.sin(a) * y) / pitch;
  const v = (-Math.sin(a) * x + Math.cos(a) * y) / pitch;
  return spot(u - Math.floor(u), v - Math.floor(v)) < spotThreshold(t);
}

/**
 * The share of pixel (x, y) (its centre) inked, from `samples` x `samples` points across it: the
 * twin of the shader's anti-aliased dot edge. A screen at 0° lines up with the pixel grid, so
 * one point per pixel can only print a few tones exactly (a 7 px cell has 49 points, placed
 * symmetrically); averaging over the pixel lets every tone through.
 */
export function screenedCoverage(
  x: number,
  y: number,
  t: number,
  angle: number,
  pitch: number,
  samples = 4,
): number {
  let inked = 0;
  for (let j = 0; j < samples; j++) {
    for (let i = 0; i < samples; i++) {
      const sx = x - 0.5 + (i + 0.5) / samples;
      const sy = y - 0.5 + (j + 0.5) / samples;
      if (screened(sx, sy, t, angle, pitch)) inked++;
    }
  }
  return inked / (samples * samples);
}

/**
 * How much a full-strength ink darkens `paper`, in relative luminance: the light–dark step of a
 * screen of its dots, and the most one ink can add to a screen's step.
 */
export function inkStep(ink: Readonly<Vec3>, paper: Readonly<Vec3>): number {
  return luminance(paper) - luminance([paper[0] * ink[0], paper[1] * ink[1], paper[2] * ink[2]]);
}

/**
 * Story 2.2: a tint of coverage `t` printed as a screen whose dots keep only `contrast` of their
 * edge, the rest flattened into the tint's average colour. At 1 it is the real screen (coverage
 * 0 or 1 at each point); at 0 a flat tint of the right colour. Twin of `print_flattened`.
 */
export function flattened(t: number, coverage: number, contrast: number): number {
  return t + contrast * (coverage - t);
}

/**
 * The contrast at which screens of the given inks, all at one point, step under `step` of
 * relative luminance: the pattern rule's measure, since a screen is a lattice of dots. Each ink's
 * dots vary its darkening by at most `contrast` times its `inkStep`, and steps of inks that
 * overprint add at most, so the sum bounds the step.
 */
export function screenContrast(
  inks: readonly Readonly<Vec3>[],
  paper: Readonly<Vec3>,
  step: number,
) {
  const sum = inks.reduce((a, ink) => a + inkStep(ink, paper), 0);
  return sum > 0 ? Math.min(1, step / sum) : 1;
}
