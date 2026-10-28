import type { Vec3 } from '../colour/oklab.ts';

/*
 * Story 2.6: a colour photograph ageing as a 1970s chromogenic print ages.
 *
 * A print holds three dyes: cyan absorbs red, magenta green and yellow blue, each with some
 * absorption in the others' bands (`DYES`). Its reflectance in each band is 10^-density, the
 * density being the base's plus the sum of each dye's amount times its absorption. Each dye
 * fades at its own first-order rate, and stain builds in the base. Where the picture comes from
 * linear RGB, the dye amounts that print it are solved for (`dyesFor`), faded, and printed again.
 *
 * Rates are this family's, set to the published figures they come from (docs/eras.md, the
 * 1970s, Photographs):
 * - Dark storage (an album). Cyan is the weakest dye: about 10% lost in 8.5 years at room
 *   temperature for Kodak's Ektacolor 37 RC (Anderson and Ellison, 1992), the dye set of the
 *   period's 74 RC. Magenta and yellow need several decades for a 0.1 change in density, yellow
 *   going second. Yellowish stain builds in the whites (blue density rises). Prints drift red.
 * - Light (a print on display, about 200 lux). Magenta tends to be the weakest (Nishimura,
 *   1996), and Wilhelm puts the period's prints past acceptable change in about six years on
 *   display. Prints drift green and blue. The rates are an illustration of that order, not a
 *   measurement of any one paper.
 */

/** Each dye's absorption in the red, green and blue bands (columns: cyan, magenta, yellow). */
export const DYES: readonly (readonly [number, number, number])[] = [
  [1.0, 0.08, 0.02],
  [0.12, 1.0, 0.1],
  [0.04, 0.22, 1.0],
];

/** The paper's base density in each band, fresh. */
export const BASE: Vec3 = [0.05, 0.05, 0.06];

/** The densest black a print holds, per band: blacks are never deeper than this. */
export const DMAX = 2.1;

export type Storage = 'dark' | 'light';

interface Ageing {
  /** First-order loss per year for cyan, magenta and yellow. */
  rates: Vec3;
  /** Stain: base density gained per year in red, green and blue. */
  stain: Vec3;
}

export const AGEING: Record<Storage, Ageing> = {
  dark: {
    rates: [-Math.log(0.9) / 8.5, -Math.log(0.9) / 45, -Math.log(0.9) / 30],
    stain: [0.0004, 0.0012, 0.004],
  },
  light: {
    rates: [-Math.log(0.85) / 8, -Math.log(0.8) / 8, -Math.log(0.83) / 8],
    stain: [0, 0, 0.0008],
  },
};

/** The share of each dye left after `years`. */
export function remaining(years: number, storage: Storage): Vec3 {
  const r = AGEING[storage].rates;
  return [Math.exp(-r[0] * years), Math.exp(-r[1] * years), Math.exp(-r[2] * years)];
}

/** The base's density after `years`. */
export function baseAfter(years: number, storage: Storage): Vec3 {
  const s = AGEING[storage].stain;
  return [BASE[0] + s[0] * years, BASE[1] + s[1] * years, BASE[2] + s[2] * years];
}

/** 3 x 3 matrices as row-major arrays. */
export function invert3(m: readonly (readonly number[])[]): number[][] {
  const [a, b, c] = m[0]!;
  const [d, e, f] = m[1]!;
  const [g, h, i] = m[2]!;
  const A = e! * i! - f! * h!;
  const B = -(d! * i! - f! * g!);
  const C = d! * h! - e! * g!;
  const det = a! * A + b! * B + c! * C;
  return [
    [A / det, -(b! * i! - c! * h!) / det, (b! * f! - c! * e!) / det],
    [B / det, (a! * i! - c! * g!) / det, -(a! * f! - c! * d!) / det],
    [C / det, -(a! * h! - b! * g!) / det, (a! * e! - b! * d!) / det],
  ];
}

const INVERSE = invert3(DYES);

/** Densities of a linear colour on a fresh print, each held between the base and `DMAX`. */
function densities(c: Readonly<Vec3>): Vec3 {
  return c.map((v, i) =>
    Math.min(DMAX, Math.max(BASE[i]!, -Math.log10(Math.max(v, 1e-4)))),
  ) as Vec3;
}

/** The dye amounts that print a linear colour fresh. */
export function dyesFor(c: Readonly<Vec3>): Vec3 {
  const d = densities(c).map((v, i) => v - BASE[i]!);
  return INVERSE.map((row) =>
    Math.max(0, row[0]! * d[0]! + row[1]! * d[1]! + row[2]! * d[2]!),
  ) as Vec3;
}

/** A linear colour, printed and aged `years` in `storage`. */
export function aged(c: Readonly<Vec3>, years: number, storage: Storage): Vec3 {
  const dyes = dyesFor(c);
  const left = remaining(years, storage);
  const base = baseAfter(years, storage);
  return DYES.map((row, band) => {
    const d =
      base[band]! +
      row[0] * dyes[0] * left[0] +
      row[1] * dyes[1] * left[1] +
      row[2] * dyes[2] * left[2];
    return 10 ** -d;
  }) as Vec3;
}
