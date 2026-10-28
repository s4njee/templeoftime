import type { EffectMeta } from '../types.ts';

export const meta: EffectMeta = {
  id: 'offset-print',
  title: 'Offset print',
  epic: '2',
  tier: 'A',
  tags: ['print', 'halftone', '1960s'],
  summary:
    'Four-colour process printing, as a press does it: a picture separated into cyan, magenta, yellow and black, each screened into halftone dots at its traditional angle so the inks form rosettes, spread by dot gain on the paper, slipped out of register and laid on newsprint, uncoated or coated stock.',
  scorecard: {
    compute: false,
    mobile: 'untested',
    flash: 'none',
    pattern: 'none',
    // A press's real dots and the one-angle moiré are full-contrast screens; the swatches' fine
    // screen aliases into a moiré in the 480 px analysis frame (notes, Safety).
    patternPresets: ['swatches', 'moiré: one angle', 'real dots'],
    lightPage: 'yes',
    features: { required: [] },
    fallback: 'A still of the print: it does not move.',
    useCases: ['A print treatment for a hero image', 'An editorial or poster page'],
  },
};
