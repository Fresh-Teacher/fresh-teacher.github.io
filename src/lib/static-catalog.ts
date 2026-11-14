import type { ResourceRecord } from './resources';
import { isDocumentFile } from './document-formats';

export type StaticPage<T extends { items: ResourceRecord[] }> = Omit<T, 'items'> & {
  documentIds: string[];
  recoverySource?: string;
};

export type DocumentShard = Record<string, ResourceRecord>;

export async function resolveDocuments(
  ids: string[],
  loadShard: (key: string) => Promise<DocumentShard>,
): Promise<ResourceRecord[]> {
  const keys = [...new Set(ids.map(id => id.slice(0, 2)))];
  const shards = new Map(await Promise.all(keys.map(async key => [key, await loadShard(key)] as const)));
  return ids.map(id => {
    const item = shards.get(id.slice(0, 2))?.[id];
    if (!item) throw new Error(`Missing static document: ${id}`);
    return item;
  }).filter(item => isDocumentFile(item.pdfUrl));
}