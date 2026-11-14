import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import resourceManifest from '@/data/resource-manifest.json';
import legacyManifest from '@/data/legacy/manifest.json';
import hierarchy from '@/data/catalog/index.json';
import recoveries from '@/data/catalog/recoveries.json';
import summary from '@/data/catalog/summary.json';
import { resolveDocuments, type DocumentShard } from '@/lib/static-catalog';
import { isDocumentFile } from '@/lib/document-formats';

const read = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
const shards = new Map<string, DocumentShard>();
const loadShard = async (key: string) => {
  const cached = shards.get(key);
  if (cached) return cached;
  const data = read(`src/data/catalog/documents/${key}.json`) as DocumentShard;
  shards.set(key, data);
  return data;
};

describe('Git-managed static catalogs', () => {
  it('preserves every existing list, exact record values, order, and layouts', async () => {
    for (const [kind, manifest, source] of [
      ['resources', resourceManifest, 'resources'], ['legacy', legacyManifest, 'legacy-pages'],
    ] as const) {
      for (const [path, entry] of Object.entries(manifest)) {
        if (path in recoveries) continue;
        const original = read(`.site-import/catalog-source/${source}/${entry.data}`);
        const normalized = read(`src/data/catalog/pages/${kind}/${entry.data}`);
        const { documentIds, ...layout } = normalized;
        const { items, ...oldLayout } = original;
        expect(layout, path).toEqual(oldLayout);
        expect(await resolveDocuments(documentIds, loadShard), path).toEqual(items.filter((item: { pdfUrl: string }) => isDocumentFile(item.pdfUrl)));
      }
    }
  });

  it('restores the one verified historical Oral Literature record at the original URL', async () => {
    const entry = legacyManifest['PrimaryOneOralLiteratureLessonNotes.html'];
    const page = read(`src/data/catalog/pages/legacy/${entry.data}`);
    expect(page.missingData).toBeNull();
    expect(await resolveDocuments(page.documentIds, loadShard)).toEqual([
      { title: '', description: 'Primary One', price: 5000,
        pdfUrl: 'https://fresh-teacher.github.io/p1/P.1 Oral Literature Term II.pdf' },
    ]);
  });

  it('shares all 62 Entrepreneurship records across both original spelling variants', () => {
    const correct = read(`src/data/catalog/pages/resources/${resourceManifest['SeniorFourEntrepreneurshipPastPapers.html'].data}`);
    const alias = read(`src/data/catalog/pages/legacy/${legacyManifest['SeniorFourEntreprenuershipPastPapers.html'].data}`);
    expect(alias.documentIds).toHaveLength(62);
    expect(alias.documentIds).toEqual(correct.documentIds);
    expect(alias.missingData).toBeNull();
  });

  it('keeps three unverified past-paper lists unavailable instead of substituting notes', () => {
    expect(summary.unavailable).toEqual(['SeniorFourEconomicsPastPapers.html', 'SeniorTwoChinesePastPapers.html', 'SeniorTwoFNPastPapers.html']);
    for (const path of summary.unavailable) {
      const manifest = legacyManifest as Record<string, { data: string }>;
      const page = read(`src/data/catalog/pages/legacy/${manifest[path]?.data}`);
      expect(page.documentIds).toEqual([]);
      expect(page.missingData).toBeTruthy();
    }
  });

  it('indexes original URLs by source-backed class, material, and subject', () => {
    expect(hierarchy.levels.primary.PrimaryOne.LessonNotes.OralLiterature['PrimaryOneOralLiteratureLessonNotes.html'].count).toBe(1);
    expect(hierarchy.levels.secondary.SeniorFour.PastPapers.Entrepreneurship['SeniorFourEntreprenuershipPastPapers.html'].count).toBe(62);
  });

  it('fails on broken references instead of silently dropping a document', async () => {
    await expect(resolveDocuments(['ab-missing'], async () => ({}))).rejects.toThrow('Missing static document');
  });
  it('omits INI system files when hydrating catalog records', async () => {
    const pdf = { description: 'Notes', price: 0, pdfUrl: 'https://fresh-teacher.github.io/notes.pdf' };
    expect(await resolveDocuments(['aa-pdf', 'aa-ini'], async () => ({ 'aa-pdf': pdf, 'aa-ini': { ...pdf, pdfUrl: 'https://fresh-teacher.github.io/desktop.ini' } }))).toEqual([pdf]);
  });
});