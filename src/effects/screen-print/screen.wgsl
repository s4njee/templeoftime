#include "fullscreen.wgsl"
#include "hash.wgsl"
#include "simplex.wgsl"
#include "print.wgsl"
#include "params.wgsl"

// A silkscreen print (story 2.3). Each ink is its own pass through its own stencil, so each is
// placed by hand and lands a little off the others. The stencils come from the picture
// posterised by lightness: the first, lightest ink covers everything darker than its threshold,
// the next a smaller, darker area, and the darkest goes on last. Screen inks are nearly opaque,
// so a later pass covers an earlier one. A pass is uneven: the squeegee starves the ink in
// streaks along its pull, the mesh leaves the ink's edge ragged, and dust leaves pinholes.

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var picture: texture_2d<f32>;
@group(0) @binding(2) var picture_sampler: sampler;

fn tone_at(p: vec2f) -> f32 {
  let c = textureSampleLevel(picture, picture_sampler, p / vec2f(params.width, params.height), 0.0).rgb;
  return print_encode(dot(c, vec3f(0.2126, 0.7152, 0.0722)));
}

// The stencil is cut from a softened picture: a few CSS pixels, as a hand-cut or photo stencil
// holds no finer detail.
fn soft_tone(p: vec2f) -> f32 {
  let r = params.soften;
  var sum = tone_at(p) * 2.0;
  for (var k = 0u; k < 6u; k++) {
    let a = f32(k) * 1.0471976;
    sum += tone_at(p + vec2f(cos(a), sin(a)) * r);
  }
  return sum / 8.0;
}

@fragment fn screen(in: FullscreenVarying) -> @location(0) vec4f {
  let p = in.position.xy;
  let css = params.css;
  // Cream stock with a little tooth.
  var colour = params.paper.rgb * (1.0 - 0.025 * snoise_2d(p * 0.4 / css));
  for (var k = 0u; k < params.layers; k++) {
    let q = p + params.offsets[k].xy;
    let seed = f32(k) * 17.3;
    // The mesh: the stencil's edge wanders by about a CSS pixel.
    let ragged = vec2f(snoise_2d(q * 0.5 / css + seed), snoise_2d(q * 0.5 / css + seed + 31.0)) * css;
    let threshold = params.thresholds[k].x;
    let t = soft_tone(q + ragged);
    let edge = 0.6 * fwidth(t);
    let open = 1.0 - smoothstep(threshold - edge, threshold + edge, t);
    // The squeegee: ink starved in broad, faint bands along the pull (downwards).
    let streak = snoise_2d(vec2f(q.x * 0.006 / css + seed, q.y * 0.0008 / css));
    let starve = smoothstep(0.45, 0.95, streak) * params.starve;
    // Ink texture: thickness varies a little, and dust leaves pinholes.
    let mottle = snoise_2d(q * 0.08 / css + seed) * 0.5 + 0.5;
    let pinhole = step(0.9985, hash_2to1(floor(q / css) + seed));
    let laid = open * (1.0 - starve * mottle) * (1.0 - pinhole) * params.opacity;
    let ink = params.inks[k].rgb * (1.0 + 0.06 * (mottle - 0.5));
    colour = mix(colour, ink, laid);
  }
  return vec4f(colour, 1.0);
}
