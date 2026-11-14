import manifest from '@/data/catalog/repositories.json';
import { resolveDocuments, type DocumentShard } from './static-catalog';

export type RepositoryPage = { title: string; documentIds: string[] };
const pages = import.meta.glob<{ default: RepositoryPage }>('../data/catalog/pages/repositories/*.json');
const shards = import.meta.glob<{ default: DocumentShard }>('../data/catalog/documents/*.json');
export async function loadCatalogShard(key: string) {
  const load = shards[`../data/catalog/documents/${key}.json`];
  if (!load) throw new Error('Missing catalog shard');
  return (await load()).default;
}
export async function loadRepositoryDocuments(repo: string) {
  const entry = (manifest.repositories as Record<string, { data: string }>)[repo];
  const load = entry ? pages[`../data/catalog/pages/repositories/${entry.data}`] : undefined;
  if (!load) throw new Error('Repository not in catalog');
  return resolveDocuments((await load()).default.documentIds, loadCatalogShard);
}