import { describe, expect, it } from 'vitest';
import { filterResources, resourceTitle, type ResourceRecord } from '@/lib/resources';
import { libraryQueryTokens } from '@/lib/document-search';
import { legacySearch } from '@/lib/legacy-pages';
import { documentMetadata, documentSlug } from '@/lib/document-metadata';
import { loadDocument } from '@/lib/document-catalog';
import { catalogWindow } from '@/lib/document-browsing';
import { documentViewer } from '@/lib/document-viewer';
import { isDocumentFile } from '@/lib/document-formats';
import { flipbookOptions, readingModes } from '@/lib/flipbook-options';

const record = (name: string): ResourceRecord => ({ pdfUrl: `https://fresh-teacher.github.io/${name}.pdf`, description: 'Primary Seven', price: 5000 });
const maths = record('P_7_MATHS_MOCK_2023_TERM_II');
const mtc = record('P.7 M.T.C END OF TERM 1');
const science = record('P.7 SCIENCE MOCK 2022');
const items = [maths, mtc, science];
describe('Document discovery rules', () => {
  it('removes natural-language stopwords without removing class or subject terms', () => {
    expect(libraryQueryTokens('schemes of work for p7 in mathematics with answers')).toEqual(['scheme', 'p7', 'mathematics', 'answers']);
  });
  it('mathematics includes maths and MTC filenames', () => { expect(new Set(filterResources(items, 'mathematics'))).toEqual(new Set([maths, mtc])); });
  it('matches all query words in any order with class aliases', () => { expect(filterResources(items, 'mock primary seven mathematics')).toEqual([maths]); });
  it('normalizes dotted class punctuation', () => { expect(filterResources(items, 'P.7 mathematics')).toHaveLength(2); });
  it('tolerates a subject typo', () => { expect(filterResources(items, 'mathemtics')).toHaveLength(2); });
  it('supports prefixes', () => { expect(filterResources(items, 'scien')).toEqual([science]); });
  it('matches Roman and numeric terms', () => { expect(filterResources(items, 'maths term 2')).toEqual([maths]); });
  it('matches religious education abbreviations', () => { const cre = record('P7 CRE'); expect(filterResources([cre], 'religious education')).toEqual([cre]); });
  it('keeps year tokens exact and requires all words', () => { expect(filterResources(items, 'maths 2022')).toEqual([]); });
  it('preserves original order for an empty search', () => { expect(filterResources(items, '')).toBe(items); });
  it('applies synonym search to legacy catalogs too', () => { expect(legacySearch(items, 'mathematics')).toHaveLength(2); });
  it('extracts only source-backed year and term', () => { expect(documentMetadata(maths)).toMatchObject({ subject: 'Mathematics', year: '2023', term: 'Term 2', kind: 'Mock', level: 'P7' }); expect(documentMetadata(record('Untitled')) .year).toBeUndefined(); });
  it('cleans filenames without changing downloads', () => { expect(resourceTitle(maths)).not.toContain('_'); expect(maths.pdfUrl).toBe('https://fresh-teacher.github.io/P_7_MATHS_MOCK_2023_TERM_II.pdf'); });
  it('resolves a dedicated page to the original source URL', async () => {
    const item = record('primary/P.5 m.t.c end of term 1');
    const result = await loadDocument(documentSlug(item));
    expect(result?.item.pdfUrl).toBe(item.pdfUrl);
    expect(result?.related.some(other => other.pdfUrl === item.pdfUrl)).toBe(true);
  });
  it('returns no document for unknown identities', async () => { expect(await loadDocument('ffffffffffffffff-missing')).toBeNull(); });
  it('keeps all catalog pages and starts with documents below the opened item', () => {
    const catalog = Array.from({ length: 145 }, (_, index) => record(`Document ${index}`));
    const window = catalogWindow(catalog, 2, catalog[15]?.pdfUrl);
    expect(window.totalPages).toBe(13);
    expect(window.currentPage).toBe(2);
    expect(window.items).toEqual(catalog.slice(16, 24));
    expect(catalogWindow(catalog, 3).items).toEqual(catalog.slice(24, 36));
  });
  it('retains next-page navigation when the opened document is last on its page', () => {
    const catalog = Array.from({ length: 25 }, (_, index) => record(`Document ${index}`));
    expect(catalogWindow(catalog, 1, catalog[11]?.pdfUrl)).toMatchObject({ items: [], totalPages: 3 });
    expect(catalogWindow(catalog, 2).items).toEqual(catalog.slice(12, 24));
  });
  it('uses the actual originating catalog when a document appears in multiple catalogs', async () => {
    const result = await loadDocument(documentSlug(record('primary/P.5 m.t.c end of term 1')), 'PrimaryFiveClassPastPapers.html');
    expect(result?.path).toBe('PrimaryFiveClassPastPapers.html');
    expect(result?.related.length).toBeGreaterThan(12);
  });
  it('selects a flipbook for PDFs', () => { expect(documentViewer(maths.pdfUrl).kind).toBe('pdf'); });
  it.each(['ini', 'exe', 'mp3', 'mp4', 'png', 'csv', 'html'])('hides non-document %s files from search', extension => {
    const nonDocument = { ...maths, pdfUrl: `https://fresh-teacher.github.io/desktop.${extension}` };
    expect(isDocumentFile(nonDocument.pdfUrl)).toBe(false);
    expect(filterResources([maths, nonDocument], '')).toEqual([maths]);
  });
  it.each(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp', 'rtf', 'txt'])('keeps %s documents', extension => { expect(isDocumentFile(`https://fresh-teacher.github.io/lesson.${extension}`)).toBe(true); });
  it('preserves captured PDF filenames containing a literal hash', () => { expect(documentViewer('https://fresh-teacher.github.io/p6/P.6#CREATIVE PRINTERS SCIENCE.pdf').kind).toBe('pdf'); });
  it('does not expose system-file detail pages', async () => { expect(await loadDocument(documentSlug({ ...maths, pdfUrl: 'https://fresh-teacher.github.io/baby/desktop.ini' }))).toBeNull(); });
  it('matches the catalog flip style', () => { expect(flipbookOptions(maths.pdfUrl)).toMatchObject({ pdfUrl: maths.pdfUrl, viewMode: 'webgl', singlePageMode: false, btnPrev: { enabled: true }, btnNext: { enabled: true } }); });
  it('enables page-turn sound with a mute control in flip mode', () => { expect(flipbookOptions(maths.pdfUrl)).toMatchObject({ sound: true, btnSound: { enabled: true } }); });
  it('offers a whole-file download control in the flipbook menu', () => { expect(flipbookOptions(maths.pdfUrl)).toMatchObject({ btnDownloadPdf: { enabled: true, title: 'Download PDF', url: maths.pdfUrl, forceDownload: false }, btnDownloadPages: { enabled: false } }); });
  it('offers only flipping and vertical scrolling', () => { expect(readingModes).toEqual(['book', 'vertical']); });
  it.each(['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'])('selects an office viewer for %s files', extension => {
    const url = `https://fresh-teacher.github.io/lesson.${extension}`;
    expect(documentViewer(url)).toEqual({ kind: 'office', src: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}` });
  });
  it('never shares arbitrary private URLs with external office viewers', () => { expect(documentViewer('https://private.example/secret.docx').kind).toBe('unsupported'); });
});