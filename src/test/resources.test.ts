import { describe, expect, it } from 'vitest';
import { filterResources, resourcePage } from '@/lib/resources';
import { searchTokens } from '@/lib/document-search';
import manifest from '@/data/resource-manifest.json';
import primaryFive from '../../.site-import/catalog-source/resources/PrimaryFiveLessonNotes.json';

describe('Original resource behavior', () => {
  it('preserves original HTML addresses without filename inference', () => {
    expect(manifest['PrimaryFiveLessonNotes.html'].data).toBe('PrimaryFiveLessonNotes.json');
    expect(manifest['BabyClassPastPapers.html'].data).toBe('BabyClassPastPapers.json');
    expect('primaryfivelessonnotes.html' in manifest).toBe(false);
  });
  it('keeps the original first record and exact PDF destination', () => {
    expect(primaryFive.items[0]?.pdfUrl).toBe('https://fresh-teacher.github.io/primary/ALL SST NOTES P.4 TO P.7 ALL TERMS EXCEL-1.pdf');
    expect(resourcePage(primaryFive.items, 1).items[0]).toEqual(primaryFive.items[0]);
  });
  it('retains the original 42-record page size and ordering', () => {
    expect(resourcePage(primaryFive.items, 1).items).toHaveLength(42);
    expect(resourcePage(primaryFive.items, 2).items[0]).toEqual(primaryFive.items[42]);
    expect(resourcePage(primaryFive.items, 2).totalPages).toBe(2);
  });
  it('searches filenames case-insensitively and keeps filtering on later pages', () => {
    const filtered = filterResources(primaryFive.items, 'P.5');
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every(item => searchTokens(`${item.pdfUrl} ${item.title ?? ''} ${item.description}`).includes('p5'))).toBe(true);
    expect(filterResources(primaryFive.items, 'unmatched-987654321')).toHaveLength(0);
    expect(resourcePage(filtered, 2).items).toEqual(filtered.slice(42, 84));
  });
});