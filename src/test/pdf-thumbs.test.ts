import { afterEach, expect, it, vi } from 'vitest';

const saved = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn() }));
vi.mock('@/lib/thumbnail-cache', () => ({ readThumbnail: saved.read, saveThumbnail: saved.save }));
afterEach(() => { vi.restoreAllMocks(); vi.resetModules(); saved.read.mockReset(); saved.save.mockReset(); });

it('uses a saved cover and page count without loading PDF.js or the PDF', async () => {
  saved.read.mockResolvedValue({ src: 'data:image/jpeg;base64,saved', pages: 12 });
  const append = vi.spyOn(document.body, 'appendChild');
  const { pdfThumbnail, pdfPageCount } = await import('@/lib/pdf-thumbs');
  expect(await pdfThumbnail('https://example.com/saved.pdf')).toBe('data:image/jpeg;base64,saved');
  expect(pdfPageCount('https://example.com/saved.pdf')).toBe(12);
  expect(append).not.toHaveBeenCalled();
  expect(await pdfThumbnail('https://example.com/saved.pdf')).toBe('data:image/jpeg;base64,saved');
  expect(saved.read).toHaveBeenCalledTimes(1);
});