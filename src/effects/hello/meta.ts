import type { EffectMeta } from '../types.ts';

export const meta: EffectMeta = {
  id: 'hello',
  title: 'Hello',
  epic: '1',
  tier: 'A',
  tags: ['scaffold', 'Art Deco'],
  summary:
    'The smallest effect: a Deco fan of rays from the bottom of the view, turning very slowly, in one fragment pass through the HDR tail. Every later effect starts from this shape.',
  scorecard: {
    compute: false,
    mobile: 'untested',
    flash: 'none',
    pattern: 'none',
    lightPage: 'no',
    features: { required: [] },
    fallback: 'A still of the fan, or a repeating-conic-gradient.',
    useCases: ['The template for new effects'],
  },
};
