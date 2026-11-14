import { describe, expect, it } from 'vitest';
import manifest from '@/data/legacy/manifest.json';
import original from '@/data/resource-manifest.json';
import coverage from '@/data/legacy/coverage.json';
import { legacySearch, legacyVisible } from '@/lib/legacy-pages';

describe('Remaining legacy migration safeguards', () => {
  it('preserves every audited original URL, including spaces and capitalization', () => {
    const addresses = new Set([...Object.keys(original), ...Object.keys(manifest), 'index.html']);
    expect(addresses.size).toBe(649);
    for (const path of coverage.sourcePaths) expect(addresses.has(path)).toBe(true);
    expect(manifest['menu p1.html'].mode).toBe('static');
    expect(manifest['BabyAllLessonNotes.html'].mode).toBe('infinite');
    expect(addresses.has('babyalllessonnotes.html')).toBe(false);
  });
  it('preserves the original 12-file infinite-scroll batch and order', () => {
    const items = Array.from({ length: 25 }, (_, index) => ({ pdfUrl: `https://fresh-teacher.github.io/${index}.pdf`, description: 'Primary', price: 5000 }));
    expect(legacyVisible(items, 1)).toHaveLength(12);
    expect(legacyVisible(items, 2)).toHaveLength(24);
    expect(legacyVisible(items, 2)[12]?.pdfUrl).toBe('https://fresh-teacher.github.io/12.pdf');
    expect(legacyVisible(items, 3)).toEqual(items);
  });
  it('searches original filenames without changing PDF destinations', () => {
    const item = { pdfUrl: 'https://fresh-teacher.github.io/primary/P.5 English Term 2.pdf', description: 'Science', price: 5000 };
    expect(legacySearch([item], 'ENGLISH')).toEqual([item]);
    expect(legacySearch([item], 'Science')).toEqual([item]);
  });
});