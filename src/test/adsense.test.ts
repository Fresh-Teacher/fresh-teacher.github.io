import { describe, expect, it } from 'vitest';
import { shouldLoadAdsense } from '../lib/adsense';

describe('production ads', () => {
  it('loads ads on the production site without any cookie choice', () => {
    expect(shouldLoadAdsense(true, 'fresh-teacher.github.io')).toBe(true);
  });
  it('does not request ads on previews', () => {
    expect(shouldLoadAdsense(true, 'localhost')).toBe(false);
    expect(shouldLoadAdsense(false, 'fresh-teacher.github.io')).toBe(false);
  });
});
