#include "fullscreen.wgsl"
#include "params.wgsl"

// Hello: the smallest effect. A Deco fan of rays from the bottom of the view, turning very
// slowly, one fragment pass into the HDR tail. The two colours arrive from the CPU within the
// luminance step the pattern rule allows (a fan of more than five rays is a radial pattern).

@group(0) @binding(0) var<uniform> params: Params;

@fragment fn fan(in: FullscreenVarying) -> @location(0) vec4f {
  let p = vec2f((in.uv.x - 0.5) * params.aspect, 1.0 - in.uv.y);
  let k = (atan2(p.y, p.x) + params.spin) / 3.14159265 * params.rays;
  let edge = fwidth(k);
  let ray = smoothstep(0.5 - edge, 0.5 + edge, abs(fract(k) - 0.5) * 2.0);
  return vec4f(mix(params.ground.rgb, params.ray.rgb, ray), 1.0);
}
