#include "fullscreen.wgsl"
#include "hash.wgsl"
#include "simplex.wgsl"
#include "sdf.wgsl"
#include "params.wgsl"

// A faded print (story 2.6). Twin of src/gpu/photo/fade.ts: the picture's densities, the dye
// amounts that print them (the inverse of the dyes' absorptions), each dye thinned by what is
// left of it after the years, the stained base added, and back to reflectance. The print has a
// white border and rounded corners and lies on an album page. `method` 1 shows CSS's filter
// version instead, and 2 splits the two, CSS on the left.

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var picture: texture_2d<f32>;
@group(0) @binding(2) var picture_sampler: sampler;

fn print_dyes(c: vec3f) -> vec3f {
  let base = params.base_fresh.rgb;
  let d = clamp(-log2(max(c, vec3f(1e-4))) * 0.30103, base, vec3f(params.dmax)) - base;
  let inverse = mat3x3f(params.inverse_0.xyz, params.inverse_1.xyz, params.inverse_2.xyz);
  return max(transpose(inverse) * d, vec3f(0.0));
}

fn print_aged(c: vec3f) -> vec3f {
  let dyes = print_dyes(c) * params.left.rgb;
  let absorb = mat3x3f(params.dyes_0.xyz, params.dyes_1.xyz, params.dyes_2.xyz);
  let d = params.base_aged.rgb + transpose(absorb) * dyes;
  return exp2(-d * 3.3219281);
}

fn encode(v: vec3f) -> vec3f {
  return select(1.055 * pow(max(v, vec3f(0.0)), vec3f(1.0 / 2.4)) - 0.055, v * 12.92, v <= vec3f(0.0031308));
}
fn decode(v: vec3f) -> vec3f {
  return select(pow((v + 0.055) / 1.055, vec3f(2.4)), v / 12.92, v <= vec3f(0.04045));
}

// `filter: sepia(a) hue-rotate(h)`, as Filter Effects 1 defines them, on sRGB-encoded values as
// Chrome applies them (The Hero's Journey measured this), clamped after each.
fn css_filter(c: vec3f) -> vec3f {
  let a = params.css_sepia;
  let e = encode(c);
  let s = clamp(vec3f(
    dot(e, vec3f(0.393 + 0.607 * (1.0 - a), 0.769 - 0.769 * (1.0 - a), 0.189 - 0.189 * (1.0 - a))),
    dot(e, vec3f(0.349 - 0.349 * (1.0 - a), 0.686 + 0.314 * (1.0 - a), 0.168 - 0.168 * (1.0 - a))),
    dot(e, vec3f(0.272 - 0.272 * (1.0 - a), 0.534 - 0.534 * (1.0 - a), 0.131 + 0.869 * (1.0 - a)))
  ), vec3f(0.0), vec3f(1.0));
  let co = cos(params.css_hue);
  let si = sin(params.css_hue);
  let h = clamp(vec3f(
    dot(s, vec3f(0.213 + co * 0.787 - si * 0.213, 0.715 - co * 0.715 - si * 0.715, 0.072 - co * 0.072 + si * 0.928)),
    dot(s, vec3f(0.213 - co * 0.213 + si * 0.143, 0.715 + co * 0.285 + si * 0.14, 0.072 - co * 0.072 - si * 0.283)),
    dot(s, vec3f(0.213 - co * 0.213 - si * 0.787, 0.715 - co * 0.715 + si * 0.715, 0.072 + co * 0.928 + si * 0.072))
  ), vec3f(0.0), vec3f(1.0));
  return decode(h);
}

@fragment fn fade(in: FullscreenVarying) -> @location(0) vec4f {
  let size = vec2f(params.width, params.height);
  let p = in.position.xy;
  // The print: inset from the view, a white border, rounded corners.
  let margin = 0.05 * size.y;
  let half = size * 0.5 - vec2f(margin);
  let print_d = sd_rounded_box_2d(p - size * 0.5, half, 0.012 * size.y);
  let border = 0.045 * size.y;
  let image_d = sd_box_2d(p - size * 0.5, half - vec2f(border));
  // The picture, mapped into the image area.
  let image_min = vec2f(margin + border);
  let uv = clamp((p - image_min) / (size - 2.0 * image_min), vec2f(0.0), vec2f(1.0));
  var c = textureSampleLevel(picture, picture_sampler, uv, 0.0).rgb;
  // The emulsion's grain: a little density noise.
  c *= 1.0 + params.grain * snoise_2d(p * 0.6 / params.css);
  // The border is the bare base.
  let paper = exp2(-params.base_fresh.rgb * 3.3219281);
  c = select(c, paper, image_d > 0.0);
  let use_css = params.method == 1u || (params.method == 2u && in.uv.x < 0.5);
  var out = select(print_aged(c), css_filter(c), use_css);
  // The album page around the print, and a soft shadow under it.
  let page = vec3f(0.035, 0.03, 0.025) * (1.0 - 0.6 * exp(-max(print_d, 0.0) / (0.01 * size.y)));
  out = mix(out, page, smoothstep(-1.0, 1.0, print_d));
  // The split's divide.
  if (params.method == 2u) {
    out = mix(out, vec3f(0.9), 1.0 - smoothstep(0.0, 1.5 * params.css, abs(p.x - size.x * 0.5)));
  }
  return vec4f(out, 1.0);
}
