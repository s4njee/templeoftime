import type { EffectMeta } from '../types.ts';

export const meta: EffectMeta = {
  id: 'chrome-type',
  title: 'Chrome type',
  epic: '6',
  tier: 'A',
  tags: ['1980s', 'type', 'chrome', 'airbrush'],
  summary:
    'Airbrushed chrome lettering, as on 1980s album covers and arcade marquees: the heading bevelled into a rounded profile and reflecting a painted horizon, sky above and dark ground below, the line bending round each letter. A dark outline, a drop shadow, star glints and a gleam that sweeps across.',
  scorecard: {
    compute: false,
    mobile: 'untested',
    flash: 'low',
    pattern: 'none',
    lightPage: 'untested',
    features: { required: [] },
    fallback: 'A still of the heading, or the CSS version: a gradient clipped to the text.',
    useCases: ['A logo or heading on a retro page', 'A game or music landing page'],
  },
};
