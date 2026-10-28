import type { EffectMeta } from '../types.ts';

export const meta: EffectMeta = {
  id: 'pop-dots',
  title: 'Pop dots',
  epic: '2',
  tier: 'A',
  tags: ['print', 'Ben-Day', '1960s', 'pop art'],
  summary:
    "Ben-Day dots, the comic book's colour process that pop art enlarged: a picture posterised to a few flat tints of cyan, magenta and yellow, each tint a coarse screen of even dots or a solid, with spotted blacks and heavy black contours, on newsprint.",
  scorecard: {
    compute: false,
    mobile: 'untested',
    flash: 'none',
    pattern: 'none',
    // Full-strength dots on a coarse screen are a lattice far over the rule (notes, Safety).
    patternPresets: ['full ink'],
    lightPage: 'yes',
    features: { required: [] },
    fallback: 'A still of the print: it does not move.',
    useCases: ['A pop-art treatment for a hero image', 'A comic-styled section or poster'],
  },
};
