import { describe, expect, it } from 'vitest';
import { shouldLoadAdsense } from '../lib/adsense';

describe('production ads', () => {
  it('permits the existing production site after acceptance', () => {
    expect(shouldLoadAdsense(true, 'fresh-teacher.github.io', 'accepted')).toBe(true);
  });
  it('does not request ads on previews', () => {
    expect(shouldLoadAdsense(true, 'localhost', 'accepted')).toBe(false);
    expect(shouldLoadAdsense(false, 'fresh-teacher.github.io', 'accepted')).toBe(false);
  });
  it('respects essential-only and undecided visitors', () => {
    expect(shouldLoadAdsense(true, 'fresh-teacher.github.io', 'essential')).toBe(false);
    expect(shouldLoadAdsense(true, 'fresh-teacher.github.io', null)).toBe(false);
  });
});