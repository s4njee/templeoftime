#include "fullscreen.wgsl"
#include "hash.wgsl"
#include "simplex.wgsl"
#include "params.wgsl"

// One generation of a photocopy (story 2.4): the copier images the original through its optics
// (a blur), not quite square or to scale (the original lies a little skewed on the glass, and
// 100% is never exact), charges the drum where the original is dark, and fuses toner there:
// a threshold, so a grey either prints black or does not. Toner also lands where it should not
// (specks, and streaks where the drum is scratched or dirty) and misses where it should land
// (dropouts). The output is a reflectance; the next generation copies it.

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var original: texture_2d<f32>;
@group(0) @binding(2) var original_sampler: sampler;

// The original's reflectance at a framebuffer point. Off the original is the copier's lid: dark
// when it was left open, as on many a flyer, or white.
fn original_at(p: vec2f) -> f32 {
  let uv = p / vec2f(params.width, params.height);
  if (any(uv < vec2f(0.0)) || any(uv > vec2f(1.0))) { return params.lid; }
  let c = textureSampleLevel(original, original_sampler, uv, 0.0).rgb;
  return dot(c, vec3f(0.2126, 0.7152, 0.0722));
}

@fragment fn copy(in: FullscreenVarying) -> @location(0) vec4f {
  let p = in.position.xy;
  let css = params.css;
  let centre = vec2f(params.width, params.height) * 0.5;
  // Where this point of the copy looks on the original: skewed, scaled and shifted.
  let c = cos(params.skew);
  let s = sin(params.skew);
  let d = (p - centre) / params.scale;
  let q = centre + vec2f(c * d.x - s * d.y, s * d.x + c * d.y) + params.shift;
  // The optics: a small disc of samples.
  var seen = original_at(q) * 2.0;
  for (var k = 0u; k < 6u; k++) {
    let a = f32(k) * 1.0471976 + 0.5;
    seen += original_at(q + vec2f(cos(a), sin(a)) * params.blur);
  }
  seen /= 8.0;
  // Toner: a steep threshold on what the drum saw, with a little noise in the charge.
  let charge = seen + snoise_2d(p * 0.25 / css + params.seed) * 0.03;
  var toner = 1.0 - smoothstep(params.threshold - params.contrast, params.threshold + params.contrast, charge);
  // Specks where there should be none, dropouts where there should be toner, each a CSS pixel.
  let cell = floor(p / css);
  let h = hash_3to1(vec3f(cell, params.seed));
  toner = max(toner, step(1.0 - params.specks, h));
  toner *= 1.0 - step(1.0 - params.dropouts, hash_3to1(vec3f(cell, params.seed + 7.0)));
  // The drum: a few thin streaks down the page (the paper's feed), and a faint grey band.
  let x = p.x / css;
  let scratch = step(0.985, hash_2to1(vec2f(floor(x / 1.5), params.seed))) * params.streaks;
  let band = smoothstep(0.6, 0.95, snoise_2d(vec2f(x * 0.01, params.seed))) * 0.18 * params.streaks;
  toner = max(toner, max(scratch * (0.6 + 0.4 * snoise_2d(vec2f(x, p.y * 0.02 / css))), band));
  let paper = params.paper;
  let reflectance = mix(paper, params.toner, clamp(toner, 0.0, 1.0));
  return vec4f(vec3f(reflectance), 1.0);
}

// The last copy, on its paper: reflectance to colour.
@fragment fn present(in: FullscreenVarying) -> @location(0) vec4f {
  let r = textureSampleLevel(original, original_sampler, in.uv, 0.0).r;
  let t = clamp((params.paper - r) / max(params.paper - params.toner, 1e-3), 0.0, 1.0);
  return vec4f(mix(params.paper_colour.rgb, params.toner_colour.rgb, t), 1.0);
}
