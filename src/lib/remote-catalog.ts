// Heavy library data lives in the source GitHub repo (pinned commit), not in this app's bundle.
export const CATALOG_REPO_RAW = 'https://raw.githubusercontent.com/Fresh-Teacher/remix-of-remix-of-remix-of-remix-of-remix-of-garden-paths-atlas/0da4e3ee3d6ee1f63ba7769f4be40f16db0e4844';

const cache = new Map<string, Promise<unknown>>();
export function fetchCatalogFile<T>(path: string, raw = false): Promise<T> {
  const url = `${CATALOG_REPO_RAW}/${path}`;
  let hit = cache.get(url) as Promise<T> | undefined;
  if (!hit) {
    hit = fetch(url).then(res => {
      if (!res.ok) throw new Error(`Catalog file unavailable: ${path}`);
      return (raw ? res.text() : res.json()) as Promise<T>;
    });
    cache.set(url, hit);
    void hit.catch(() => cache.delete(url));
  }
  return hit;
}

/** Drop-in for import.meta.glob over `../data/catalog/...`: any key under the prefix yields a remote loader. */
export function remoteGlob<T>(prefix: string): Record<string, () => Promise<{ default: T }>> {
  return new Proxy({}, {
    get(_t, key) {
      if (typeof key !== 'string' || !key.startsWith(prefix) || !key.endsWith('.json')) return undefined;
      const file = key.replace(/^\.\.\/data\//, 'src/data/');
      return () => fetchCatalogFile<T>(file).then(data => ({ default: data }));
    },
  });
}
