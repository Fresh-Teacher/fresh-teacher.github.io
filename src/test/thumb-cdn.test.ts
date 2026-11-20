import { expect, it } from 'vitest';
import { thumbSrc } from '@/lib/resources';
it('serves covers from the jsDelivr copy of the source repo', () => {
  expect(thumbSrc('/thumbs/abc.webp')).toBe('https://cdn.jsdelivr.net/gh/Springing-Starz/garden-paths-atlas@main/public/thumbs/abc.webp');
});
