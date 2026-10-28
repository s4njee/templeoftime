#include "fullscreen.wgsl"
#include "chrome.wgsl"
#include "params.wgsl"

// Chrome lettering (story 6.1). The heading's signed distance field (src/gpu/text/) is bevelled
// into a rounded profile; each pixel reflects a horizon, sky above and ground below, with the
// horizon at the letters' mid-height and bent by the bevel's normal, as an airbrush artist painted
// it. A dark outline, a soft drop shadow, specular light on the bevels and a gleam that sweeps
// across now and then. Premultiplied over the backdrop, or over nothing.

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var field: texture_2d<f32>;

fn sd(p: vec2i) -> f32 {
  let size = vec2i(textureDimensions(field));
  return textureLoad(field, clamp(p, vec2i(0), size - 1), 0).r;
}

fn colours() -> ChromeColours {
  return ChromeColours(params.sky_top, params.sky_low, params.line, params.ground_high, params.ground_low);
}

fn over(top: vec4f, under: vec4f) -> vec4f {
  return top + under * (1.0 - top.a);
}

@fragment fn chrome(in: FullscreenVarying) -> @location(0) vec4f {
  let p = vec2i(in.position.xy);
  let d = sd(p);
  // Gradient of d in y-up screen coordinates.
  let grad = vec2f(sd(p + vec2i(1, 0)) - sd(p - vec2i(1, 0)), sd(p - vec2i(0, 1)) - sd(p + vec2i(0, 1))) * 0.5;

  // Backdrop: nothing, black, or the same sunset the chrome reflects, seen straight on.
  var out = vec4f(0.0);
  if (params.backdrop == 1u) {
    out = vec4f(colours().ground_low.rgb * 0.05, 1.0);
  } else if (params.backdrop == 2u) {
    let e = (params.horizon_y - in.position.y) / (0.5 * params.height);
    out = vec4f(chrome_horizon(e * 1.4, colours()) * 0.55, 1.0);
  }

  // Drop shadow: the shape moved down and right, softened.
  let shadow_d = sd(p - vec2i(params.shadow));
  let shadow = (1.0 - smoothstep(-params.outline, params.outline * 3.0, shadow_d)) * 0.55;
  out = over(vec4f(0.0, 0.0, 0.0, shadow), out);

  // The dark outline, just outside the letters.
  let outline = 1.0 - smoothstep(params.outline - 0.75, params.outline + 0.75, d);
  out = over(vec4f(vec3f(0.012, 0.01, 0.02), 1.0) * outline, out);

  // The chrome.
  let n = chrome_normal(d, grad, params.bevel);
  // Reflected direction's vertical component: 2 nz ny for a view straight down the z axis.
  let bend = 2.0 * n.z * n.y;
  let e = (params.mid_y - in.position.y) / params.half_cap + params.bend * bend;
  var colour = chrome_horizon(e, colours());
  // Light from the upper left on the bevels, and the gleam sweeping across.
  let light = normalize(vec3f(-0.55, 0.65, 0.5));
  colour += vec3f(pow(max(dot(n, light), 0.0), 48.0)) * 1.6 * step(0.02, 1.0 - n.z);
  let gleam = exp(-pow((in.position.x - params.gleam_x + 0.5 * (in.position.y - params.mid_y)) / params.gleam_width, 2.0));
  colour += vec3f(gleam * params.gleam);
  let coverage = 1.0 - smoothstep(-0.75, 0.75, d);
  return over(vec4f(colour, 1.0) * coverage, out);
}
