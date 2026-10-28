import { createFullscreenPipeline, renderFullscreen } from '../../gpu/fullscreen.ts';
import {
  BASE,
  baseAfter,
  DMAX,
  DYES,
  invert3,
  remaining,
  type Storage,
} from '../../gpu/photo/fade.ts';
import { createPicture, PICTURES } from '../../gpu/picture/picture.ts';
import { createHdrTail, TAIL_PARAMS } from '../../gpu/post/index.ts';
import { DOSE_PARAMS, dosed } from '../../gpu/safety/dose.ts';
import { withChunks } from '../../gpu/shader.ts';
import { createUniformBuffer, defineUniformStruct } from '../../gpu/uniforms.ts';
import { defineEffect } from '../types.ts';
import shader from './fade.wgsl';
import { meta } from './meta.ts';

const Params = defineUniformStruct('Params', {
  width: 'f32',
  height: 'f32',
  css: 'f32',
  dmax: 'f32',
  css_sepia: 'f32',
  css_hue: 'f32',
  method: 'u32',
  grain: 'f32',
  /** The dyes' absorptions and their inverse, as rows. */
  dyes_0: 'vec4f',
  dyes_1: 'vec4f',
  dyes_2: 'vec4f',
  inverse_0: 'vec4f',
  inverse_1: 'vec4f',
  inverse_2: 'vec4f',
  base_fresh: 'vec4f',
  base_aged: 'vec4f',
  /** Share of each dye left: cyan, magenta, yellow. */
  left: 'vec4f',
});

const STORAGE: Record<string, Storage> = {
  'in an album (dark)': 'dark',
  'on the wall (light)': 'light',
};
const METHODS = ['dyes', 'css filter', 'split'] as const;
/** The ageing preset's sweep: years shown at time t. */
const SWEEP_YEARS = 45;
const SWEEP_SECONDS = 30;

const INVERSE = invert3(DYES);
const row = (r: readonly number[]): [number, number, number, number] => [r[0]!, r[1]!, r[2]!, 0];

const NO_TONEMAP = { output: { tonemap: 'none' } } as const;

export const effect = defineEffect({
  meta,
  params: {
    ...DOSE_PARAMS,
    picture: { type: 'select', default: 'snapshot', options: PICTURES.filter((p) => p !== 'page') },
    years: { type: 'number', default: 40, min: 0, max: 60, step: 1 },
    storage: { type: 'select', default: 'in an album (dark)', options: Object.keys(STORAGE) },
    method: { type: 'select', default: 'dyes', options: METHODS },
    ageing: { type: 'boolean', default: false, label: 'age it as you watch' },
    ...TAIL_PARAMS,
    bloom: { ...TAIL_PARAMS.bloom, default: 0 },
  },
  presets: {
    'forty years in an album': {},
    'ten years on the wall': { storage: 'on the wall (light)', years: 10 },
    'against CSS sepia': { method: 'split' },
    'age it as you watch': { ageing: true, years: 0 },
  },

  async create({ device, format, hdr, params, profiler }) {
    const tail = createHdrTail(device, { format, hdr, label: 'faded-print' });
    const uniforms = createUniformBuffer(device, Params, 'faded-print params');
    const pipeline = createFullscreenPipeline(device, {
      fragment: withChunks(shader, { 'params.wgsl': Params.wgsl }),
      entryPoint: 'fade',
      format: tail.scene.format,
    });
    const picture = createPicture(device, 'faded-print');
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
    let elapsed = 0;

    return {
      resize(w, h, ratio) {
        width = w;
        height = h;
        dpr = ratio;
        tail.resize(w, h);
      },
      frame(time, encoder, target) {
        elapsed += time.delta;
        // Ageing as you watch: from the chosen age, a year every two-thirds of a second, then held.
        const years = params.ageing
          ? Math.min(
              60,
              params.years + (SWEEP_YEARS * Math.min(elapsed, SWEEP_SECONDS)) / SWEEP_SECONDS,
            )
          : params.years;
        const storage = STORAGE[params.storage] ?? 'dark';
        const left = remaining(years, storage);
        const base = baseAfter(years, storage);
        uniforms.set({
          width,
          height,
          css: dpr,
          dmax: DMAX,
          // The usual CSS ageing recipe: more sepia with age, nudged warmer.
          css_sepia: Math.min(1, years / 50),
          css_hue: (-Math.min(1, years / 50) * 10 * Math.PI) / 180,
          grain: dosed(params.dose, 0, 0.04, 0.1),
          method: Math.max(0, METHODS.indexOf(params.method as (typeof METHODS)[number])),
          dyes_0: row(DYES[0]!),
          dyes_1: row(DYES[1]!),
          dyes_2: row(DYES[2]!),
          inverse_0: row(INVERSE[0]!),
          inverse_1: row(INVERSE[1]!),
          inverse_2: row(INVERSE[2]!),
          base_fresh: [...BASE, 0],
          base_aged: [...base, 0],
          left: [...left, 0],
        });
        uniforms.upload();
        if (picture.update(encoder, width, height, dpr, params.picture) || !bindGroup) {
          bindGroup = bind();
        }
        renderFullscreen(encoder, tail.scene.view, pipeline, [bindGroup], {
          timestampWrites: profiler.pass('fade'),
        });
        tail.encode(encoder, target, time, params, profiler, NO_TONEMAP);
      },
      destroy() {
        picture.destroy();
        uniforms.destroy();
        tail.destroy();
      },
    };
  },
});
