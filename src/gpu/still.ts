import { createFullscreenPipeline, renderFullscreen } from './fullscreen.ts';
import shader from './still.wgsl';
import { createRenderTarget, type RenderTarget } from './targets.ts';

/*
 * A still effect's picture, kept between frames (M1). A print, a copy or a painting does not
 * move, so its passes run only when what it shows would change (its parameters or the view's
 * size), into `target`; every frame shows the cached picture with one cheap pass. The effect
 * pays its full cost on the first frame after a change, and the cost of a copy afterwards.
 */
export interface Still {
  /** Where the effect paints, at the view's size. Contents survive until `stale` says otherwise. */
  readonly target: RenderTarget;
  /** True when the picture must be painted again: the size changed, or `key` did. */
  stale(width: number, height: number, key: string): boolean;
  /** Draws the cached picture into `view`. */
  show(
    encoder: GPUCommandEncoder,
    view: GPUTextureView,
    format: GPUTextureFormat,
    timestampWrites?: GPURenderPassTimestampWrites,
  ): void;
  destroy(): void;
}

export function createStill(device: GPUDevice, label: string): Still {
  const target = createRenderTarget(device, {
    label: `${label} still`,
    format: 'rgba16float',
    width: 1,
    height: 1,
  });
  const pipelines = new Map<GPUTextureFormat, GPURenderPipeline>();
  let group: GPUBindGroup | undefined;
  let groupView: GPUTextureView | undefined;
  let drawn = '';
  return {
    target,
    stale(width, height, key) {
      const resized = target.resize(width, height);
      if (!resized && key === drawn) return false;
      drawn = key;
      return true;
    },
    show(encoder, view, format, timestampWrites) {
      let pipeline = pipelines.get(format);
      if (!pipeline) {
        pipeline = createFullscreenPipeline(device, {
          fragment: shader,
          entryPoint: 'show',
          format,
        });
        pipelines.set(format, pipeline);
      }
      if (!group || groupView !== target.view) {
        groupView = target.view;
        group = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: target.view }],
        });
      }
      renderFullscreen(encoder, view, pipeline, [group], {
        label: `${label} still`,
        timestampWrites,
      });
    },
    destroy() {
      target.destroy();
    },
  };
}
