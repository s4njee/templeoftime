import { lightnessForLuminance, luminance, oklchToLinear } from '../../gpu/colour/oklab.ts';
import { createFullscreenPipeline, renderFullscreen } from '../../gpu/fullscreen.ts';
import { createHdrTail, TAIL_PARAMS } from '../../gpu/post/index.ts';
import { safeColour } from '../../gpu/safety/colour-caps.ts';
import { DOSE_PARAMS, dosed, heldDose } from '../../gpu/safety/dose.ts';
import { patternStepAt } from '../../gpu/safety/pattern.ts';
import { withChunks } from '../../gpu/shader.ts';
import { createUniformBuffer, defineUniformStruct } from '../../gpu/uniforms.ts';
import { defineEffect } from '../types.ts';
import shader from './fan.wgsl';
import { meta } from './meta.ts';

const Params = defineUniformStruct('Params', {
  aspect: 'f32',
  spin: 'f32',
  rays: 'f32',
  ray: 'vec4f',
  ground: 'vec4f',
});

const NO_TONEMAP = { output: { tonemap: 'none' } } as const;

export const effect = defineEffect({
  meta,
  params: {
    ...DOSE_PARAMS,
    rays: { type: 'number', default: 9, min: 2, max: 24, step: 1 },
    hue: { type: 'number', default: 85, min: 0, max: 360, step: 1, label: 'hue (°)' },
    ...TAIL_PARAMS,
    bloom: { ...TAIL_PARAMS.bloom, default: 0 },
  },
  presets: {
    gold: {},
    jade: { hue: 165 },
    'nearly still': { dose: 0.1 },
  },

  async create({ device, format, hdr, params, profiler }) {
    const tail = createHdrTail(device, { format, hdr, label: 'hello' });
    const uniforms = createUniformBuffer(device, Params, 'hello params');
    const pipeline = createFullscreenPipeline(device, {
      fragment: withChunks(shader, { 'params.wgsl': Params.wgsl }),
      entryPoint: 'fan',
      format: tail.scene.format,
    });
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniforms.buffer } }],
    });
    let aspect = 1;
    let spin = 0;

    return {
      resize(w, h) {
        aspect = w / h;
        tail.resize(w, h);
      },
      frame(time, encoder, target) {
        spin += time.delta * dosed(params.dose, 0, 0.01, 0.05);
        const look = time.still ? heldDose(params.dose) : params.dose;
        const h = (params.hue * Math.PI) / 180;
        const ground = oklchToLinear(safeColour([0.18, 0.02, h]));
        const L = lightnessForLuminance(luminance(ground) + patternStepAt(look), 0.1, h);
        const ray = oklchToLinear(safeColour([L, 0.1, h]));
        uniforms.set({
          aspect,
          spin,
          rays: params.rays,
          ray: [ray[0], ray[1], ray[2], 1],
          ground: [ground[0], ground[1], ground[2], 1],
        });
        uniforms.upload();
        renderFullscreen(encoder, tail.scene.view, pipeline, [bindGroup], {
          timestampWrites: profiler.pass('fan'),
        });
        tail.encode(encoder, target, time, params, profiler, NO_TONEMAP);
      },
      destroy() {
        uniforms.destroy();
        tail.destroy();
      },
    };
  },
});
