import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import manifest from '@/data/legacy/manifest.json';
import { homepageShelves } from '@/data/homepage-shelves';
import { addClassResourceMenus } from '@/lib/class-resource-menus';

describe('Class resource destinations', () => {
  for (const [path] of homepageShelves.flat()) {
    if (!path) throw new Error('Every shelf entry must have a class path');
    it(`keeps examinations and holiday resources within ${path}`, () => {
      const entry = manifest[path.slice(1) as keyof typeof manifest];
      const page = JSON.parse(readFileSync(`src/data/catalog/pages/legacy/${entry.data}`, 'utf8'));
      const source: string = JSON.parse(readFileSync(`src/data/legacy/fragments/${page.template}.json`, 'utf8'));
      const result = addClassResourceMenus(source);
      // A non-breaking space left after a button renders as an extra row, so menu rows must sit flush on their list.
      expect(result).not.toMatch(/<\/button>(?:\u00a0|&nbsp;)/);
      const exams = result.match(/<b>EXAMINATIONS<\/b>.*?<ul[^>]*>(.*?)<\/ul>/s)?.[1] ?? '';
      const holidays = result.match(/<b>HOLIDAY PACKAGES<\/b>.*?<ul[^>]*>(.*?)<\/ul>/s)?.[1] ?? '';
      const papers = source.match(/<b>PAST PAPERS<\/b>.*?<ul[^>]*>(.*?)<\/ul>/s)?.[1] ?? '';
      const originalLinks = Array.from(papers.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g));
      expect(originalLinks.length).toBeGreaterThan(0);
      expect(Array.from(exams.matchAll(/href="([^"]+)"/g), m => m[1])).toEqual(originalLinks.filter(m => !/packages/i.test(m[2] ?? '')).map(m => m[1]));
      expect(Array.from(holidays.matchAll(/href="([^"]+)"/g), m => m[1])).toEqual(originalLinks.filter(m => /packages/i.test(m[2] ?? '')).map(m => m[1]));
    });
  }
});