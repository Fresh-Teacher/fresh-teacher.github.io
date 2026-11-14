import { afterEach, expect, it, vi } from 'vitest';
import { readThumbnail, saveThumbnail } from '@/lib/thumbnail-cache';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function storage() {
  const entries = new Map<string, Response>();
  const cache = {
    match: vi.fn(async (key: string) => entries.get(key)?.clone()),
    put: vi.fn(async (key: string, response: Response) => { entries.set(key, response); }),
    delete: vi.fn(async (key: string) => entries.delete(key)),
    keys: vi.fn(async () => [...entries.keys()]),
  };
  vi.stubGlobal('caches', { open: vi.fn(async () => cache) });
  return cache;
}

it('saves a thumbnail and page count for reuse by a fresh browser page', async () => {
  storage();
  await saveThumbnail('https://example.com/a.pdf', 'data:image/jpeg;base64,cover', 7);
  expect(await readThumbnail('https://example.com/a.pdf')).toMatchObject({ src: 'data:image/jpeg;base64,cover', pages: 7 });
  expect(await readThumbnail('https://example.com/b.pdf')).toBeNull();
});

it('expires old thumbnails so changed originals can be rendered again', async () => {
  const cache = storage();
  vi.spyOn(Date, 'now').mockReturnValue(0);
  await saveThumbnail('https://example.com/a.pdf', 'data:image/jpeg;base64,cover');
  vi.spyOn(Date, 'now').mockReturnValue(31 * 24 * 60 * 60 * 1000);
  expect(await readThumbnail('https://example.com/a.pdf')).toBeNull();
  expect(cache.delete).toHaveBeenCalledTimes(1);
});

it('bounds disposable thumbnail storage', async () => {
  const cache = storage();
  for (let i = 0; i < 151; i++) await saveThumbnail(`https://example.com/${i}.pdf`, 'data:image/jpeg;base64,cover');
  expect(await cache.keys()).toHaveLength(150);
  expect(await readThumbnail('https://example.com/0.pdf')).toBeNull();
  expect(await readThumbnail('https://example.com/150.pdf')).not.toBeNull();
});

it('treats unavailable browser storage as a cache miss', async () => {
  vi.stubGlobal('caches', { open: async () => { throw new Error('Storage blocked'); } });
  await expect(saveThumbnail('https://example.com/a.pdf', 'data:image/jpeg;base64,cover')).resolves.toBeUndefined();
  await expect(readThumbnail('https://example.com/a.pdf')).resolves.toBeNull();
});