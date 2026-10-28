import { describe, expect, it } from 'vitest';
import { createFullscreenPipeline, renderFullscreen } from '../src/gpu/fullscreen.ts';
import {
  compensate,
  dotGain,
  INKS,
  PAPER,
  screened,
  screenedCoverage,
  SCREEN_ANGLES,
  separate,
  spot,
  spotThreshold,
  flattened,
  screenContrast,
} from '../src/gpu/print/print.ts';
import { patternStepAt, PATTERN_STEP } from '../src/gpu/safety/pattern.ts';
import { STRONG_DOSE } from '../src/gpu/safety/dose.ts';
import fullscreen from '../src/wgsl/fullscreen.wgsl';
import printWgsl from '../src/wgsl/print.wgsl';
import type { Vec3 } from '../src/gpu/colour/oklab.ts';
import { getTestDevice, readTexture } from './gpu.ts';

// Story 2.1: the print pipeline does what a press does. Separation, a linear screen, dot gain and
// its compensation, a flat tint printing at its nominal coverage, and the traditional screen
// angles giving rosettes where two screens a few degrees apart give a moiré.

describe('separation', () => {
  it('takes white to no ink, black to black, and grey mostly to black', () => {
    for (const v of separate([1, 1, 1])) expect(v).toBeCloseTo(0, 9);
    const black = separate([0, 0, 0], 1);
    expect(black[3]).toBeCloseTo(1, 6);
    const grey = separate([0.2, 0.2, 0.2], 0.6);
    expect(grey[3]).toBeGreaterThan(0.2);
    expect(grey[0]).toBeCloseTo(grey[1], 6);
    const red = separate([1, 0, 0]);
    expect(red[0]).toBeCloseTo(0, 6);
    expect(red[1]).toBeGreaterThan(0.9);
  });
});

describe('screening', () => {
  it('covers t of a cell with a tint of t, through the spot table', () => {
    const n = 300;
    for (const t of [0.05, 0.2, 0.5, 0.7, 0.95]) {
      const threshold = spotThreshold(t);
      let inked = 0;
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) if (spot((x + 0.37) / n, (y + 0.71) / n) < threshold) inked++;
      }
      expect(inked / (n * n), `t ${t}`).toBeCloseTo(t, 2);
    }
  });

  it('compensates dot gain exactly', () => {
    for (const g of [0.08, 0.15, 0.22]) {
      for (const t of [0.1, 0.5, 0.9]) expect(dotGain(compensate(t, g), g)).toBeCloseTo(t, 6);
    }
    // Uncompensated, a 50% tint prints darker by the gain.
    expect(dotGain(0.5, 0.15)).toBeCloseTo(0.65, 6);
  });

  it('screens a flat tint to its nominal coverage at any angle, anti-aliased', () => {
    for (const angle of [0, 15, 45, 75]) {
      for (const t of [0.25, 0.6]) {
        let inked = 0;
        const n = 210;
        for (let y = 0; y < n; y++) {
          for (let x = 0; x < n; x++) inked += screenedCoverage(x + 0.5, y + 0.5, t, angle, 7);
        }
        expect(Math.abs(inked / (n * n) - t), `angle ${angle}, t ${t}`).toBeLessThan(0.02);
      }
    }
  });

  it('cannot print every tone at 0° with one point per pixel', () => {
    // The screen's cells line up with the pixels: 49 symmetric points per 7 px cell.
    let inked = 0;
    const n = 210;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) if (screened(x + 0.5, y + 0.5, 0.6, 0, 7)) inked++;
    }
    expect(Math.abs(inked / (n * n) - 0.6)).toBeGreaterThan(0.05);
  });
});

describe('screen angles', () => {
  /**
   * A flat 40% tint of cyan, magenta and yellow printed with the given angles, and how much its
   * luminance varies after averaging over a few screen cells: the low-frequency beat a moiré is.
   */
  function mottle(angles: readonly number[]): number {
    const W = 360;
    const pitch = 6;
    const lum = (c: Readonly<Vec3>) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    const inks = [INKS.cyan, INKS.magenta, INKS.yellow];
    const image = new Float64Array(W * W);
    for (let y = 0; y < W; y++) {
      for (let x = 0; x < W; x++) {
        let colour: Vec3 = [1, 1, 1];
        inks.forEach((ink, i) => {
          if (screened(x + 0.5, y + 0.5, 0.4, angles[i]!, pitch)) {
            colour = [colour[0] * ink[0], colour[1] * ink[1], colour[2] * ink[2]];
          }
        });
        image[y * W + x] = lum(colour);
      }
    }
    // Box-average over four cells, on a coarse grid, and take the spread of the averages.
    const box = 4 * pitch;
    const means: number[] = [];
    for (let y = 0; y + box <= W; y += box / 2) {
      for (let x = 0; x + box <= W; x += box / 2) {
        let sum = 0;
        for (let j = 0; j < box; j++)
          for (let i = 0; i < box; i++) sum += image[(y + j) * W + x + i]!;
        means.push(sum / (box * box));
      }
    }
    const mean = means.reduce((a, b) => a + b) / means.length;
    return Math.sqrt(means.reduce((a, b) => a + (b - mean) ** 2, 0) / means.length);
  }

  it('makes rosettes at the traditional angles, and a moiré with two screens 5° apart', () => {
    const traditional = mottle([SCREEN_ANGLES.cyan, SCREEN_ANGLES.magenta, SCREEN_ANGLES.yellow]);
    const close = mottle([15, 20, 0]);
    expect(close).toBeGreaterThan(2 * traditional);
  });
});

describe('a screen under the pattern rule (story 2.2)', () => {
  const inks = [INKS.cyan, INKS.magenta, INKS.yellow];
  const newsprint: Vec3 = [0.72, 0.69, 0.6];
  const lum = (c: Readonly<Vec3>) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  /** The real light–dark step of screens of `chosen` inks at tints `t`, dots kept at `contrast`. */
  const step = (chosen: Vec3[], t: number[], contrast: number, paper: Vec3) => {
    let low = Infinity;
    let high = -Infinity;
    // Every combination of dot and gap at one point, as screens at different angles make.
    for (let mask = 0; mask < 1 << chosen.length; mask++) {
      let c: Vec3 = [...paper];
      chosen.forEach((ink, i) => {
        const e = flattened(t[i]!, (mask >> i) & 1, contrast);
        c = [0, 1, 2].map((k) => c[k]! * (1 - e * (1 - ink[k]!))) as Vec3;
      });
      low = Math.min(low, lum(c));
      high = Math.max(high, lum(c));
    }
    return high - low;
  };
  it.each([0.35, STRONG_DOSE])("holds any inks' screens under the step at dose %s", (dose) => {
    const limit = patternStepAt(dose);
    for (const paper of [PAPER, newsprint]) {
      for (let mask = 1; mask < 8; mask++) {
        const chosen = inks.filter((_, i) => (mask >> i) & 1);
        const contrast = screenContrast(chosen, paper, limit);
        for (const t of [0.25, 0.5]) {
          const s = step(
            chosen,
            chosen.map(() => t),
            contrast,
            paper,
          );
          expect(s, `inks ${mask}, t ${t}`).toBeLessThanOrEqual(limit + 1e-9);
          expect(s).toBeLessThan(PATTERN_STEP);
        }
      }
    }
  });

  it("keeps a tint's average colour, and lets full-strength dots step well over the rule", () => {
    expect(flattened(0.25, 1, 0.1) * 0.25 + flattened(0.25, 0, 0.1) * 0.75).toBeCloseTo(0.25, 9);
    expect(step(inks, [0.5, 0.5, 0.5], 1, PAPER)).toBeGreaterThan(3 * PATTERN_STEP);
  });
});

describe('print.wgsl', () => {
  it('agrees with print.ts on separation and the spot function', async () => {
    const device = await getTestDevice();
    const colours: Vec3[] = [
      [1, 1, 1],
      [0, 0, 0],
      [0.9, 0.2, 0.05],
      [0.1, 0.4, 0.8],
      [0.3, 0.3, 0.3],
    ];
    const texture = device.createTexture({
      size: [colours.length, 2],
      format: 'rgba32float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });
    const list = colours.map((c) => `vec3f(${c.join(', ')})`).join(', ');
    const pipeline = createFullscreenPipeline(device, {
      fragment: {
        label: 'print test',
        code: `#include "fullscreen.wgsl"
#include "print.wgsl"
@fragment fn fs(in: FullscreenVarying) -> @location(0) vec4f {
  let inputs = array(${list});
  let i = i32(in.position.x);
  if (in.position.y < 1.0) { return print_separate(inputs[i], 0.6); }
  let uv = vec2f(f32(i) * 0.17 + 0.05, f32(i) * 0.29 + 0.11);
  return vec4f(print_spot(uv), print_gain(f32(i) * 0.2, 0.15), print_compensate(f32(i) * 0.2, 0.15), 0.0);
}`,
        chunks: {
          ...fullscreen.chunks,
          'fullscreen.wgsl': fullscreen.code,
          'print.wgsl': printWgsl.code,
        },
      },
      format: 'rgba32float',
    });
    const encoder = device.createCommandEncoder();
    renderFullscreen(encoder, texture.createView(), pipeline, []);
    device.queue.submit([encoder.finish()]);
    const values = new Float32Array((await readTexture(device, texture, 16)).buffer);
    texture.destroy();
    colours.forEach((c, i) => {
      const want = separate(c, 0.6);
      for (let k = 0; k < 4; k++)
        expect(values[i * 4 + k]!, `colour ${i}`).toBeCloseTo(want[k]!, 3);
      const row = (colours.length + i) * 4;
      expect(values[row]!).toBeCloseTo(spot(i * 0.17 + 0.05, i * 0.29 + 0.11), 4);
      expect(values[row + 1]!).toBeCloseTo(dotGain(i * 0.2, 0.15), 4);
      expect(values[row + 2]!).toBeCloseTo(compensate(i * 0.2, 0.15), 3);
    });
  });
});
