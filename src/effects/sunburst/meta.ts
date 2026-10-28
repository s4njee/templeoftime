import type { EffectMeta } from '../types.ts';

export const meta: EffectMeta = {
  id: 'sunburst',
  title: 'Sunburst',
  epic: '3',
  tier: 'A',
  tags: ['Art Deco', 'pattern', 'gold'],
  summary:
    'The Art Deco sunburst: tapered rays from a rising sun, a centre or a corner fan, stepped into tiers, in gold on black, jade and gold, or the pink of its 1980s Miami revival. Its contrast is held under the regular-pattern rule by default; full Deco contrast waits behind the gate.',
  scorecard: {
    compute: false,
    mobile: 'untested',
    flash: 'none',
    pattern: 'none',
    patternPresets: ['full contrast'],
    lightPage: 'no',
    features: { required: [] },
    fallback:
      'A still, or CSS: a repeating-conic-gradient does the rays, without the tiers or taper.',
    useCases: ['A hero or section background on a Deco-styled page', 'A badge or seal, small'],
  },
};
