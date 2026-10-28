import { createFullscreenPipeline, renderFullscreen } from '../../gpu/fullscreen.ts';
import { createHdrTail, TAIL_PARAMS } from '../../gpu/post/index.ts';
import { createPicture } from '../../gpu/picture/picture.ts';
import { INKS, inkStep, PAPER, SCREEN_ANGLES, SPOT_TABLE } from '../../gpu/print/print.ts';
import { DOSE_PARAMS, dosed } from '../../gpu/safety/dose.ts';
import { patternStepAt } from '../../gpu/safety/pattern.ts';
import { withChunks } from '../../gpu/shader.ts';
import { createUniformBuffer, defineUniformStruct, uniformArray } from '../../gpu/uniforms.ts';
import { defineEffect } from '../types.ts';
import { meta } from './meta.ts';
import shader from './press.wgsl';

const Params = defineUniformStruct('Params', {
  width: 'f32',
  height: 'f32',
  aspect: 'f32',
  pitch: 'f32',
  gcr: 'f32',
  gain: 'f32',
  rough: 'f32',
  compensate: 'u32',
  subject: 'u32',
  /** The pattern rule's step at this dose. */
  step: 'f32',
  /** Each ink's own step on this paper: cyan, magenta, yellow, black. */
  ink_steps: 'vec4f',
  paper: 'vec4f',
  cyan: 'vec4f',
  magenta: 'vec4f',
  yellow: 'vec4f',
  black: 'vec4f',
  /** Per ink: misregistration offset (px) in xy. */
  offsets: uniformArray('vec4f', 4),
  /** Per ink: screen angle (radians) in x. */
  angles: uniformArray('vec4f', 4),
});

/** What is printed: a picture (src/gpu/picture/), or the printer's swatches. */
const SUBJECTS = ['poster', 'snapshot', 'swatches'] as const;
/** Papers as linear reflectances: newsprint is grey and absorbent, coated is white. */
const PAPERS: Record<string, { colour: readonly [number, number, number]; gain: number }> = {
  newsprint: { colour: [0.72, 0.69, 0.6], gain: 0.28 },
  uncoated: { colour: PAPER, gain: 0.15 },
  coated: { colour: [0.93, 0.92, 0.9], gain: 0.08 },
};
const ANGLES = ['traditional', 'one angle'] as const;

const NO_TONEMAP = { output: { tonemap: 'none' } } as const;

export const effect = defineEffect({
  meta,
  params: {
    ...DOSE_PARAMS,
    subject: { type: 'select', default: 'poster', options: SUBJECTS },
    paper: { type: 'select', default: 'uncoated', options: Object.keys(PAPERS) },
    screen: {
      type: 'number',
      default: 7,
      min: 2,
      max: 24,
      step: 0.5,
      label: 'screen pitch (CSS px)',
    },
    angles: { type: 'select', default: 'traditional', options: ANGLES, label: 'screen angles' },
    gcr: { type: 'number', default: 0.6, min: 0, max: 1, step: 0.05, label: 'grey replacement' },
    compensate: { type: 'boolean', default: false, label: 'compensate dot gain' },
    ...TAIL_PARAMS,
    bloom: { ...TAIL_PARAMS.bloom, default: 0 },
  },
  presets: {
    poster: {},
    newsprint: { paper: 'newsprint', screen: 5, dose: 0.6 },
    'fine, coated': { paper: 'coated', screen: 3, dose: 0.1 },
    swatches: { subject: 'swatches', compensate: true },
    // The moiré the angles avoid, and the press's real dots: both full-contrast screens over the
    // pattern rule (gated).
    'moiré: one angle': { angles: 'one angle', screen: 5, dose: 0.9 },
    'real dots': { dose: 0.9 },
  },

  async create({ device, format, hdr, params, profiler }) {
    const tail = createHdrTail(device, { format, hdr, label: 'offset-print' });
    const uniforms = createUniformBuffer(device, Params, 'offset-print params');
    const table = device.createBuffer({
      label: 'spot table',
      size: SPOT_TABLE.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(table, 0, SPOT_TABLE);
    const pipeline = createFullscreenPipeline(device, {
      fragment: withChunks(shader, { 'params.wgsl': Params.wgsl }),
      entryPoint: 'press',
      format: tail.scene.format,
    });
    const picture = createPicture(device, 'offset-print');
    const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
    let bindGroup: GPUBindGroup | undefined;
    const bind = () =>
      device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: uniforms.buffer } },
          { binding: 1, resource: { buffer: table } },
          { binding: 2, resource: picture.target.view },
          { binding: 3, resource: sampler },
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
        const paper = PAPERS[params.paper] ?? PAPERS.uncoated!;
        // Misregistration: each plate off by its own small, fixed amount, more as `dose` rises.
        const slip = dosed(params.dose, 0, 1.2, 4) * dpr;
        const directions = [
          [0.8, -0.3],
          [-0.5, 0.7],
          [0.2, 0.9],
          [0, 0],
        ];
        const offsets = directions.flatMap(([x, y]) => [x! * slip, y! * slip, 0, 0]);
        const one = params.angles === 'one angle';
        const degrees = [
          SCREEN_ANGLES.cyan,
          SCREEN_ANGLES.magenta,
          SCREEN_ANGLES.yellow,
          SCREEN_ANGLES.black,
        ];
        const angles = degrees.flatMap((d) => [((one ? 45 : d) * Math.PI) / 180, 0, 0, 0]);
        uniforms.set({
          width,
          height,
          aspect: width / height,
          // The screen is set in CSS pixels, as a print's lines per inch are physical.
          pitch: Math.max(1, params.screen * dpr),
          gcr: params.gcr,
          gain: paper.gain * dosed(params.dose, 0.3, 1, 1.6),
          rough: dosed(params.dose, 0, 1, 2.5),
          compensate: params.compensate ? 1 : 0,
          subject: params.subject === 'swatches' ? 1 : 0,
          // A print does not move, so its held frame is the frame it plays.
          step: patternStepAt(params.dose),
          ink_steps: [
            inkStep(INKS.cyan, paper.colour),
            inkStep(INKS.magenta, paper.colour),
            inkStep(INKS.yellow, paper.colour),
            inkStep(INKS.black, paper.colour),
          ],
          paper: [...paper.colour, 1],
          cyan: [...INKS.cyan, 1],
          magenta: [...INKS.magenta, 1],
          yellow: [...INKS.yellow, 1],
          black: [...INKS.black, 1],
          offsets,
          angles,
        });
        uniforms.upload();
        const subject = params.subject === 'swatches' ? 'poster' : params.subject;
        if (picture.update(encoder, width, height, dpr, subject) || !bindGroup) bindGroup = bind();
        renderFullscreen(encoder, tail.scene.view, pipeline, [bindGroup], {
          timestampWrites: profiler.pass('press'),
        });
        tail.encode(encoder, target, time, params, profiler, NO_TONEMAP);
      },
      destroy() {
        table.destroy();
        picture.destroy();
        uniforms.destroy();
        tail.destroy();
      },
    };
  },
});
