import type { EffectMeta } from '../types.ts';

export const meta: EffectMeta = {
  id: 'screen-print',
  title: 'Screen print',
  epic: '2',
  tier: 'A',
  tags: ['print', 'silkscreen', '1960s', 'pop art'],
  summary:
    'A silkscreen print: the picture posterised to a few flat inks, each laid as its own pass through a stencil, so each lands a little out of register, with the texture and uneven coverage a squeegee leaves. Light inks first, dark last, on cream stock.',
  scorecard: {
    compute: false,
    mobile: 'untested',
    flash: 'none',
    pattern: 'none',
    lightPage: 'yes',
    features: { required: [] },
    fallback: 'A still of the print: it does not move.',
    useCases: ['A poster treatment for a hero image', 'A gig, event or exhibition page'],
  },
};
