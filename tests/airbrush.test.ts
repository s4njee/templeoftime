import { describe, expect, it } from 'vitest';
import { cover, deposit, frisket, ramp, stroke } from '../src/gpu/airbrush/airbrush.ts';
import { createFullscreenPipeline, renderFullscreen } from '../src/gpu/fullscreen.ts';
import airbrushWgsl from '../src/wgsl/airbrush.wgsl';
import fullscreen from '../src/wgsl/fullscreen.wgsl';
import hashWgsl from '../src/wgsl/hash.wgsl';
import simplexWgsl from '../src/wgsl/simplex.wgsl';
import { getTestDevice, readTexture } from './gpu.ts';

// Story 2.5: a sprayed gradient is not a linear ramp, droplets keep the paint's amount, and a
// frisket's edge is hard where the spray's own edge is soft.

describe('airbrush', () => {
  it('builds a gradient from passes that fades past its end, unlike a linear ramp', () => {
    const span = 100;
    const passes = 12;
    const at = (u: number) => cover(2 * ramp(u, span, passes));
    // Darker at the start, lighter at the end, and falling all the way from the first pass.
    for (let u = 10; u < 95; u += 5) expect(at(u + 5)).toBeLessThan(at(u));
    // Overspray: paint past where the last pass was, and before the first, where a linear
    // ramp stops dead.
    expect(at(span + 3)).toBeGreaterThan(0.005);
    expect(at(-5)).toBeGreaterThan(0.2);
    // Not linear: the build-up curve bends it, by more than a few percent of full.
    const line = (u: number) => at(5) + ((at(95) - at(5)) * (u - 5)) / 90;
    let worst = 0;
    for (let u = 5; u <= 95; u++) worst = Math.max(worst, Math.abs(at(u) - line(u)));
    expect(worst).toBeGreaterThan(0.05);
  });

  it('adds less paint over paint', () => {
    expect(cover(2) - cover(1)).toBeLessThan(cover(1) - cover(0));
  });

  it('keeps the mean coverage when the spray is seen as droplets', () => {
    for (const c of [0.05, 0.3, 0.6, 0.9]) {
      let sum = 0;
      const n = 20000;
      for (let i = 0; i < n; i++) sum += deposit(c, (i + 0.5) / n, 0.4);
      expect(sum / n).toBeCloseTo(c, 3);
    }
  });

  it('cuts the spray hard at a frisket, where its own edge is soft', () => {
    const width = 8;
    // Coverage at distance y across a stroke along the x axis; a frisket covers y > 0.
    const spray = (y: number) => cover(2 * stroke([0, y], [-50, 0], [50, 0], width));
    const masked = (y: number) => spray(y) * frisket(y, 0.75);
    /** Distance over which f falls from 90% to 10% of its value at `from`. */
    const fall = (f: (y: number) => number, from: number) => {
      const top = f(from);
      let y90 = from;
      let y10 = from;
      for (let y = from; y < 40; y += 0.05) {
        if (f(y) > 0.9 * top) y90 = y;
        if (f(y) > 0.1 * top) y10 = y;
      }
      return y10 - y90;
    };
    expect(fall(masked, -1)).toBeLessThan(1.6);
    expect(fall(spray, 0)).toBeGreaterThan(1.5 * width);
  });
});

describe('airbrush.wgsl', () => {
  it('agrees with airbrush.ts on strokes, ramps, build-up, droplets and friskets', async () => {
    const device = await getTestDevice();
    const n = 8;
    const texture = device.createTexture({
      size: [n, 1],
      format: 'rgba32float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });
    const pipeline = createFullscreenPipeline(device, {
      fragment: {
        label: 'airbrush test',
        code: `#include "fullscreen.wgsl"
#include "hash.wgsl"
#include "simplex.wgsl"
#include "airbrush.wgsl"
@fragment fn fs(in: FullscreenVarying) -> @location(0) vec4f {
  let i = in.position.x - 0.5;
  let s = airbrush_stroke(vec2f(i * 1.5, 2.0), vec2f(0.0, 0.0), vec2f(10.0, 1.0), 3.0);
  let r = airbrush_ramp(vec2f(3.0, i * 13.0), vec2f(0.0), vec2f(0.0, 1.0), 100.0, 12u, 0.0, 0.0);
  let d = airbrush_deposit(i / 8.0 + 0.05, fract(i * 0.37), 0.4);
  return vec4f(s, r, airbrush_cover(i * 0.4) + d * 10.0, airbrush_frisket(i - 4.0, 0.75));
}`,
        chunks: {
          ...fullscreen.chunks,
          'fullscreen.wgsl': fullscreen.code,
          'hash.wgsl': hashWgsl.code,
          'simplex.wgsl': simplexWgsl.code,
          'airbrush.wgsl': airbrushWgsl.code,
        },
      },
      format: 'rgba32float',
    });
    const encoder = device.createCommandEncoder();
    renderFullscreen(encoder, texture.createView(), pipeline, []);
    device.queue.submit([encoder.finish()]);
    const v = new Float32Array((await readTexture(device, texture, 16)).buffer);
    texture.destroy();
    for (let i = 0; i < n; i++) {
      expect(v[i * 4]!).toBeCloseTo(stroke([i * 1.5, 2], [0, 0], [10, 1], 3), 4);
      expect(v[i * 4 + 1]!).toBeCloseTo(ramp(i * 13, 100, 12), 4);
      const want = cover(i * 0.4) + deposit(i / 8 + 0.05, (i * 0.37) % 1, 0.4) * 10;
      expect(v[i * 4 + 2]!).toBeCloseTo(want, 3);
      expect(v[i * 4 + 3]!).toBeCloseTo(frisket(i - 4, 0.75), 4);
    }
  });
});
