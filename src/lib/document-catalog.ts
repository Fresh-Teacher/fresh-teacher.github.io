import { documentSlug } from './document-metadata';
import resourceManifest from '@/data/resource-manifest.json';
import legacyManifest from '@/data/legacy/manifest.json';
import type { ResourcePageData } from './resources';
import type { DocumentShard, StaticPage } from './static-catalog';
import { resolveDocuments } from './static-catalog';
import { isDocumentFile } from './document-formats';
import repositoryManifest from '@/data/catalog/repositories.json';

type Entry = { id: string; path: string; kind: string; data: string };
const indices = import.meta.glob<{ default: Record<string, Entry> }>('../data/catalog/document-index/*.json');
const documents = import.meta.glob<{ default: DocumentShard }>('../data/catalog/documents/*.json');
const pages = import.meta.glob<{ default: StaticPage<ResourcePageData> }>('../data/catalog/pages/*/*.json');
async function shard(key: string) {
  const load = documents[`../data/catalog/documents/${key}.json`];
  if (!load) throw new Error('Missing document shard');
  return (await load()).default;
}
export async function loadDocument(slug: string, source?: string) {
  const key = slug.split('-')[0] ?? '';
  if (!/^[a-f0-9]{16}$/.test(key)) return null;
  const get = indices[`../data/catalog/document-index/${key.slice(0, 2)}.json`];
  const entry = get ? (await get()).default[key] : undefined;
  if (!entry) return null;
  const item = (await shard(entry.id.slice(0, 2)))[entry.id];
  if (!item) throw new Error('Missing document');
  if (!isDocumentFile(item.pdfUrl)) return null;
  const resource = source ? resourceManifest[source as keyof typeof resourceManifest] : undefined;
  const legacy = source ? legacyManifest[source as keyof typeof legacyManifest] : undefined;
  const repoKey = source?.match(/^more\/([^/?#]+)$/)?.[1];
  const repository = repoKey ? (repositoryManifest.repositories as Record<string, { data: string }>)[repoKey] : undefined;
  const requested = resource ? { path: source, kind: 'resources', data: resource.data } : legacy ? { path: source, kind: 'legacy', data: legacy.data } : repository ? { path: source, kind: 'repositories', data: repository.data } : undefined;
  const requestedRead = requested ? pages[`../data/catalog/pages/${requested.kind}/${requested.data}`] : undefined;
  const requestedPage = requestedRead ? (await requestedRead()).default : undefined;
  const origin = requested && requestedPage?.documentIds.includes(entry.id) ? requested : entry;
  const read = pages[`../data/catalog/pages/${origin.kind}/${origin.data}`];
  if (!read) throw new Error('Missing document category');
  const page = (await read()).default;
  const siblings = await resolveDocuments(page.documentIds, shard);
  return { item, path: origin.path ?? entry.path, category: page.title, related: siblings, slug: documentSlug(item) };
}
export type DocumentData = NonNullable<Awaited<ReturnType<typeof loadDocument>>>;
