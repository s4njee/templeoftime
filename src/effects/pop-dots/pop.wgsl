#include "fullscreen.wgsl"
#include "hash.wgsl"
#include "simplex.wgsl"
#include "print.wgsl"
#include "params.wgsl"

// Ben-Day dots (story 2.2): the comic book's colour process. The picture is separated into
// cyan, magenta and yellow and each ink posterised to a colourist's few tints: none, a light
// screen, a heavy screen, or solid. A tint is a screen of even dots at the ink's angle. A screen
// is a lattice, which the pattern rule counts, so its dots keep only as much contrast as holds
// the light–dark step under `step`, the rest flattened into the tint's average colour: the
// dotted inks' steps at a point add at most, so their sum sets it (screenContrast, print.ts). Black is the line plate: heavy contours where the picture has an
// edge, and solid black in its darkest parts. Every plate is a little out of register.

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var picture: texture_2d<f32>;
@group(0) @binding(2) var picture_sampler: sampler;

fn picture_at(p: vec2f) -> vec3f {
  return textureSampleLevel(picture, picture_sampler, p / vec2f(params.width, params.height), 0.0).rgb;
}

// The picture softened first, over a few CSS pixels: a colourist flats areas, not grain.
fn soft_at(p: vec2f) -> vec3f {
  let r = 3.0 * params.css;
  var sum = picture_at(p) * 2.0;
  for (var k = 0u; k < 6u; k++) {
    let a = f32(k) * 1.0471976;
    let d = vec2f(cos(a), sin(a)) * r;
    sum += picture_at(p + d) + picture_at(p + 2.2 * vec2f(-d.y, d.x));
  }
  return sum / 14.0;
}

// The picture barely softened, for the line plate's contours: an inker follows the drawing.
fn line_at(p: vec2f) -> vec3f {
  let r = params.css;
  return (picture_at(p) * 2.0 + picture_at(p + vec2f(r, 0.0)) + picture_at(p - vec2f(r, 0.0)) + picture_at(p + vec2f(0.0, r)) + picture_at(p - vec2f(0.0, r))) / 6.0;
}

// Perceptual lightness, for edges and blacks.
fn tone(c: vec3f) -> f32 {
  return print_encode(dot(c, vec3f(0.2126, 0.7152, 0.0722)));
}

// A tone posterised to the tints: 0, the light screen, the heavy screen, or solid (1). A
// colourist flats a strong colour solid, so anything past half a tone is solid.
fn tint(t: f32) -> f32 {
  if (t < params.light * 0.5) { return 0.0; }
  if (t < (params.light + params.heavy) * 0.5) { return params.light; }
  if (t < params.solid) { return params.heavy; }
  return 1.0;
}

@fragment fn pop(in: FullscreenVarying) -> @location(0) vec4f {
  let p = in.position.xy;
  let fibre = snoise_2d(p * 0.3 / params.css) * 0.6 + snoise_2d(p * 1.1 / params.css) * 0.4;
  var colour = params.paper.rgb * (1.0 - 0.03 * fibre);
  let solids = array(params.cyan.rgb, params.magenta.rgb, params.yellow.rgb);
  var tints: array<f32, 3>;
  var screens: array<f32, 3>;
  var dotted = 0.0;
  for (var i = 0u; i < 3u; i++) {
    let q = p + params.offsets[i].xy;
    let t = tint(print_separate(soft_at(q), 0.0)[i]);
    // Coverage is found for every ink, so its fwidth stays in uniform control flow.
    let threshold = select(params.thresholds.y, params.thresholds.x, t == params.light);
    tints[i] = t;
    screens[i] = print_coverage(q, threshold, params.angles[i].x, params.pitch, fibre * 0.04);
    if (t > 0.0 && t < 1.0) { dotted += params.ink_steps[i]; }
  }
  let contrast = select(1.0, min(1.0, params.step / dotted), dotted > 0.0);
  for (var i = 0u; i < 3u; i++) {
    let t = tints[i];
    let e = select(print_flattened(t, screens[i], contrast), t, t <= 0.0 || t >= 1.0);
    colour *= mix(vec3f(1.0), solids[i], e);
  }
  // The black plate: contours where the softened picture's lightness changes fast, and spotted
  // blacks where it is darkest.
  let q = p + params.offsets[3].xy;
  let d = params.line;
  let gx = tone(line_at(q + vec2f(d, 0.0))) - tone(line_at(q - vec2f(d, 0.0)));
  let gy = tone(line_at(q + vec2f(0.0, d))) - tone(line_at(q - vec2f(0.0, d)));
  let edge = smoothstep(params.edge * 0.7, params.edge * 1.3, length(vec2f(gx, gy)));
  let dark = 1.0 - smoothstep(params.black - 0.02, params.black + 0.02, tone(soft_at(q)));
  let black = max(edge, dark) * (1.0 - 0.15 * smoothstep(0.3, 0.9, fibre));
  colour = mix(colour, colour * params.black_ink.rgb, black);
  return vec4f(colour, 1.0);
}
