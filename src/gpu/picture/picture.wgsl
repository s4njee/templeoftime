#include "fullscreen.wgsl"
#include "hash.wgsl"
#include "simplex.wgsl"
#include "sdf.wgsl"
#include "pictures.wgsl"
#include "picture-params.wgsl"

@group(0) @binding(0) var<uniform> params: PictureParams;

@fragment fn picture(in: FullscreenVarying) -> @location(0) vec4f {
  let size = vec2f(params.width, params.height);
  let aspect = params.width / params.height;
  switch (params.subject) {
    case 1u: { return vec4f(picture_poster(in.uv, aspect), 1.0); }
    case 2u: { return vec4f(picture_page(in.uv, aspect, size, params.css), 1.0); }
    default: { return vec4f(picture_snapshot(in.uv, aspect), 1.0); }
  }
}
