import { oklchToLinear, type Vec3 } from '../../gpu/colour/oklab.ts';
import { createFullscreenPipeline, renderFullscreen } from '../../gpu/fullscreen.ts';
import { createPicture, PICTURES } from '../../gpu/picture/picture.ts';
import { createHdrTail, TAIL_PARAMS } from '../../gpu/post/index.ts';
import { DOSE_PARAMS, dosed } from '../../gpu/safety/dose.ts';
import { withChunks } from '../../gpu/shader.ts';
import { createStill } from '../../gpu/still.ts';
import { createUniformBuffer, defineUniformStruct, uniformArray } from '../../gpu/uniforms.ts';
import { defineEffect } from '../types.ts';
import { meta } from './meta.ts';
import shader from './screen.wgsl';

const MAX_LAYERS = 6;

const Params = defineUniformStruct('Params', {
  width: 'f32',
  height: 'f32',
  css: 'f32',
  soften: 'f32',
  starve: 'f32',
  opacity: 'f32',
  layers: 'u32',
  paper: 'vec4f',
  /** Per pass: ink colour (linear), lightness threshold (x), offset (px, xy). */
  inks: uniformArray('vec4f', MAX_LAYERS),
  thresholds: uniformArray('vec4f', MAX_LAYERS),
  offsets: uniformArray('vec4f', MAX_LAYERS),
});

/**
 * Ink sets in OKLCH (L, C, hue°), lightest first, in the order they are pulled. A set has as
 * many inks as the most layers it can print; fewer layers take the lightest and the darkest.
 */
const SETS: Record<string, Vec3[]> = {
  // Pop: flat bright inks over a black key, as the 1960s photo-silkscreens were.
  pop: [
    [0.9, 0.16, 100],
    [0.72, 0.19, 0],
    [0.66, 0.13, 230],
    [0.5, 0.2, 320],
    [0.36, 0.12, 270],
    [0.16, 0.01, 260],
  ],
  // A gig poster's warm set.
  sunset: [
    [0.86, 0.14, 85],
    [0.72, 0.17, 55],
    [0.6, 0.2, 30],
    [0.46, 0.17, 10],
    [0.32, 0.12, 330],
    [0.18, 0.04, 300],
  ],
  // One colour and black.
  duotone: [
    [0.78, 0.12, 190],
    [0.62, 0.12, 195],
    [0.5, 0.11, 200],
    [0.38, 0.09, 210],
    [0.26, 0.06, 220],
    [0.14, 0.01, 240],
  ],
};

/** Which of a set's inks `n` layers use: always the lightest and the darkest. */
export function pickInks(set: readonly Vec3[], n: number): Vec3[] {
  if (n >= set.length) return [...set];
  if (n <= 1) return [set[set.length - 1]!];
  return Array.from({ length: n }, (_, i) => set[Math.round((i * (set.length - 1)) / (n - 1))]!);
}

const NO_TONEMAP = { output: { tonemap: 'none' } } as const;

export const effect = defineEffect({
  meta,
  params: {
    ...DOSE_PARAMS,
    picture: { type: 'select', default: 'snapshot', options: PICTURES.filter((p) => p !== 'page') },
    inks: { type: 'select', default: 'pop', options: Object.keys(SETS), label: 'ink set' },
    layers: { type: 'number', default: 4, min: 2, max: MAX_LAYERS, step: 1 },
    soften: {
      type: 'number',
      default: 3,
      min: 0,
      max: 12,
      step: 0.5,
      label: 'stencil detail (CSS px)',
    },
    ...TAIL_PARAMS,
    bloom: { ...TAIL_PARAMS.bloom, default: 0 },
  },
  presets: {
    pop: {},
    'gig poster': { picture: 'poster', inks: 'sunset', layers: 5 },
    duotone: { inks: 'duotone', layers: 2 },
    'loose register': { dose: 0.7, layers: 5 },
  },

  async create({ device, format, hdr, params, profiler }) {
    const tail = createHdrTail(device, { format, hdr, label: 'screen-print' });
    const uniforms = createUniformBuffer(device, Params, 'screen-print params');
    const pipeline = createFullscreenPipeline(device, {
      fragment: withChunks(shader, { 'params.wgsl': Params.wgsl }),
      entryPoint: 'screen',
      format: 'rgba16float',
    });
    // A print is a still: printed into the still's target, and only again when it changes.
    const still = createStill(device, 'screen-print');
    const picture = createPicture(device, 'screen-print');
    const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
    let bindGroup: GPUBindGroup | undefined;
    const bind = () =>
      device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: uniforms.buffer } },
          { binding: 1, resource: picture.target.view },
          { binding: 2, resource: sampler },
        ],
      });
    let width = 1;
    let height = 1;
    let dpr = 1;

    return {
      resize(w, h, ratio) {
        width = w;
        height = h;
        dpr = ratio;
        tail.resize(w, h);
      },
      frame(time, encoder, target) {
        const n = Math.round(Math.min(MAX_LAYERS, Math.max(2, params.layers)));
        const inks = pickInks(SETS[params.inks] ?? SETS.pop!, n).map((c) =>
          oklchToLinear([c[0], c[1], (c[2] * Math.PI) / 180]),
        );
        // Each pass placed by hand: off by its own few pixels, more as `dose` rises.
        const slip = dosed(params.dose, 0, 2.5, 8) * dpr;
        const offsets = Array.from({ length: MAX_LAYERS }, (_, k) => {
          const a = k * 2.4 + 0.7;
          const r = k === 0 ? 0 : slip * (0.6 + 0.4 * Math.sin(k * 5.1));
          return [Math.cos(a) * r, Math.sin(a) * r, 0, 0];
        });
        // Lightness thresholds (sRGB-encoded), evenly from near paper to the deep shadows.
        const thresholds = Array.from({ length: MAX_LAYERS }, (_, k) => [
          0.86 - (0.5 * k) / Math.max(1, n - 1),
          0,
          0,
          0,
        ]);
        uniforms.set({
          width,
          height,
          css: dpr,
          soften: params.soften * dpr,
          starve: dosed(params.dose, 0, 0.2, 0.6),
          opacity: 0.94,
          layers: n,
          paper: [0.9, 0.87, 0.78, 1],
          inks: Array.from({ length: MAX_LAYERS }, (_, k) => [...(inks[k] ?? [0, 0, 0]), 1]).flat(),
          thresholds: thresholds.flat(),
          offsets: offsets.flat(),
        });
        uniforms.upload();
        if (picture.update(encoder, width, height, dpr, params.picture) || !bindGroup) {
          bindGroup = bind();
        }
        const state = JSON.stringify([dpr, params]);
        if (still.stale(width, height, state)) {
          renderFullscreen(encoder, still.target.view, pipeline, [bindGroup], {
            timestampWrites: profiler.pass('screen'),
          });
        }
        still.show(encoder, tail.scene.view, tail.scene.format, profiler.pass('show'));
        tail.encode(encoder, target, time, params, profiler, NO_TONEMAP);
      },
      destroy() {
        still.destroy();
        picture.destroy();
        uniforms.destroy();
        tail.destroy();
      },
    };
  },
});
