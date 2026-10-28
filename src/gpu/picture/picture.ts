import { createFullscreenPipeline, renderFullscreen } from '../fullscreen.ts';
import { withChunks } from '../shader.ts';
import { createRenderTarget, type RenderTarget } from '../targets.ts';
import { createUniformBuffer, defineUniformStruct } from '../uniforms.ts';
import shader from './picture.wgsl';

/*
 * The picture a print or photograph process works on (M1). Until a page hands over its own image
 * (story 8.4), it is one of the family's generated subjects (src/wgsl/pictures.wgsl), rendered
 * once into a linear texture at the view's size and redrawn only when the size or subject
 * changes. Effects sample it, so a process that reads the picture several times (four plates,
 * a few silkscreen passes) pays for a texture read, not for the picture.
 */

export const PICTURES = ['snapshot', 'poster', 'page'] as const;
export type PictureName = (typeof PICTURES)[number];

const Params = defineUniformStruct('PictureParams', {
  width: 'f32',
  height: 'f32',
  css: 'f32',
  subject: 'u32',
});

export interface Picture {
  /** Linear RGB in `rgba16float`, at the size of the last `update`. */
  readonly target: RenderTarget;
  /** Redraws the picture if the size, pixel ratio or subject changed. Returns whether it did. */
  update(
    encoder: GPUCommandEncoder,
    width: number,
    height: number,
    dpr: number,
    subject: string,
  ): boolean;
  destroy(): void;
}

export function createPicture(device: GPUDevice, label: string): Picture {
  const target = createRenderTarget(device, {
    label: `${label} picture`,
    format: 'rgba16float',
    width: 1,
    height: 1,
  });
  const uniforms = createUniformBuffer(device, Params, `${label} picture params`);
  const pipeline = createFullscreenPipeline(device, {
    fragment: withChunks(shader, { 'picture-params.wgsl': Params.wgsl }),
    entryPoint: 'picture',
    format: target.format,
  });
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniforms.buffer } }],
  });
  let drawn = '';
  return {
    target,
    update(encoder, width, height, dpr, subject) {
      const index = Math.max(0, PICTURES.indexOf(subject as PictureName));
      const key = `${width}x${height}@${dpr}:${index}`;
      if (key === drawn) return false;
      target.resize(width, height);
      uniforms.set({ width: target.width, height: target.height, css: dpr, subject: index });
      uniforms.upload();
      renderFullscreen(encoder, target.view, pipeline, [bindGroup], { label: `${label} picture` });
      drawn = key;
      return true;
    },
    destroy() {
      uniforms.destroy();
      target.destroy();
    },
  };
}
