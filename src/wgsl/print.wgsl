// print.wgsl -- four-colour process printing (story 2.1). TypeScript twin: src/gpu/print/print.ts;
// tests/print.test.ts checks they agree and that the process does what a press does.
//
//   print_separate(c, gcr) -> vec4f        linear RGB to CMYK tones, black by grey replacement
//   print_spot(uv) -> f32                  the cosine spot function in a screen cell
//   print_coverage(p, t, angle, pitch, threshold) -> f32
//                                          ink coverage at pixel p (anti-aliased over a pixel)
//   print_gain(t, g) -> f32                printed coverage under dot gain g at 50%
//
// The threshold for a tint comes from the CPU (`spotThreshold`), which linearises the spot
// function so a tint of t covers t of the paper.

const PRINT_TAU: f32 = 6.28318530718;

fn print_encode(v: f32) -> f32 {
  return select(1.055 * pow(max(v, 0.0), 1.0 / 2.4) - 0.055, v * 12.92, v <= 0.0031308);
}

fn print_separate(c: vec3f, gcr: f32) -> vec4f {
  let e = clamp(vec3f(print_encode(c.r), print_encode(c.g), print_encode(c.b)), vec3f(0.0), vec3f(1.0));
  let cmy = vec3f(1.0) - e;
  let k = gcr * min(cmy.x, min(cmy.y, cmy.z));
  let rest = 1.0 - k;
  if (rest < 1e-6) { return vec4f(0.0, 0.0, 0.0, 1.0); }
  return vec4f((cmy - vec3f(k)) / rest, k);
}

fn print_spot(uv: vec2f) -> f32 {
  return 0.5 + 0.25 * (cos(PRINT_TAU * uv.x) + cos(PRINT_TAU * uv.y));
}

fn print_gain(t: f32, g: f32) -> f32 {
  return min(1.0, t + 4.0 * g * t * (1.0 - t));
}

// Coverage of one ink at pixel centre p: the spot function against the threshold, softened over
// the spot function's own change across a pixel, so dot edges are anti-aliased at any pitch.
fn print_coverage(p: vec2f, threshold: f32, angle: f32, pitch: f32, rough: f32) -> f32 {
  let c = cos(angle);
  let s = sin(angle);
  let q = vec2f(c * p.x + s * p.y, -s * p.x + c * p.y) / pitch;
  let value = print_spot(fract(q)) + rough;
  let w = max(fwidth(value), 1e-4);
  return 1.0 - smoothstep(threshold - w, threshold + w, value);
}

// The plate coverage that prints as t under gain g: what a press does to compensate.
fn print_compensate(t: f32, g: f32) -> f32 {
  if (g <= 0.0) { return t; }
  let a = -4.0 * g;
  let b = 1.0 + 4.0 * g;
  let disc = max(b * b + 4.0 * a * t, 0.0);
  return clamp((-b + sqrt(disc)) / (2.0 * a), 0.0, 1.0);
}

// A tint t printed as a screen whose dots keep only `contrast` of their edge, the rest flattened
// into the tint's average (story 2.2). Twin of `flattened` in print.ts.
fn print_flattened(t: f32, coverage: f32, contrast: f32) -> f32 {
  return t + contrast * (coverage - t);
}
