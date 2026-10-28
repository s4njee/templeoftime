import { oklchToLinear, type Vec3 } from '../../gpu/colour/oklab.ts';
import { flickerIntensity } from '../../gpu/flicker.ts';
import { createFullscreenPipeline, renderFullscreen } from '../../gpu/fullscreen.ts';
import { createHdrTail, OVERLAY_PARAMS, TAIL_PARAMS } from '../../gpu/post/index.ts';
import { safeColour } from '../../gpu/safety/colour-caps.ts';
import { DOSE_PARAMS, dosed, heldDose } from '../../gpu/safety/dose.ts';
import { createShader, withChunks } from '../../gpu/shader.ts';
import { ANTON } from '../../gpu/text/anton.generated.ts';
import { glyphSegments, layoutLine } from '../../gpu/text/font.ts';
import { createTextField, type TextLine } from '../../gpu/text/text-field.ts';
import { createUniformBuffer, defineUniformStruct } from '../../gpu/uniforms.ts';
import { defineEffect } from '../types.ts';
import shader from './lettering.wgsl';
import glintShader from './glints.wgsl';
import { meta } from './meta.ts';

const Params = defineUniformStruct('Params', {
  width: 'f32',
  height: 'f32',
  /** The letters' mid-height (the horizon on them), half their cap height, px. */
  mid_y: 'f32',
  half_cap: 'f32',
  /** The backdrop's horizon, px. */
  horizon_y: 'f32',
  bevel: 'f32',
  bend: 'f32',
  outline: 'f32',
  gleam: 'f32',
  gleam_x: 'f32',
  gleam_width: 'f32',
  backdrop: 'u32',
  shadow: 'vec2i',
  sky_top: 'vec4f',
  sky_low: 'vec4f',
  line: 'vec4f',
  ground_high: 'vec4f',
  ground_low: 'vec4f',
});

const GlintParams = defineUniformStruct('GlintParams', { width: 'f32', height: 'f32' });

/** The horizon each palette reflects, in OKLCH (L, C, hue degrees), from 1.7's sources. */
const HORIZONS: Record<
  string,
  Record<'sky_top' | 'sky_low' | 'line' | 'ground_high' | 'ground_low', Vec3>
> = {
  // The album-cover sunset: violet sky over a hot horizon, dark ground warming to orange.
  sunset: {
    sky_top: [0.32, 0.14, 280],
    sky_low: [0.78, 0.13, 25],
    line: [0.98, 0.03, 80],
    ground_high: [0.16, 0.03, 40],
    ground_low: [0.62, 0.14, 55],
  },
  // Plain steel: grey-blue sky, grey ground.
  steel: {
    sky_top: [0.42, 0.06, 250],
    sky_low: [0.88, 0.03, 240],
    line: [1, 0, 0],
    ground_high: [0.18, 0.01, 250],
    ground_low: [0.55, 0.02, 250],
  },
  // Gold leaf's chrome: a warm sky, brown ground.
  gold: {
    sky_top: [0.45, 0.1, 70],
    sky_low: [0.9, 0.1, 90],
    line: [1, 0.04, 95],
    ground_high: [0.2, 0.05, 60],
    ground_low: [0.62, 0.13, 75],
  },
};
const PALETTES = Object.keys(HORIZONS) as readonly string[];
const BACKDROPS = ['none', 'black', 'sunset'] as const;

const NO_TONEMAP = { output: { tonemap: 'none' } } as const;

/** The point of a glyph's outline furthest up and to the left, em from its origin: a glint. */
function glintPoint(char: string): [number, number] | undefined {
  const glyph = ANTON.glyphs[char];
  if (!glyph || glyph.bounds[2] === 0) return undefined;
  const s = glyphSegments(glyph);
  let best = -Infinity;
  let at: [number, number] = [0, 0];
  for (let i = 0; i < s.length; i += 4) {
    const score = s[i + 1]! - 0.7 * s[i]!;
    if (score > best) {
      best = score;
      at = [s[i]! / ANTON.unitsPerEm, s[i + 1]! / ANTON.unitsPerEm];
    }
  }
  return at;
}

export const effect = defineEffect({
  meta,
  params: {
    ...DOSE_PARAMS,
    text: { type: 'text', default: 'TIME', maxLength: 24 },
    size: { type: 'number', default: 0.3, min: 0.08, max: 0.6, step: 0.01, label: 'cap height' },
    tracking: { type: 'number', default: 0.02, min: -0.05, max: 0.3, step: 0.005 },
    palette: { type: 'select', default: 'sunset', options: PALETTES },
    backdrop: { type: 'select', default: 'none', options: BACKDROPS },
    bevel: {
      type: 'number',
      default: 0.22,
      min: 0.02,
      max: 0.6,
      step: 0.01,
      label: 'bevel (of a stroke)',
    },
    glints: { type: 'number', default: 2, min: 0, max: 6, step: 1 },
    ...TAIL_PARAMS,
    bloom: { ...TAIL_PARAMS.bloom, default: 0.35 },
    ...OVERLAY_PARAMS,
    alpha: { ...OVERLAY_PARAMS.alpha, default: 'coverage' },
  },
  presets: {
    sunset: {},
    'on its sunset': { backdrop: 'sunset', text: 'OUTRUN' },
    steel: { palette: 'steel', text: 'CHROME', glints: 1 },
    gold: { palette: 'gold', text: '1984', size: 0.4 },
    'still, no glints': { dose: 0, glints: 0 },
  },

  async create({ device, format, hdr, params, profiler }) {
    const tail = createHdrTail(device, { format, hdr, label: 'chrome-type' });
    const text = createTextField(device, ANTON);
    const uniforms = createUniformBuffer(device, Params, 'chrome params');
    const pipeline = createFullscreenPipeline(device, {
      fragment: withChunks(shader, { 'params.wgsl': Params.wgsl }),
      entryPoint: 'chrome',
      format: tail.scene.format,
    });
    const glintUniforms = createUniformBuffer(device, GlintParams, 'glint params');
    const glintModule = createShader(
      device,
      withChunks(glintShader, { 'glint-params.wgsl': GlintParams.wgsl }),
    );
    const add: GPUBlendComponent = { srcFactor: 'one', dstFactor: 'one' };
    const glintPipeline = device.createRenderPipeline({
      label: 'chrome glints',
      layout: 'auto',
      vertex: { module: glintModule, entryPoint: 'star_vs' },
      fragment: {
        module: glintModule,
        entryPoint: 'star_fs',
        targets: [{ format: tail.scene.format, blend: { color: add, alpha: add } }],
      },
      primitive: { topology: 'triangle-strip' },
    });
    const MAX_STARS = 6;
    const stars = device.createBuffer({
      label: 'chrome stars',
      size: MAX_STARS * 16,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    const glintGroup = device.createBindGroup({
      layout: glintPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: glintUniforms.buffer } },
        { binding: 1, resource: { buffer: stars } },
      ],
    });

    let width = 1;
    let height = 1;
    let field: GPUTexture | undefined;
    let group: GPUBindGroup | undefined;
    let drawn = '';
    let line: TextLine = { text: '', x: 0, y: 0, size: 1 };
    let clock = 0;
    const capEm = (ANTON.glyphs.H!.bounds[3] - ANTON.glyphs.H!.bounds[1]) / ANTON.unitsPerEm;

    const layout = () => {
      // Cap height as a share of the view, shrunk to fit nine tenths of its width.
      let size = (params.size * height) / capEm;
      const em = layoutLine(ANTON, params.text, params.tracking).width;
      if (em * size > 0.9 * width) size = (0.9 * width) / Math.max(em, 1e-3);
      const baseline = height / 2 + (capEm * size) / 2;
      return {
        text: params.text,
        x: width / 2,
        y: baseline,
        size,
        tracking: params.tracking,
        align: 'centre' as const,
      };
    };

    return {
      resize(w, h) {
        width = w;
        height = h;
        tail.resize(w, h);
        field?.destroy();
        field = device.createTexture({
          label: 'chrome text field',
          size: [w, h],
          format: 'r16float',
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });
        group = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: uniforms.buffer } },
            { binding: 1, resource: field.createView() },
          ],
        });
        drawn = '';
      },
      frame(time, encoder, target) {
        if (!field || !group) return;
        clock += time.delta;
        const look = time.still ? heldDose(params.dose) : params.dose;
        line = layout();
        const key = `${line.text}|${line.size}|${line.tracking}|${width}x${height}`;
        if (key !== drawn) {
          text.draw(encoder, field.createView(), width, height, line);
          drawn = key;
        }
        const capPx = capEm * line.size;
        const colours = HORIZONS[params.palette] ?? HORIZONS.sunset!;
        const linear = (lch: Vec3, max = 1) => {
          const c = oklchToLinear(safeColour([lch[0], lch[1], (lch[2] * Math.PI) / 180], max));
          return [c[0], c[1], c[2], 1] as const;
        };
        // A gleam crosses the letters every `period` seconds, a quarter of the time on screen.
        const period = dosed(params.dose, 0, 9, 3);
        const phase = period > 0 ? (clock % period) / period : 1;
        const [left, , right] = text.measure(line);
        const gleamX = left - capPx + phase * 4 * (right - left + 2 * capPx);
        // The bevel is a share of a stroke: Anton's stems are about a seventh of an em.
        const stroke = 0.14 * line.size;
        uniforms.set({
          width,
          height,
          mid_y: line.y - capPx / 2,
          half_cap: capPx / 2,
          horizon_y: height * 0.62,
          bevel: params.bevel * stroke,
          bend: 0.55,
          outline: Math.max(1, 0.018 * line.size),
          gleam: time.still ? 0 : dosed(look, 0, 0.5, 0.8),
          gleam_x: gleamX,
          gleam_width: 0.18 * capPx,
          backdrop: Math.max(0, BACKDROPS.indexOf(params.backdrop as (typeof BACKDROPS)[number])),
          shadow: [Math.round(0.04 * line.size), Math.round(0.05 * line.size)],
          sky_top: linear(colours.sky_top),
          sky_low: linear(colours.sky_low),
          line: linear(colours.line, 2),
          ground_high: linear(colours.ground_high),
          ground_low: linear(colours.ground_low),
        });
        uniforms.upload();
        renderFullscreen(encoder, tail.scene.view, pipeline, [group], {
          timestampWrites: profiler.pass('chrome'),
        });

        // Glints at the top-left of a few glyphs, chosen evenly along the line.
        const placed = layoutLine(ANTON, line.text, line.tracking ?? 0).glyphs;
        const candidates = placed
          .map((g) => ({ g, at: glintPoint(g.char) }))
          .filter((c): c is { g: (typeof placed)[number]; at: [number, number] } => !!c.at);
        const count = Math.min(params.glints, candidates.length, MAX_STARS);
        const data = new Float32Array(MAX_STARS * 4);
        for (let i = 0; i < count; i++) {
          const pick = candidates[Math.floor(((i + 0.5) / count) * candidates.length)]!;
          // Twinkle from the band-limited flicker signal: never more than three flashes a second.
          const twinkle = flickerIntensity(clock, 17 + i, {
            rate: dosed(look, 0, 1.5, 3.5),
            depth: dosed(look, 0, 0.6, 0.9),
            shimmer: 0,
            shimmerRate: 0,
          });
          data.set(
            [
              left + (pick.g.x + pick.at[0]) * line.size,
              line.y - pick.at[1] * line.size,
              0.32 * capPx,
              2.5 * twinkle,
            ],
            i * 4,
          );
        }
        device.queue.writeBuffer(stars, 0, data);
        glintUniforms.set({ width, height });
        glintUniforms.upload();
        if (count > 0) {
          const pass = encoder.beginRenderPass({
            label: 'chrome glints',
            colorAttachments: [{ view: tail.scene.view, loadOp: 'load', storeOp: 'store' }],
            timestampWrites: profiler.pass('glints'),
          });
          pass.setPipeline(glintPipeline);
          pass.setBindGroup(0, glintGroup);
          pass.draw(4, count);
          pass.end();
        }
        tail.encode(encoder, target, time, params, profiler, NO_TONEMAP);
      },
      destroy() {
        field?.destroy();
        stars.destroy();
        uniforms.destroy();
        glintUniforms.destroy();
        text.destroy();
        tail.destroy();
      },
    };
  },
});
