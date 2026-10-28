import { createFullscreenPipeline, renderFullscreen } from '../../gpu/fullscreen.ts';
import { createPicture, PICTURES } from '../../gpu/picture/picture.ts';
import { createHdrTail, TAIL_PARAMS } from '../../gpu/post/index.ts';
import { INKS, inkStep, PAPER, SCREEN_ANGLES, spotThreshold } from '../../gpu/print/print.ts';
import { DOSE_PARAMS, dosed } from '../../gpu/safety/dose.ts';
import { patternStepAt } from '../../gpu/safety/pattern.ts';
import { withChunks } from '../../gpu/shader.ts';
import { createStill } from '../../gpu/still.ts';
import { createUniformBuffer, defineUniformStruct, uniformArray } from '../../gpu/uniforms.ts';
import { defineEffect } from '../types.ts';
import { meta } from './meta.ts';
import shader from './pop.wgsl';

const Params = defineUniformStruct('Params', {
  width: 'f32',
  height: 'f32',
  css: 'f32',
  pitch: 'f32',
  line: 'f32',
  edge: 'f32',
  black: 'f32',
  light: 'f32',
  heavy: 'f32',
  /** Tone from which an ink prints solid. */
  solid: 'f32',
  /** Spot thresholds for the light and heavy tints, in x and y. */
  thresholds: 'vec2f',
  paper: 'vec4f',
  cyan: 'vec4f',
  magenta: 'vec4f',
  yellow: 'vec4f',
  black_ink: 'vec4f',
  /** The pattern rule's step at this dose, and each ink's own step on this paper (xyz). */
  step: 'f32',
  ink_steps: 'vec4f',
  offsets: uniformArray('vec4f', 4),
  angles: uniformArray('vec4f', 3),
});

const PAPERS: Record<string, readonly [number, number, number]> = {
  // Comic-book newsprint: grey-cream and a little yellowed.
  newsprint: [0.78, 0.74, 0.62],
  white: PAPER,
};

/** The colourist's tints: the light and heavy screens' coverage. */
const LIGHT = 0.25;
const HEAVY = 0.5;

const NO_TONEMAP = { output: { tonemap: 'none' } } as const;

export const effect = defineEffect({
  meta,
  params: {
    ...DOSE_PARAMS,
    picture: { type: 'select', default: 'snapshot', options: PICTURES.filter((p) => p !== 'page') },
    paper: { type: 'select', default: 'newsprint', options: Object.keys(PAPERS) },
    screen: {
      type: 'number',
      default: 9,
      min: 4,
      max: 24,
      step: 0.5,
      label: 'screen pitch (CSS px)',
    },
    line: {
      type: 'number',
      default: 2,
      min: 0.5,
      max: 6,
      step: 0.25,
      label: 'line weight (CSS px)',
    },
    edges: {
      type: 'number',
      default: 0.12,
      min: 0.04,
      max: 0.4,
      step: 0.01,
      label: 'contour threshold',
    },
    solids: { type: 'number', default: 0.5, min: 0.3, max: 0.9, step: 0.01, label: 'solid from' },
    blacks: {
      type: 'number',
      default: 0.22,
      min: 0,
      max: 0.5,
      step: 0.01,
      label: 'spotted blacks',
    },
    ...TAIL_PARAMS,
    bloom: { ...TAIL_PARAMS.bloom, default: 0 },
  },
  presets: {
    comic: {},
    poster: { picture: 'poster', screen: 12, line: 3 },
    'fine, white paper': { paper: 'white', screen: 6, line: 1.5 },
    // The dots at full ink, as a comic printed them: a coarse lattice over the rule (gated).
    'full ink': { dose: 0.9, screen: 12 },
  },

  async create({ device, format, hdr, params, profiler }) {
    const tail = createHdrTail(device, { format, hdr, label: 'pop-dots' });
    const uniforms = createUniformBuffer(device, Params, 'pop-dots params');
    const pipeline = createFullscreenPipeline(device, {
      fragment: withChunks(shader, { 'params.wgsl': Params.wgsl }),
      entryPoint: 'pop',
      format: 'rgba16float',
    });
    // A print is a still: printed into the still's target, and only again when it changes.
    const still = createStill(device, 'pop-dots');
    const picture = createPicture(device, 'pop-dots');
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
    const inks = [INKS.cyan, INKS.magenta, INKS.yellow];

    return {
      resize(w, h, ratio) {
        width = w;
        height = h;
        dpr = ratio;
        tail.resize(w, h);
      },
      frame(time, encoder, target) {
        // A print does not move, so its held frame is the frame it plays.
        const look = params.dose;
        const paper = PAPERS[params.paper] ?? PAPERS.newsprint!;
        const slip = dosed(params.dose, 0, 1, 3) * dpr;
        const directions = [
          [0.7, -0.4],
          [-0.6, 0.5],
          [0.3, 0.8],
          [0, 0],
        ];
        const degrees = [SCREEN_ANGLES.cyan, SCREEN_ANGLES.magenta, SCREEN_ANGLES.yellow];
        uniforms.set({
          width,
          height,
          css: dpr,
          pitch: Math.max(2, params.screen * dpr),
          line: params.line * dpr,
          edge: params.edges,
          black: params.blacks,
          light: LIGHT,
          heavy: HEAVY,
          solid: params.solids,
          thresholds: [spotThreshold(LIGHT), spotThreshold(HEAVY)],
          paper: [...paper, 1],
          cyan: [...INKS.cyan, 1],
          magenta: [...INKS.magenta, 1],
          yellow: [...INKS.yellow, 1],
          black_ink: [...INKS.black, 1],
          step: patternStepAt(look),
          ink_steps: [
            inkStep(inks[0]!, paper),
            inkStep(inks[1]!, paper),
            inkStep(inks[2]!, paper),
            0,
          ],
          offsets: directions.flatMap(([x, z]) => [x! * slip, z! * slip, 0, 0]),
          angles: degrees.flatMap((d) => [(d * Math.PI) / 180, 0, 0, 0]),
        });
        uniforms.upload();
        if (picture.update(encoder, width, height, dpr, params.picture) || !bindGroup) {
          bindGroup = bind();
        }
        const state = JSON.stringify([dpr, params]);
        if (still.stale(width, height, state)) {
          renderFullscreen(encoder, still.target.view, pipeline, [bindGroup], {
            timestampWrites: profiler.pass('pop'),
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
