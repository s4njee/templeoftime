import { describe, expect, it } from 'vitest';
import { luminance, type Vec3 } from '../src/gpu/colour/oklab.ts';
import { aged, BASE } from '../src/gpu/photo/fade.ts';

// Story 2.6: a print reproduces its picture fresh, then drifts the way the sources say the
// period's prints drift: red in the dark, where cyan goes first, with yellowed whites; green and
// blue on display, where magenta goes first. Blacks lift as every dye thins.

const grey: Vec3 = [0.18, 0.18, 0.18];
const white: Vec3 = [0.85, 0.85, 0.85];
const black: Vec3 = [0.01, 0.01, 0.01];

describe('faded print', () => {
  it('prints a colour as it is when fresh', () => {
    for (const c of [grey, [0.6, 0.2, 0.05], [0.05, 0.3, 0.6], [0.4, 0.5, 0.2]] as Vec3[]) {
      const out = aged(c, 0, 'dark');
      for (let i = 0; i < 3; i++) expect(out[i]).toBeCloseTo(c[i]!, 3);
    }
  });

  it('drifts red in an album, cyan fading first, and yellows the whites', () => {
    const g = aged(grey, 30, 'dark');
    expect(g[0] / g[1]).toBeGreaterThan(1.15);
    expect(g[0]).toBeGreaterThan(g[2]);
    const w = aged(white, 30, 'dark');
    expect(w[2]).toBeLessThan(w[0] * 0.92);
  });

  it('drifts green and blue on the wall, magenta fading first', () => {
    const g = aged(grey, 10, 'light');
    expect(g[1]).toBeGreaterThan(g[0]);
    expect(g[1]).toBeGreaterThan(grey[1] * 1.15);
  });

  it('lifts the blacks and lowers the contrast as it ages', () => {
    const contrast = (years: number) =>
      luminance(aged(white, years, 'dark')) / luminance(aged(black, years, 'dark'));
    expect(luminance(aged(black, 40, 'dark'))).toBeGreaterThan(
      2 * luminance(aged(black, 0, 'dark')),
    );
    expect(contrast(40)).toBeLessThan(0.6 * contrast(0));
    // The base never gets whiter than fresh paper.
    expect(aged(white, 40, 'dark')[2]).toBeLessThanOrEqual(10 ** -BASE[2]);
  });
});
