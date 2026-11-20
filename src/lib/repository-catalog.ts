import { remoteGlob } from '@/lib/remote-catalog';
import manifest from '@/data/catalog/repositories.json';
import type { DocumentShard } from './static-catalog';
import type { ResourceRecord } from './resources';
import { isVisibleDocument } from './document-formats';

export type RepositoryPage = { title: string; documentIds: string[] };
const pages = remoteGlob<RepositoryPage>('../data/catalog/pages/repositories/');
const repositoryItems = remoteGlob<ResourceRecord[]>('../data/catalog/page-items/repositories/');
const shards = remoteGlob<DocumentShard>('../data/catalog/documents/');
export async function loadCatalogShard(key: string) {
  const load = shards[`../data/catalog/documents/${key}.json`];
  if (!load) throw new Error('Missing catalog shard');
  return (await load()).default;
}
export async function loadRepositoryDocuments(repo: string) {
  const entry = (manifest.repositories as Record<string, { data: string }>)[repo];
  if (!entry) throw new Error('Repository not in catalog');
  const load = pages[`../data/catalog/pages/repositories/${entry.data}`];
  if (!load) throw new Error('Repository not in catalog');
  const items = repositoryItems[`../data/catalog/page-items/repositories/${entry.data}`];
  if (!items) throw new Error('Repository not in catalog');
  return (await items()).default.filter(isVisibleDocument);
}