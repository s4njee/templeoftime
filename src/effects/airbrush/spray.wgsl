#include "fullscreen.wgsl"
#include "hash.wgsl"
#include "simplex.wgsl"
#include "sdf.wgsl"
#include "airbrush.wgsl"
#include "params.wgsl"

// An airbrushed sunset (story 2.5), in the order an illustrator sprays it. Each layer is a
// frisket (where paint may go) and a gradient of passes through it, laid over the board as
// nearly opaque paint. `progress` (one per layer) is how much of the layer's passes have been
// sprayed: 1 when the picture is finished, rising pass by pass when it sprays itself in.

@group(0) @binding(0) var<uniform> params: Params;

// Paint of `colour` laid over `under`, from density through the frisket, as droplets.
fn spray(under: vec3f, colour: vec3f, density: f32, opening: f32, p: vec2f, layer: f32) -> vec3f {
  let c = airbrush_cover(density) * opening;
  let r = hash_3to1(vec3f(floor(p / params.droplet), layer));
  return mix(under, colour, airbrush_deposit(c, r, params.spatter));
}

// How much of a ramp of `passes` the hand has sprayed: passes from the dark end first.
fn sprayed(ramp_density: f32, progress: f32) -> f32 {
  return ramp_density * smoothstep(0.0, 1.0, progress);
}

@fragment fn paint(in: FullscreenVarying) -> @location(0) vec4f {
  let px = in.position.xy;
  // The picture in heights of the view, y down, x centred.
  let p = vec2f((in.uv.x - 0.5) * params.aspect, in.uv.y);
  let aa = 1.0 / params.height;
  let horizon = 0.62;
  let w = params.wobble;
  var colour = params.board.rgb;

  // 1. The sky, through a frisket over everything above the horizon: violet from the top.
  let sky_open = airbrush_frisket(p.y - horizon, aa);
  let sky = airbrush_ramp(p, vec2f(0.0, 0.0), vec2f(0.0, 1.0), horizon * 1.05, 10u, w, 1.0);
  colour = spray(colour, params.sky.rgb, sprayed(3.4 * sky, params.progress_a.x), sky_open, px, 1.0);
  // 2. The glow, sprayed up from the horizon over the same frisket.
  let glow = airbrush_ramp(p, vec2f(0.0, horizon), vec2f(0.0, -1.0), 0.42, 8u, w, 2.0);
  colour = spray(colour, params.glow.rgb, sprayed(2.2 * glow, params.progress_a.y), sky_open, px, 2.0);

  // 3. The sun: a frisket cut as a disc with bands across its lower half, yellow sprayed flat,
  // then orange up from its foot.
  let centre = vec2f(0.0, horizon - 0.2);
  let radius = 0.22;
  let disc = sd_circle(p - centre, radius);
  let band_y = (p.y - (centre.y - 0.02)) / 0.05;
  let gap = select(0.0, 1.0, band_y > 0.0 && fract(band_y) > 0.8 - 0.12 * floor(band_y));
  let sun_open = airbrush_frisket(disc, aa) * (1.0 - gap) * sky_open;
  colour = spray(colour, params.sun_top.rgb, 3.0 * smoothstep(0.0, 1.0, params.progress_a.z), sun_open, px, 3.0);
  let sun_foot = airbrush_ramp(p, vec2f(0.0, centre.y + radius), vec2f(0.0, -1.0), radius * 1.6, 8u, w, 3.0);
  colour = spray(colour, params.sun_low.rgb, sprayed(2.4 * sun_foot, params.progress_a.z), sun_open, px, 4.0);

  // 4. The mountains: a frisket cut along a ridge, sprayed flat in their mid-tone, dark sprayed
  // up from the bottom, then a rim of light along the ridge, sprayed down from it inside the
  // same cut.
  let ridge = horizon - 0.06 - 0.12 * abs(sin(p.x * 2.3 + 0.6)) * smoothstep(0.2, 1.0, abs(p.x) * 1.4) - 0.025 * snoise_2d(vec2f(p.x * 5.0, 3.0));
  let mountain = p.y - ridge;
  let land_open = airbrush_frisket(-mountain, aa);
  let land = airbrush_ramp(p, vec2f(0.0, 1.0), vec2f(0.0, -1.0), 1.0 - ridge + 0.1, 8u, w, 5.0);
  colour = spray(colour, params.land_mid.rgb, sprayed(5.0, params.progress_a.w), land_open, px, 5.0);
  colour = spray(colour, params.land.rgb, sprayed(3.0 * land, params.progress_a.w), land_open, px, 7.0);
  let rim = exp(-mountain / 0.018) * (0.7 + 0.3 * snoise_2d(vec2f(p.x * 8.0, 9.0)));
  colour = spray(colour, params.rim.rgb, sprayed(1.4 * rim, params.progress_b.x), land_open, px, 6.0);

  // The board's own grain, faint.
  colour *= 1.0 - 0.012 * snoise_2d(px * 0.5 / params.css);
  return vec4f(colour, 1.0);
}

