import type { EffectMeta } from '../types.ts';

export const meta: EffectMeta = {
  id: 'photocopy',
  title: 'Photocopy',
  epic: '2',
  tier: 'A',
  tags: ['print', 'xerography', '1990s', 'grunge'],
  summary:
    'The 1990s photocopier: each generation a copy of the last, blurred by the optics, thresholded into toner, a little skewed and scaled, with toner specks, dropouts and streaks from a dirty drum, so a copy of a copy of a copy falls apart the way zines and flyers did.',
  scorecard: {
    compute: false,
    mobile: 'untested',
    flash: 'none',
    pattern: 'none',
    lightPage: 'yes',
    features: { required: [] },
    fallback: 'A still of the copy: it does not move.',
    useCases: ['A zine, flyer or grunge page treatment', 'The base of grunge type (7.4)'],
  },
};
