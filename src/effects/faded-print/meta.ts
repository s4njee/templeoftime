import type { EffectMeta } from '../types.ts';

export const meta: EffectMeta = {
  id: 'faded-print',
  title: 'Faded print',
  epic: '2',
  tier: 'A',
  tags: ['photograph', 'dye fading', '1970s'],
  summary:
    "A holiday snapshot aged as a 1970s colour print ages: its three dyes fading at their own rates, cyan first in an album, so the print drifts red, or magenta first on a sunlit wall, so it drifts green and blue, with yellowed whites and lifted blacks. Beside it, what CSS's sepia() and hue-rotate() do instead.",
  scorecard: {
    compute: false,
    mobile: 'untested',
    flash: 'none',
    pattern: 'none',
    lightPage: 'yes',
    features: { required: [] },
    fallback: 'A still of the print, or the CSS filter version.',
    useCases: ['A period treatment for a page photograph', 'A family-history or archive page'],
  },
};
