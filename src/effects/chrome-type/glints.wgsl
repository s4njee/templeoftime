#include "glint-params.wgsl"

// Star glints (story 6.1): a four-pointed star at a few highlights, the airbrush artist's
// signature on chrome. Bright (HDR, so the tail blooms them) and twinkling, with each star's
// brightness from the band-limited flicker signal on the CPU, so none can flash.

struct Star {
  centre: vec2f,
  size: f32,
  light: f32,
}

@group(0) @binding(0) var<uniform> glint: GlintParams;
@group(0) @binding(1) var<storage, read> stars: array<Star>;

struct Varying {
  @builtin(position) position: vec4f,
  @location(0) local: vec2f,
  @location(1) @interpolate(flat) light: f32,
}

const CORNERS = array(vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0), vec2f(1.0, 1.0));

@vertex fn star_vs(@builtin(vertex_index) v: u32, @builtin(instance_index) i: u32) -> Varying {
  let s = stars[i];
  let c = CORNERS[v];
  let p = s.centre + c * s.size;
  var out: Varying;
  out.position = vec4f(p.x / glint.width * 2.0 - 1.0, 1.0 - p.y / glint.height * 2.0, 0.0, 1.0);
  out.local = c;
  out.light = s.light;
  return out;
}

@fragment fn star_fs(in: Varying) -> @location(0) vec4f {
  let q = abs(in.local);
  // Two thin rays, tapering to their tips, and a small bright core.
  let rays = exp(-q.y * 40.0) * (1.0 - q.x) + exp(-q.x * 40.0) * (1.0 - q.y);
  let core = exp(-dot(q, q) * 60.0);
  let light = (rays * 0.9 + core * 2.0) * in.light;
  return vec4f(vec3f(1.0, 0.97, 0.9) * light, 0.0);
}
