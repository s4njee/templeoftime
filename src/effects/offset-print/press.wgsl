#include "fullscreen.wgsl"
#include "hash.wgsl"
#include "simplex.wgsl"
#include "print.wgsl"
#include "params.wgsl"

// Offset print (story 2.1): a picture separated into cyan, magenta, yellow and black, each
// screened into halftone dots at its own angle, spread by dot gain, offset by misregistration,
// ragged by the paper's fibres, and laid on paper, the inks multiplying where they overprint.
// The picture is the family's shared picture (src/gpu/picture/), sampled where each plate lands,
// so a misregistered plate prints its own shifted copy; or the printer's tint swatches.

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> spot_table: array<f32>;
@group(0) @binding(2) var picture: texture_2d<f32>;
@group(0) @binding(3) var picture_sampler: sampler;

// The threshold for a coverage t, from the CPU's linearising table (print.ts).
fn print_threshold(t: f32) -> f32 {
  let x = clamp(t, 0.0, 1.0) * 64.0;
  let i = min(63u, u32(x));
  return mix(spot_table[i], spot_table[i + 1u], x - f32(i));
}

// The printer's swatches: rows of cyan, magenta, yellow, black and a grey, from 0 to 100%.
fn swatch_tones(uv: vec2f) -> vec4f {
  let row = u32(clamp(uv.y * 5.0, 0.0, 4.0));
  let t = floor(uv.x * 11.0) / 10.0;
  if (row == 0u) { return vec4f(t, 0.0, 0.0, 0.0); }
  if (row == 1u) { return vec4f(0.0, t, 0.0, 0.0); }
  if (row == 2u) { return vec4f(0.0, 0.0, t, 0.0); }
  if (row == 3u) { return vec4f(0.0, 0.0, 0.0, t); }
  return vec4f(t, t * 0.8, t * 0.8, 0.0);
}

fn tones_at(p: vec2f) -> vec4f {
  let uv = p / vec2f(params.width, params.height);
  if (params.subject == 1u) { return swatch_tones(uv); }
  return print_separate(textureSampleLevel(picture, picture_sampler, uv, 0.0).rgb, params.gcr);
}

@fragment fn press(in: FullscreenVarying) -> @location(0) vec4f {
  let p = in.position.xy;
  // The paper's fibres: fine noise in its tone, and a ragged edge on every dot.
  let fibre = snoise_2d(p * 0.35) * 0.6 + snoise_2d(p * 1.3) * 0.4;
  var colour = params.paper.rgb * (1.0 - 0.025 * fibre);
  let inks = array(params.cyan.rgb, params.magenta.rgb, params.yellow.rgb, params.black.rgb);
  var printed: array<f32, 4>;
  var dots: array<f32, 4>;
  var dotted = 0.0;
  for (var i = 0u; i < 4u; i++) {
    let offset = params.offsets[i].xy;
    var t = tones_at(p + offset)[i];
    // The plate's dot: compensated for gain if the press does, then spread by it on paper.
    if (params.compensate == 1u) { t = print_compensate(t, params.gain); }
    printed[i] = select(print_gain(t, params.gain), 0.0, t <= 0.0);
    let rough = fibre * params.rough * 0.12;
    dots[i] = print_coverage(p + offset, print_threshold(printed[i]), params.angles[i].x, params.pitch, rough);
    if (printed[i] > 0.0 && printed[i] < 1.0) { dotted += params.ink_steps[i]; }
  }
  // A screen is a lattice of dots, which the pattern rule counts: the dots keep only as much
  // contrast as holds the light–dark step under `step`, the rest flattened into each tint's
  // average (screenContrast in print.ts; pop-dots does the same).
  let contrast = select(1.0, min(1.0, params.step / dotted), dotted > 0.0);
  for (var i = 0u; i < 4u; i++) {
    let e = print_flattened(printed[i], dots[i], contrast);
    colour *= mix(vec3f(1.0), inks[i], clamp(e, 0.0, 1.0));
  }
  return vec4f(colour, 1.0);
}
