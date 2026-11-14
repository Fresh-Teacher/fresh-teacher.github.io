// Disposable browser performance cache, never the source of document data.
const CACHE_NAME = 'fresh-teacher-thumbnails-v1';
const MAX_ENTRIES = 150;
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

export interface SavedThumbnail { src: string; pages?: number; savedAt: number }

function key(url: string) {
  const request = new URL('/__thumbnail-cache__', window.location.origin);
  request.searchParams.set('pdf', url);
  return request.href;
}

export async function readThumbnail(url: string): Promise<SavedThumbnail | null> {
  try {
    if (typeof window === 'undefined' || !('caches' in window)) return null;
    const cache = await window.caches.open(CACHE_NAME);
    const response = await cache.match(key(url));
    if (!response) return null;
    const value = await response.json() as SavedThumbnail;
    if (!value.src?.startsWith('data:image/jpeg;base64,') || Date.now() - value.savedAt > MAX_AGE) {
      await cache.delete(key(url));
      return null;
    }
    return value;
  } catch { return null; }
}

export async function saveThumbnail(url: string, src: string, pages?: number): Promise<void> {
  try {
    if (typeof window === 'undefined' || !('caches' in window)) return;
    const cache = await window.caches.open(CACHE_NAME);
    await cache.put(key(url), new Response(JSON.stringify({ src, pages, savedAt: Date.now() }), {
      headers: { 'Content-Type': 'application/json' },
    }));
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES)).map(request => cache.delete(request)));
  } catch { /* Unavailable storage must not prevent a thumbnail appearing. */ }
}