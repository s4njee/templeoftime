import type { EffectMeta } from '../types.ts';

export const meta: EffectMeta = {
  id: 'airbrush',
  title: 'Airbrush',
  epic: '2',
  tier: 'A',
  tags: ['airbrush', '1980s', 'illustration'],
  summary:
    'An airbrushed sunset, built the way an illustrator built one: sky, glow, a banded sun and mountains, each sprayed as overlapping passes through a frisket cut for it, with overspray past the passes and droplet specks where the paint is thin. It can spray itself in, pass by pass.',
  scorecard: {
    compute: false,
    mobile: 'untested',
    flash: 'none',
    pattern: 'none',
    lightPage: 'no',
    features: { required: [] },
    fallback: 'A still of the finished picture.',
    useCases: ['A retro hero backdrop', 'The base of chrome lettering and 80s sunsets (6.1, 6.2)'],
  },
};
