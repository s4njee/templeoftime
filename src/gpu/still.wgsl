#include "fullscreen.wgsl"

// A still effect's cached picture, shown as it is (src/gpu/still.ts).
@group(0) @binding(0) var cached: texture_2d<f32>;

@fragment fn show(in: FullscreenVarying) -> @location(0) vec4f {
  return textureLoad(cached, vec2i(in.position.xy), 0);
}
