import {
  lightnessForLuminance,
  luminance,
  oklchToLinear,
  type Vec3,
} from '../../gpu/colour/oklab.ts';
import { createFullscreenPipeline, renderFullscreen } from '../../gpu/fullscreen.ts';
import { createHdrTail, TAIL_PARAMS } from '../../gpu/post/index.ts';
import { safeColour } from '../../gpu/safety/colour-caps.ts';
import { DOSE_PARAMS, dosed, heldDose } from '../../gpu/safety/dose.ts';
import { patternStepAt } from '../../gpu/safety/pattern.ts';
import { withChunks } from '../../gpu/shader.ts';
import { createUniformBuffer, defineUniformStruct } from '../../gpu/uniforms.ts';
import { defineEffect } from '../types.ts';
import { meta } from './meta.ts';
import shader from './rays.wgsl';

const Params = defineUniformStruct('Params', {
  origin: 'vec2f',
  aspect: 'f32',
  spin: 'f32',
  rays: 'f32',
  taper: 'f32',
  tier: 'f32',
  lines: 'f32',
  sun: 'f32',
  ray: 'vec4f',
  ground: 'vec4f',
});

/** Where the burst comes from: the middle, the bottom edge (a rising sun), a corner (a fan). */
const ORIGINS: Record<string, [number, number]> = {
  centre: [0.5, 0.5],
  sunrise: [0.5, 1.02],
  fan: [0.0, 1.0],
};
/** Ray and ground in OKLCH (L, C, hue°): ray lightness is re-solved for the allowed step. */
const SCHEMES: Record<string, { ray: Vec3; ground: Vec3 }> = {
  'gold on black': { ray: [0.8, 0.12, 85], ground: [0.16, 0.01, 80] },
  'jade and gold': { ray: [0.8, 0.12, 85], ground: [0.32, 0.07, 165] },
  // The 1980s Miami revival: pastel rays on pink.
  miami: { ray: [0.86, 0.07, 190], ground: [0.74, 0.09, 0] },
};

const NO_TONEMAP = { output: { tonemap: 'none' } } as const;

export const effect = defineEffect({
  meta,
  params: {
    ...DOSE_PARAMS,
    origin: { type: 'select', default: 'sunrise', options: Object.keys(ORIGINS) },
    scheme: { type: 'select', default: 'gold on black', options: Object.keys(SCHEMES) },
    rays: { type: 'number', default: 18, min: 4, max: 48, step: 1 },
    taper: { type: 'number', default: 0.08, min: 0, max: 0.5, step: 0.01 },
    tiers: { type: 'number', default: 5, min: 1, max: 12, step: 1 },
    lines: { type: 'number', default: 1, min: 0, max: 1, step: 0.05, label: 'tier lines' },
    speed: { type: 'number', default: 1, min: 0, max: 3, step: 0.05 },
    ...TAIL_PARAMS,
    bloom: { ...TAIL_PARAMS.bloom, default: 0 },
  },
  presets: {
    sunrise: {},
    'centre burst': { origin: 'centre', rays: 24, tiers: 7 },
    fan: { origin: 'fan', rays: 12, scheme: 'jade and gold' },
    miami: { scheme: 'miami', rays: 14 },
    // Deco's own contrast: past the strong dose, a regular pattern over the rule (gated).
    'full contrast': { dose: 0.9, origin: 'centre', rays: 24 },
  },

  async create({ device, format, hdr, params, profiler }) {
    const tail = createHdrTail(device, { format, hdr, label: 'sunburst' });
    const uniforms = createUniformBuffer(device, Params, 'sunburst params');
    const pipeline = createFullscreenPipeline(device, {
      fragment: withChunks(shader, { 'params.wgsl': Params.wgsl }),
      entryPoint: 'rays',
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
        // Radians a second: a full turn in about seven minutes at the default.
        spin += time.delta * params.speed * dosed(params.dose, 0, 0.015, 0.06);
        const look = time.still ? heldDose(params.dose) : params.dose;
        const scheme = SCHEMES[params.scheme] ?? SCHEMES['gold on black']!;
        const rad = (v: Vec3): Vec3 => [v[0], v[1], (v[2] * Math.PI) / 180];
        const ground = oklchToLinear(safeColour(rad(scheme.ground)));
        // A sunburst of more than five rays is a radial pattern (The Hero's Journey 2.2): the
        // rays sit within the allowed luminance step of the ground, brighter or darker. Tiers and
        // lines lie between ground and ray, so none exceeds it.
        const groundY = luminance(ground);
        const step = patternStepAt(look) / Math.max(params.exposure, 1e-3);
        const rayLch = rad(scheme.ray);
        const brighter = luminance(oklchToLinear(safeColour(rayLch))) >= groundY;
        const targetY = Math.max(0, groundY + (brighter ? step : -step));
        const L = lightnessForLuminance(targetY, rayLch[1], rayLch[2]);
        const ray = oklchToLinear(safeColour([L, rayLch[1], rayLch[2]]));
        uniforms.set({
          origin: ORIGINS[params.origin] ?? ORIGINS.sunrise!,
          aspect,
          spin,
          rays: Math.round(params.rays),
          taper: params.taper,
          tier: 2.2 / params.tiers,
          lines: params.lines,
          sun: 0.16,
          ray: [ray[0], ray[1], ray[2], 1],
          ground: [ground[0], ground[1], ground[2], 1],
        });
        uniforms.upload();
        renderFullscreen(encoder, tail.scene.view, pipeline, [bindGroup], {
          timestampWrites: profiler.pass('rays'),
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
