// Fetches remote file sizes via HEAD requests and caches them per URL.

const cache = new Map<string, Promise<number | null>>();
let active = 0;
const queue: Array<() => void> = [];
async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (active >= 4) await new Promise<void>(resolve => queue.push(resolve)); else active += 1;
  try { return await task(); } finally { const next = queue.shift(); if (next) next(); else active -= 1; }
}

export function fileSize(url: string): Promise<number | null> {
  let cached = cache.get(url);
  if (!cached) {
    cached = limited(() => fetch(url, { method: 'HEAD' }))
      .then(response => {
        if (!response.ok) return null;
        const length = response.headers.get('content-length');
        const bytes = length ? Number(length) : Number.NaN;
        return Number.isFinite(bytes) ? bytes : null;
      })
      .catch(() => null);
    cache.set(url, cached);
  }
  return cached;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
