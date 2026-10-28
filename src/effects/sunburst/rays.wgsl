#include "fullscreen.wgsl"
#include "params.wgsl"

// The Art Deco sunburst (story 3.1): rays from a point, alternating ray and gap, tapered so they
// widen outwards, and stepped into tiers, as on 1920s-30s doors, radio grilles and lift panels.
// The rays turn slowly. Colours come from the CPU already in the luminance step the pattern rule
// allows at this dose (ray and gap are a radial pattern of `rays` pairs): see index.ts.

@group(0) @binding(0) var<uniform> params: Params;

const TAU: f32 = 6.28318530718;

@fragment fn rays(in: FullscreenVarying) -> @location(0) vec4f {
  // Centred on the burst's origin, in heights of the view, y up.
  let p = vec2f((in.uv.x - params.origin.x) * params.aspect, params.origin.y - in.uv.y) * 2.0;
  let r = length(p);
  let a = atan2(p.y, p.x) + params.spin;
  // Which ray: the angle in ray units, so a ray is [0, 0.5) of each unit and a gap [0.5, 1).
  let k = a / TAU * params.rays;
  let within = fract(k);
  // Tapered rays: a ray's half-width grows from `taper` of its unit at the centre to a quarter
  // (so ray and gap are equal) at the rim.
  let share = mix(params.taper, 0.25, smoothstep(0.0, 1.4, r));
  let edge = fwidth(k) * 0.75;
  let ray = smoothstep(0.5 - share - edge, 0.5 - share + edge, within) - smoothstep(0.5 + share - edge, 0.5 + share + edge, within);
  // Tiers: concentric steps, each a little lighter outwards, with a fine line at each step.
  let tier = floor(r / params.tier);
  let fr = fract(r / params.tier);
  let to_step = min(fr, 1.0 - fr) * params.tier;
  let step_line = 1.0 - smoothstep(0.0, fwidth(r) * 1.5, to_step);
  // Each tier a little nearer the full ray colour outwards: between ground and ray, so no tier
  // has a larger step from the ground than the ray itself.
  let tier_mix = min(1.0, 0.8 + 0.05 * tier);
  // The centre: a solid disc, the sun itself.
  let sun = 1.0 - smoothstep(params.sun - fwidth(r), params.sun + fwidth(r), r);
  var colour = mix(params.ground.rgb, mix(params.ground.rgb, params.ray.rgb, tier_mix), ray);
  colour = mix(colour, params.ray.rgb, step_line * params.lines * 0.5);
  colour = mix(colour, params.ray.rgb, sun);
  return vec4f(colour, 1.0);
}
