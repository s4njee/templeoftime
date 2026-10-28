// The airbrush (story 2.5). Twin of src/gpu/airbrush/airbrush.ts. Needs hash.wgsl and
// simplex.wgsl.
//
// An airbrush sprays a cone of paint droplets, so one pass of the hand lays a stroke whose
// density across it is close to a Gaussian. An artist builds a gradient from many overlapping
// passes, more of them at the dark end, never as a linear ramp: the passes wander a little, the
// pressure varies, and paint carries past where the hand stopped (overspray). Paint builds up
// as 1 - exp(-density), so passes over a covered area add less and less. Seen close, the spray
// is droplets: where it is thin, single specks show. A frisket, a mask of film cut with a knife,
// stops the spray dead at its edge: the only hard edges in an airbrush picture.

// Density of one straight stroke from a to b, `width` its standard deviation across.
fn airbrush_stroke(p: vec2f, a: vec2f, b: vec2f, width: f32) -> f32 {
  let ab = b - a;
  let t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-9), 0.0, 1.0);
  let d = length(p - (a + ab * t)) / width;
  return exp(-0.5 * d * d);
}

// A gradient sprayed as `passes` strokes across the direction `dir` (unit), starting at
// `origin` and fading out over `span`: pass k sits at (k + 0.5) / passes of the span, weighted
// by how far it is from the end, each `wobble` of its spacing off a straight line and varying in
// pressure. Density 1 at the origin's end, about. Positions in any one unit.
fn airbrush_ramp(p: vec2f, origin: vec2f, dir: vec2f, span: f32, passes: u32, wobble: f32, seed: f32) -> f32 {
  let u = dot(p - origin, dir);
  let v = dot(p - origin, vec2f(-dir.y, dir.x));
  let spacing = span / f32(passes);
  let sigma = 0.7 * spacing;
  var density = 0.0;
  for (var k = 0u; k < passes; k++) {
    let fk = f32(k);
    let at = (fk + 0.5) * spacing + wobble * spacing * snoise_2d(vec2f(v / (span * 1.3), fk * 3.7 + seed));
    let pressure = 1.0 + 0.25 * wobble * snoise_2d(vec2f(v / (span * 0.7), fk * 5.3 + seed + 11.0));
    let weight = 1.0 - (fk + 0.5) / f32(passes);
    let d = (u - at) / sigma;
    density += weight * pressure * exp(-0.5 * d * d);
  }
  // Normalised so the passes sum to the weight at their own position: about 1 at the origin.
  return density * spacing / (sigma * 2.5066283);
}

// Paint coverage from accumulated density.
fn airbrush_cover(density: f32) -> f32 {
  return 1.0 - exp(-max(density, 0.0));
}

// Coverage c seen as droplets: a share `spatter` c (1 - c) of the cells holds a whole speck, the
// rest the mist, lowered so the mean stays c. `r` is a uniform random number for the cell.
fn airbrush_deposit(c: f32, r: f32, spatter: f32) -> f32 {
  let q = spatter * c * (1.0 - c);
  return select((c - q) / max(1.0 - q, 1e-6), 1.0, r < q);
}

// A frisket's opening from a signed distance (negative inside the cut), anti-aliased over `aa`.
fn airbrush_frisket(d: f32, aa: f32) -> f32 {
  return 1.0 - smoothstep(-aa, aa, d);
}
