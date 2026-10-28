// The family's generated pictures (src/gpu/picture/), the subjects the print and photograph
// processes work on until a page hands over its own image (story 8.4). Each is a pure function of
// position: `uv` is (0, 0) top-left to (1, 1) bottom-right, `aspect` the view's width over its
// height, `css` device pixels per CSS pixel. Linear RGB out.
//
// Needs hash.wgsl and simplex.wgsl.

// A poster: a sky from orange to blue, a sun with three bands cut across its foot, a sea with
// the sun's broken path, two headlands. (Three: four or five, in a sun this size, already read
// as more than five light–dark pairs over a 10° field, which the pattern rule counts.)
fn picture_poster(uv: vec2f, aspect: f32) -> vec3f {
  let y = 1.0 - uv.y;
  var c = mix(vec3f(0.95, 0.45, 0.12), vec3f(0.08, 0.2, 0.55), smoothstep(0.35, 1.0, y));
  let sun_p = (uv - vec2f(0.5, 0.48)) * vec2f(aspect, 1.0);
  let sun = 1.0 - smoothstep(0.17, 0.175, length(sun_p));
  let band = (0.57 - y) / 0.05;
  let gap = select(0.0, 1.0, band > 0.0 && band < 3.0 && fract(band) > 0.72 - 0.12 * floor(band));
  c = mix(c, vec3f(1.0, 0.85, 0.25), sun * (1.0 - gap));
  if (y < 0.42) {
    c = mix(vec3f(0.02, 0.12, 0.3), vec3f(0.1, 0.35, 0.55), smoothstep(0.0, 0.42, y));
    let glitter = smoothstep(0.1, 0.6, snoise_2d(vec2f(uv.x * 40.0, y * 70.0)));
    let path = (1.0 - smoothstep(0.02, 0.1, abs(sun_p.x))) * glitter * smoothstep(0.1, 0.42, y);
    c = mix(c, vec3f(1.0, 0.75, 0.3), path * 0.8);
  }
  let left = 0.58 * smoothstep(0.42, 0.0, uv.x) + 0.015 * snoise_2d(vec2f(uv.x * 9.0, 1.0));
  let right = 0.5 * smoothstep(0.62, 1.0, uv.x) + 0.015 * snoise_2d(vec2f(uv.x * 7.0, 5.0));
  if (y < max(left, right)) {
    c = vec3f(0.06, 0.08, 0.05);
  }
  return c;
}

// A holiday snapshot: sky and clouds, a headland, the sea, a beach with a striped umbrella, its
// shadow, a green towel and a red ball. Every hue a dye or an ink can lose, and soft light.
fn picture_snapshot(uv: vec2f, aspect: f32) -> vec3f {
  let p = vec2f(uv.x * aspect, uv.y);
  let horizon = 0.5;
  // Sky: deep blue overhead to a pale haze at the horizon, with soft clouds.
  var c = mix(vec3f(0.5, 0.66, 0.85), vec3f(0.1, 0.25, 0.68), smoothstep(horizon, 0.0, uv.y));
  let cloud = smoothstep(0.15, 0.7, snoise_2d(p * vec2f(2.2, 6.0) + vec2f(3.0, 1.0)) * 0.6 + snoise_2d(p * 7.0) * 0.25);
  c = mix(c, vec3f(0.92, 0.92, 0.94), cloud * smoothstep(horizon, 0.15, uv.y) * 0.85);
  // A headland on the left, green going grey with distance.
  let ridge = horizon - 0.11 * smoothstep(0.42 * aspect, 0.0, p.x) - 0.012 * snoise_2d(vec2f(p.x * 6.0, 2.0));
  if (uv.y > ridge && uv.y < horizon) {
    c = mix(vec3f(0.18, 0.3, 0.2), vec3f(0.32, 0.42, 0.45), smoothstep(ridge, horizon, uv.y) * 0.5);
  }
  // The sea: blue-green, with long low ripples.
  let shore = 0.64 + 0.02 * sin(p.x * 3.0 + 1.0);
  if (uv.y >= horizon && uv.y < shore) {
    let ripple = snoise_2d(vec2f(p.x * 3.0, uv.y * 90.0)) * 0.5 + 0.5;
    c = mix(vec3f(0.04, 0.2, 0.36), vec3f(0.06, 0.36, 0.42), smoothstep(horizon, shore, uv.y));
    c = mix(c, vec3f(0.6, 0.72, 0.75), ripple * 0.12);
    c = mix(c, vec3f(0.85, 0.9, 0.88), smoothstep(shore - 0.012, shore, uv.y));
  }
  // Sand, warmer and darker towards the camera.
  if (uv.y >= shore) {
    c = mix(vec3f(0.78, 0.62, 0.4), vec3f(0.56, 0.38, 0.2), smoothstep(shore, 1.0, uv.y));
    c *= 1.0 + 0.06 * snoise_2d(p * 40.0);
  }
  // The umbrella's shadow, then a towel and a ball on the sand.
  let pole = vec2f(0.36 * aspect, 0.0);
  let shadow = length((p - vec2f(pole.x + 0.08, 0.86)) * vec2f(1.0, 3.2));
  c *= mix(0.55, 1.0, smoothstep(0.17, 0.2, shadow));
  let towel = sd_rounded_box_2d(p - vec2f(0.72 * aspect, 0.85), vec2f(0.15, 0.05), 0.01);
  // Its weave is noise, not stripes: a copier or a stencil would harden stripes into a grating.
  c = mix(c, vec3f(0.08, 0.42, 0.12) * (0.92 + 0.08 * snoise_2d(p * 300.0)), 1.0 - smoothstep(0.0, 0.003, towel));
  let ball_p = p - vec2f(0.55 * aspect, 0.9);
  let ball = length(ball_p);
  let lit = clamp(0.6 - dot(ball_p / 0.04, vec2f(0.6, 0.6)) * 0.4, 0.3, 1.2);
  c = mix(c, vec3f(0.85, 0.12, 0.06) * lit, 1.0 - smoothstep(0.04, 0.043, ball));
  // The umbrella: a pole, and a canopy of six segments in red and yellow.
  let pole_d = sd_segment_2d(p, vec2f(pole.x, 0.42), vec2f(pole.x, 0.86));
  c = mix(c, vec3f(0.85, 0.85, 0.8), 1.0 - smoothstep(0.003, 0.005, pole_d));
  let q = (p - vec2f(pole.x, 0.44)) / vec2f(0.2, 0.09);
  if (q.y < 0.0 && length(q) < 1.0) {
    let segment = u32(floor((atan2(-q.y, q.x) / 3.14159265) * 6.0));
    let shade = 0.75 + 0.25 * sqrt(max(0.0, 1.0 - dot(q, q)));
    let red = vec3f(0.82, 0.08, 0.06);
    let yellow = vec3f(0.92, 0.7, 0.08);
    c = select(yellow, red, segment % 2u == 0u) * shade;
  }
  return c;
}

// A club flyer, typeset and greeked into word-shaped blocks: a headline of two lines, a large
// photograph, three short captions and a line along the foot. `css` is device pixels per CSS
// pixel, so the type is a real size. A reflectance; the photograph is the snapshot in grey.
// No block of type has more than three lines: a column of body text is a grating of stripes,
// which the pattern rule counts like any other.
fn picture_page(uv: vec2f, aspect: f32, size: vec2f, css: f32) -> vec3f {
  let px = uv * size / css;
  let w = size.x / css;
  let h = size.y / css;
  let margin = max(24.0, w * 0.05);
  var ink = 0.0;
  // Words: a line cut into cells, each inked or a space by chance, so words run irregularly.
  let words = fn_words(px, margin, w - margin, margin, 64.0, 2.0, 30.0, 1.0);
  ink = max(ink, words);
  let head_bottom = margin + 2.0 * 64.0;
  // The photograph, below the headline on the left.
  let photo_min = vec2f(margin, head_bottom + 16.0);
  let photo_max = vec2f(w * 0.6, h - margin - 44.0);
  var colour = vec3f(1.0);
  if (all(px > photo_min) && all(px < photo_max)) {
    let local = (px - photo_min) / (photo_max - photo_min);
    let photo = picture_snapshot(local, (photo_max.x - photo_min.x) / (photo_max.y - photo_min.y));
    // Printed light, as a flyer's photo was screened for copying: dark only where it is dark.
    colour = vec3f(sqrt(dot(photo, vec3f(0.2126, 0.7152, 0.0722))));
  }
  // Three captions on the right, three lines each, well apart.
  let left = w * 0.64;
  let gap = max(60.0, (photo_max.y - photo_min.y) / 3.0);
  for (var k = 0u; k < 3u; k++) {
    let top = photo_min.y + f32(k) * gap;
    ink = max(ink, fn_words(px, left, w - margin, top, 16.0, 3.0, 12.0, 0.45 + f32(k)));
  }
  // The foot: one line of larger type.
  ink = max(ink, fn_words(px, margin, w - margin, h - margin - 26.0, 26.0, 1.0, 18.0, 7.0));
  let paper = vec3f(0.92, 0.91, 0.88);
  return mix(paper * colour, vec3f(0.03), ink);
}

// Greeked type: `lines` lines of `leading` px from `top`, between x0 and x1, letters `x_height`
// of the leading tall, words of cells `cell` px wide inked by chance.
fn fn_words(px: vec2f, x0: f32, x1: f32, top: f32, leading: f32, lines: f32, cell: f32, seed: f32) -> f32 {
  let line = floor((px.y - top) / leading);
  if (px.y < top || line >= lines || px.x < x0 || px.x > x1) { return 0.0; }
  let ly = fract((px.y - top) / leading);
  if (ly < 0.2 || ly > 0.75) { return 0.0; }
  // The last line ends early, ragged.
  let end = select(x1, x0 + (x1 - x0) * (0.4 + 0.4 * hash_2to1(vec2f(line, seed))), line == lines - 1.0);
  if (px.x > end) { return 0.0; }
  let c = floor((px.x - x0) / cell);
  let inside = fract((px.x - x0) / cell);
  let on = hash_2to1(vec2f(c, line * 7.0 + seed * 13.0)) > 0.3;
  // A space between words: a cell left empty, and a hairline gap between letters' cells.
  return select(0.0, 1.0, on && inside < 0.92);
}
