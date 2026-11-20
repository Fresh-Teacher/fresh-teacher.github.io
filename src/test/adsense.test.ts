import { describe, expect, it } from 'vitest';
import { shouldLoadAdsense } from '../lib/adsense';

describe('production ads', () => {
  it('loads ads on the production site without any cookie choice', () => {
    expect(shouldLoadAdsense(true, 'fresh-teacher.github.io')).toBe(true);
  });
  it('does not request ads on previews', () => {
    expect(shouldLoadAdsense(true, 'localhost')).toBe(false);
    expect(shouldLoadAdsense(true, '127.0.0.1')).toBe(false);
    expect(shouldLoadAdsense(true, 'id-preview--6bdc6ddb-8108-44ae-884b-1df3b78a33d4.lovable.app')).toBe(false);
    expect(shouldLoadAdsense(true, 'fresh-teacher.github.io.example.com')).toBe(false);
    expect(shouldLoadAdsense(false, 'fresh-teacher.github.io')).toBe(false);
  });
});
