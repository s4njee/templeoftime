// chrome.wgsl -- airbrushed chrome by horizon reflection (story 6.1).
//
// An airbrush artist painting chrome lettering paints a reflection of a horizon: sky above, a
// hard bright line, dark ground below that warms towards the bottom. The horizon runs across the
// middle of each letter and bends where the surface turns, at the bevels. So here:
//
//   chrome_normal(d, grad, bevel)   the normal of a quarter-round bevel `bevel` px wide on a shape
//                                   whose signed distance is d (px, negative inside), grad = ∇d
//   chrome_horizon(e, colours)      the environment at elevation e: sky above 0, ground below
//
// and a caller looks up chrome_horizon(height in the letter + bend * reflected direction).

struct ChromeColours {
  sky_top: vec4f,
  sky_low: vec4f,
  line: vec4f,
  ground_high: vec4f,
  ground_low: vec4f,
}

// Normal of a quarter-round bevel: height rises as sqrt(1 - (1 - u)^2) over the first `bevel` px
// inside the edge (u from 0 at the edge to 1), then stays flat. y up.
fn chrome_normal(d: f32, grad: vec2f, bevel: f32) -> vec3f {
  let u = clamp(-d / max(bevel, 1e-3), 0.0, 1.0);
  let r = 1.0 - u;
  let slope = r / max(sqrt(max(1.0 - r * r, 0.0)), 0.08);
  // Height rises inwards, against the outward gradient of d. Where the gradient's magnitude
  // collapses (|∇d| is 1 almost everywhere, and falls only on the shape's medial axis, where two
  // edges' distances meet in a crease), the bevel fades to flat: there the normal would flip from
  // one side of the crease to the other in a pixel, and speckle.
  let crease = smoothstep(0.35, 0.8, length(grad));
  let g = -normalize(grad + vec2f(1e-6)) * slope * select(0.0, 1.0, u < 1.0) * crease;
  return normalize(vec3f(-g, 1.0));
}

fn chrome_horizon(e: f32, c: ChromeColours) -> vec3f {
  // Sky: pale at the horizon, deep towards the top, an airbrush's long soft gradient.
  let sky = mix(c.sky_low.rgb, c.sky_top.rgb, smoothstep(0.0, 1.0, e));
  // Ground: darkest just under the line, warming towards the bottom.
  let ground = mix(c.ground_high.rgb, c.ground_low.rgb, smoothstep(0.0, 1.1, -e));
  var colour = select(ground, sky, e > 0.0);
  // The bright horizon line itself, a little soft.
  colour += c.line.rgb * exp(-pow(e / 0.035, 2.0));
  return colour;
}
