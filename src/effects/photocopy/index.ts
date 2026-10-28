import { createFullscreenPipeline, renderFullscreen } from '../../gpu/fullscreen.ts';
import { createPicture, PICTURES } from '../../gpu/picture/picture.ts';
import { createHdrTail, TAIL_PARAMS } from '../../gpu/post/index.ts';
import { DOSE_PARAMS, dosed } from '../../gpu/safety/dose.ts';
import { withChunks } from '../../gpu/shader.ts';
import { createPingPongTarget } from '../../gpu/targets.ts';
import { createUniformBuffer, defineUniformStruct } from '../../gpu/uniforms.ts';
import { defineEffect } from '../types.ts';
import shader from './copy.wgsl';
import { meta } from './meta.ts';

const MAX_GENERATIONS = 8;

const Params = defineUniformStruct('Params', {
  width: 'f32',
  height: 'f32',
  css: 'f32',
  seed: 'f32',
  skew: 'f32',
  scale: 'f32',
  shift: 'vec2f',
  blur: 'f32',
  threshold: 'f32',
  contrast: 'f32',
  specks: 'f32',
  dropouts: 'f32',
  streaks: 'f32',
  lid: 'f32',
  paper: 'f32',
  toner: 'f32',
  paper_colour: 'vec4f',
  toner_colour: 'vec4f',
});

const NO_TONEMAP = { output: { tonemap: 'none' } } as const;

/** A repeatable random number per generation and purpose. */
const rand = (g: number, k: number) => {
  const v = Math.sin(g * 91.7 + k * 47.3) * 43758.5453;
  return v - Math.floor(v);
};

export const effect = defineEffect({
  meta,
  params: {
    ...DOSE_PARAMS,
    picture: { type: 'select', default: 'page', options: PICTURES },
    generations: { type: 'number', default: 3, min: 1, max: MAX_GENERATIONS, step: 1 },
    darkness: { type: 'number', default: 0.5, min: 0.2, max: 0.8, step: 0.01 },
    lid: { type: 'select', default: 'open', options: ['open', 'closed'], label: 'copier lid' },
    ...TAIL_PARAMS,
    bloom: { ...TAIL_PARAMS.bloom, default: 0 },
  },
  presets: {
    'third generation': {},
    'clean copy': { generations: 1, dose: 0.1, lid: 'closed' },
    'copy of a copy of a copy': { generations: 7, dose: 0.6 },
    'snapshot, dark': { picture: 'snapshot', darkness: 0.62, generations: 2 },
  },

  async create({ device, format, hdr, params, profiler }) {
    const tail = createHdrTail(device, { format, hdr, label: 'photocopy' });
    const copies = createPingPongTarget(device, {
      label: 'photocopy generations',
      format: 'rgba16float',
      width: 1,
      height: 1,
    });
    const picture = createPicture(device, 'photocopy');
    const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
    const fragment = withChunks(shader, { 'params.wgsl': Params.wgsl });
    const copyPipeline = createFullscreenPipeline(device, {
      fragment,
      entryPoint: 'copy',
      format: copies.write.format,
    });
    const presentPipeline = createFullscreenPipeline(device, {
      fragment,
      entryPoint: 'present',
      format: tail.scene.format,
    });
    // One uniform buffer per generation, since every pass is encoded before any runs.
    const uniforms = Array.from({ length: MAX_GENERATIONS }, (_, g) =>
      createUniformBuffer(device, Params, `photocopy generation ${g + 1}`),
    );
    const group = (pipeline: GPURenderPipeline, g: number, view: GPUTextureView) =>
      device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: uniforms[g]!.buffer } },
          { binding: 1, resource: view },
          { binding: 2, resource: sampler },
        ],
      });
    let width = 1;
    let height = 1;
    let dpr = 1;
    let drawn = '';

    return {
      resize(w, h, ratio) {
        width = w;
        height = h;
        dpr = ratio;
        copies.resize(w, h);
        tail.resize(w, h);
      },
      frame(time, encoder, target) {
        const n = Math.round(Math.min(MAX_GENERATIONS, Math.max(1, params.generations)));
        picture.update(encoder, width, height, dpr, params.picture);
        // The copies are a still: run the chain again only when something changed.
        const key = JSON.stringify([
          width,
          height,
          dpr,
          n,
          params.picture,
          params.darkness,
          params.lid,
          params.dose,
        ]);
        const d = params.dose;
        for (let g = 0; g < n; g++) {
          uniforms[g]!.set({
            width,
            height,
            css: dpr,
            seed: g * 13.1 + 1,
            // The original never quite square on the glass, nor copied at exactly 100%.
            skew: (rand(g, 1) - 0.5) * dosed(d, 0, 0.006, 0.02),
            scale: 1 + (rand(g, 2) - 0.5) * dosed(d, 0, 0.006, 0.02),
            shift: [
              (rand(g, 3) - 0.5) * dosed(d, 0, 3, 10) * dpr,
              (rand(g, 4) - 0.5) * dosed(d, 0, 3, 10) * dpr,
            ],
            blur: dosed(d, 0.3, 0.6, 1) * dpr,
            threshold: params.darkness,
            contrast: 0.06,
            specks: dosed(d, 0, 0.0015, 0.006),
            dropouts: dosed(d, 0, 0.004, 0.015),
            streaks: dosed(d, 0, 0.6, 1),
            lid: params.lid === 'open' ? 0.04 : 0.9,
            paper: 0.9,
            toner: 0.04,
            paper_colour: [0.86, 0.86, 0.84, 1],
            toner_colour: [0.03, 0.03, 0.035, 1],
          });
          uniforms[g]!.upload();
        }
        if (key !== drawn) {
          drawn = key;
          for (let g = 0; g < n; g++) {
            const source = g === 0 ? picture.target.view : copies.read.view;
            renderFullscreen(
              encoder,
              copies.write.view,
              copyPipeline,
              [group(copyPipeline, g, source)],
              {
                label: `generation ${g + 1}`,
                timestampWrites: profiler.pass(`generation ${g + 1}`),
              },
            );
            copies.swap();
          }
        }
        renderFullscreen(
          encoder,
          tail.scene.view,
          presentPipeline,
          [group(presentPipeline, n - 1, copies.read.view)],
          {
            timestampWrites: profiler.pass('present'),
          },
        );
        tail.encode(encoder, target, time, params, profiler, NO_TONEMAP);
      },
      destroy() {
        for (const u of uniforms) u.destroy();
        copies.destroy();
        picture.destroy();
        tail.destroy();
      },
    };
  },
});
