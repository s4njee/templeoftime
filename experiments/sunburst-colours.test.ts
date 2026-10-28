import { it } from 'vitest';
import { lightnessForLuminance, luminance, oklchToLinear } from '../src/gpu/colour/oklab.ts';
import { safeColour } from '../src/gpu/safety/colour-caps.ts';
import { patternStepAt } from '../src/gpu/safety/pattern.ts';

// Scratch: the sunburst's ray and ground colours at two doses.
it('colours', () => {
  for (const dose of [0.35, 0.9]) {
    const ground = oklchToLinear(safeColour([0.16, 0.01, (80 * Math.PI) / 180]));
    const gy = luminance(ground);
    const step = patternStepAt(dose) / 1.2;
    const h = (85 * Math.PI) / 180;
    const L = lightnessForLuminance(gy + step, 0.12, h);
    const ray = oklchToLinear(safeColour([L, 0.12, h]));
    console.log(dose, 'ground', ground.map((v) => v.toFixed(4)), 'Y', gy.toFixed(4), 'step', step.toFixed(3), 'ray L', L.toFixed(3), ray.map((v) => v.toFixed(3)), 'Y', luminance(ray).toFixed(3));
  }
});
