import { oklchToLinear, type Vec3 } from '../../gpu/colour/oklab.ts';
import { createFullscreenPipeline, renderFullscreen } from '../../gpu/fullscreen.ts';
import { createHdrTail, TAIL_PARAMS } from '../../gpu/post/index.ts';
import { safeColour } from '../../gpu/safety/colour-caps.ts';
import { DOSE_PARAMS, dosed } from '../../gpu/safety/dose.ts';
import { withChunks } from '../../gpu/shader.ts';
import { createStill } from '../../gpu/still.ts';
import { createUniformBuffer, defineUniformStruct } from '../../gpu/uniforms.ts';
import { defineEffect } from '../types.ts';
import { meta } from './meta.ts';
import shader from './spray.wgsl';

const Params = defineUniformStruct('Params', {
  aspect: 'f32',
  height: 'f32',
  css: 'f32',
  droplet: 'f32',
  spatter: 'f32',
  wobble: 'f32',
  /** How much of each layer is sprayed: sky, glow, sun, land in a; rim in b.x. */
  progress_a: 'vec4f',
  progress_b: 'vec4f',
  board: 'vec4f',
  sky: 'vec4f',
  glow: 'vec4f',
  sun_top: 'vec4f',
  sun_low: 'vec4f',
  land_mid: 'vec4f',
  land: 'vec4f',
  rim: 'vec4f',
});

type Layer = 'board' | 'sky' | 'glow' | 'sun_top' | 'sun_low' | 'land_mid' | 'land' | 'rim';

/** Paints in OKLCH (L, C, hue°), from the 1980s palettes in docs/eras.md. */
const PALETTES: Record<string, Record<Layer, Vec3>> = {
  sunset: {
    board: [0.95, 0.01, 90],
    sky: [0.32, 0.14, 290],
    glow: [0.72, 0.16, 20],
    sun_top: [0.93, 0.14, 100],
    sun_low: [0.7, 0.18, 45],
    land_mid: [0.4, 0.1, 320],
    land: [0.2, 0.06, 300],
    rim: [0.65, 0.17, 350],
  },
  dusk: {
    board: [0.95, 0.01, 90],
    sky: [0.3, 0.1, 255],
    glow: [0.76, 0.1, 60],
    sun_top: [0.95, 0.08, 95],
    sun_low: [0.78, 0.14, 70],
    land_mid: [0.36, 0.06, 250],
    land: [0.18, 0.04, 260],
    rim: [0.62, 0.12, 225],
  },
};

/** When each layer is sprayed while the picture sprays itself in: [start, length] in seconds. */
const SCHEDULE: [number, number][] = [
  [0, 2.5],
  [2, 2],
  [3.5, 1.5],
  [4.5, 2],
  [6, 1.5],
];

const NO_TONEMAP = { output: { tonemap: 'none' } } as const;

export const effect = defineEffect({
  meta,
  params: {
    ...DOSE_PARAMS,
    palette: { type: 'select', default: 'sunset', options: Object.keys(PALETTES) },
    build: { type: 'boolean', default: false, label: 'spray it in' },
    droplets: {
      type: 'number',
      default: 1,
      min: 0.5,
      max: 4,
      step: 0.25,
      label: 'droplet size (CSS px)',
    },
    ...TAIL_PARAMS,
    bloom: { ...TAIL_PARAMS.bloom, default: 0 },
  },
  presets: {
    sunset: {},
    dusk: { palette: 'dusk' },
    'spraying it in': { build: true },
    'a rough hand': { dose: 0.7, droplets: 2 },
  },

  async create({ device, format, hdr, params, profiler }) {
    const tail = createHdrTail(device, { format, hdr, label: 'airbrush' });
    const uniforms = createUniformBuffer(device, Params, 'airbrush params');
    // The picture is a still: painted into the still's target, and only again when it changes.
    const still = createStill(device, 'airbrush');
    const pipeline = createFullscreenPipeline(device, {
      fragment: withChunks(shader, { 'params.wgsl': Params.wgsl }),
      entryPoint: 'paint',
      format: still.target.format,
    });
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniforms.buffer } }],
    });
    let width = 1;
    let height = 1;
    let dpr = 1;
    let elapsed = 0;
    let built = '';

    return {
      resize(w, h, ratio) {
        width = w;
        height = h;
        dpr = ratio;
        tail.resize(w, h);
      },
      frame(time, encoder, target) {
        // Spraying in starts again when it is switched on.
        const key = `${params.build}`;
        if (key !== built) {
          built = key;
          elapsed = 0;
        }
        elapsed += time.delta;
        // A held frame is the finished picture.
        const progress = SCHEDULE.map(([start, length]) =>
          params.build && !time.still ? Math.min(1, Math.max(0, (elapsed - start) / length)) : 1,
        );
        const palette = PALETTES[params.palette] ?? PALETTES.sunset!;
        const colour = (layer: Layer): [number, number, number, number] => {
          const [L, C, h] = palette[layer];
          return [...oklchToLinear(safeColour([L, C, (h * Math.PI) / 180])), 1];
        };
        uniforms.set({
          aspect: width / height,
          height,
          css: dpr,
          droplet: Math.max(1, params.droplets * dpr),
          spatter: dosed(params.dose, 0, 0.05, 0.25),
          wobble: dosed(params.dose, 0, 0.3, 0.8),
          progress_a: [progress[0]!, progress[1]!, progress[2]!, progress[3]!],
          progress_b: [progress[4]!, 0, 0, 0],
          board: colour('board'),
          sky: colour('sky'),
          glow: colour('glow'),
          sun_top: colour('sun_top'),
          sun_low: colour('sun_low'),
          land_mid: colour('land_mid'),
          land: colour('land'),
          rim: colour('rim'),
        });
        uniforms.upload();
        const look = JSON.stringify([dpr, params.palette, params.dose, params.droplets, progress]);
        if (still.stale(width, height, look)) {
          renderFullscreen(encoder, still.target.view, pipeline, [bindGroup], {
            timestampWrites: profiler.pass('paint'),
          });
        }
        still.show(encoder, tail.scene.view, tail.scene.format, profiler.pass('show'));
        tail.encode(encoder, target, time, params, profiler, NO_TONEMAP);
      },
      destroy() {
        still.destroy();
        uniforms.destroy();
        tail.destroy();
      },
    };
  },
});
