import MiniSearch from 'minisearch';
import { searchTokens, libraryQueryTokens } from './document-search';
import { resourceTitle, type ResourceRecord } from './resources';
import { resolveDocuments } from './static-catalog';
import { loadCatalogShard } from './repository-catalog';

const files = import.meta.glob<string>('../data/catalog/search-index-*.json', { query: '?raw', import: 'default' });
let index: Promise<MiniSearch[]> | undefined;
export type LibrarySort = 'source' | 'title-asc' | 'title-desc';
export function librarySort(value: unknown): LibrarySort {
  return value === 'title-asc' || value === 'title-desc' ? value : 'source';
}
export function preloadLibrarySearch() {
  index ??= Promise.all(Object.values(files).map(async load => MiniSearch.loadJSON(await load(), {
    fields: ['title', 'description'], storeFields: ['recordId'], tokenize: searchTokens, processTerm: term => term,
  }))).catch(error => { index = undefined; throw error; });
  return index;
}
const matches = new Map<string, Promise<string[]>>();
const documents = new Map<string, Promise<ResourceRecord[]>>();
export function orderLibraryDocuments(items: ResourceRecord[], sort: LibrarySort, type = 'all') {
  const filtered = type === 'all' ? items : items.filter(item => item.pdfUrl.split('?')[0]?.split('.').pop()?.toUpperCase() === type);
  return sort === 'source' ? filtered : [...filtered].sort((a, b) => (sort === 'title-desc' ? -1 : 1) * resourceTitle(a).localeCompare(resourceTitle(b)));
}
export async function searchLibrary(query: string, page = 1, pageSize = 12, sort: LibrarySort = 'source', type = 'all') {
  const normalized = libraryQueryTokens(query).join(' ');
  if (!normalized) return { items: [], total: 0, page: 1 };
  let ranked = matches.get(normalized);
  if (!ranked) {
    ranked = preloadLibrarySearch().then(parts => parts.flatMap(part => part.search(normalized, { combineWith: 'AND', prefix: term => term.length >= 3 && !/^\d+$/.test(term), fuzzy: term => term.length >= 5 && !/\d/.test(term) ? 0.15 : false, boost: { title: 2 } })).sort((a, b) => b.score - a.score).map(result => String(result['recordId'])));
    matches.set(normalized, ranked);
    if (matches.size > 8) { const oldest = matches.keys().next().value; if (oldest !== undefined) { matches.delete(oldest); documents.delete(oldest); } }
    void ranked.catch(() => { matches.delete(normalized); });
  }
  const ids = await ranked;
  const size = Math.max(1, Math.floor(pageSize) || 12);
  if (sort !== 'source' || type !== 'all') {
    let resolved = documents.get(normalized);
    if (!resolved) { resolved = resolveDocuments(ids, loadCatalogShard); documents.set(normalized, resolved); void resolved.catch(() => documents.delete(normalized)); }
    const ordered = orderLibraryDocuments(await resolved, sort, type);
    const currentPage = Math.max(1, Math.min(Math.ceil(ordered.length / size) || 1, Math.floor(page) || 1));
    return { items: ordered.slice((currentPage - 1) * size, currentPage * size), total: ordered.length, page: currentPage };
  }
  const currentPage = Math.max(1, Math.min(Math.ceil(ids.length / size) || 1, Math.floor(page) || 1));
  return { items: await resolveDocuments(ids.slice((currentPage - 1) * size, currentPage * size), loadCatalogShard), total: ids.length, page: currentPage };
}