/*
 * Story 2.5: the airbrush, as strokes, sprayed gradients, droplets and friskets. TypeScript twin
 * of src/wgsl/airbrush.wgsl, without its noise (the shader's passes wander and vary in pressure
 * by `wobble`; here they are straight and even), for tests and for effects that place things on
 * the CPU.
 */

/** Density of one straight stroke from a to b, `width` its standard deviation across. */
export function stroke(
  p: readonly [number, number],
  a: readonly [number, number],
  b: readonly [number, number],
  width: number,
): number {
  const ab = [b[0] - a[0], b[1] - a[1]];
  const len2 = Math.max(ab[0]! * ab[0]! + ab[1]! * ab[1]!, 1e-9);
  const t = Math.min(1, Math.max(0, ((p[0] - a[0]) * ab[0]! + (p[1] - a[1]) * ab[1]!) / len2));
  const d = Math.hypot(p[0] - (a[0] + ab[0]! * t), p[1] - (a[1] + ab[1]! * t)) / width;
  return Math.exp(-0.5 * d * d);
}

/** A sprayed gradient's density at `u` along it: `passes` strokes over `span`, weighted to fade. */
export function ramp(u: number, span: number, passes: number): number {
  const spacing = span / passes;
  const sigma = 0.7 * spacing;
  let density = 0;
  for (let k = 0; k < passes; k++) {
    const d = (u - (k + 0.5) * spacing) / sigma;
    density += (1 - (k + 0.5) / passes) * Math.exp(-0.5 * d * d);
  }
  return (density * spacing) / (sigma * Math.sqrt(2 * Math.PI));
}

/** Paint coverage from accumulated density: passes over a covered area add less and less. */
export function cover(density: number): number {
  return 1 - Math.exp(-Math.max(density, 0));
}

/** Coverage c as droplets, `r` a uniform random number for the cell: mean-preserving. */
export function deposit(c: number, r: number, spatter: number): number {
  const q = spatter * c * (1 - c);
  return r < q ? 1 : (c - q) / Math.max(1 - q, 1e-6);
}

/** A frisket's opening from a signed distance (negative inside the cut), anti-aliased over `aa`. */
export function frisket(d: number, aa: number): number {
  const t = Math.min(1, Math.max(0, (d + aa) / (2 * aa)));
  return 1 - t * t * (3 - 2 * t);
}
