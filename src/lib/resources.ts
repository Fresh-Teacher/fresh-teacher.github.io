import lockedCover from '@/assets/locked-pdf.jpeg.asset.json';
import { searchDocuments } from './document-search';
import { isVisibleDocument, LOCKED_THUMB_URL } from './document-formats';

export interface ResourceRecord {
  title?: string;
  description: string;
  price: string | number;
  pdfUrl: string;
  /** Precomputed bytes; absent when the source does not supply a reliable size. */
  sizeBytes?: number;
  thumbUrl?: string;
  pages?: number;
}

export interface ResourcePageData {
  title: string;
  description: string;
  styles: string;
  items: ResourceRecord[];
}

export const RESOURCE_PAGE_SIZE = 42;

const titleCache = new WeakMap<ResourceRecord, string>();
export function resourceTitle(item: ResourceRecord) {
  let title = titleCache.get(item);
  if (title === undefined) { title = readTitle(item); titleCache.set(item, title); }
  return title;
}

function readTitle(item: ResourceRecord) {
  let name = item.title?.trim() || item.pdfUrl.substring(item.pdfUrl.lastIndexOf('/') + 1).split('?')[0] || 'Document';
  try { name = decodeURIComponent(name); } catch { /* Keep malformed source filenames intact. */ }
  return name.replace(/\.(pdf|docx?|pptx?|xlsx?)$/i, '').replace(/[_-]+/g, ' ').replace(/\b([ps])[\s.]*([1-7])\b/gi, '$1.$2').replace(/\s+/g, ' ').trim()
    .split(' ').map(word => /^(p\.?\d|s\.?\d|mtc|sst|ple|uce|uace|cre|ire|ii?|iii|iv|vi?)$/i.test(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

export function filterResources(items: ResourceRecord[], query: string) {
  const documents = items.every(isVisibleDocument) ? items : items.filter(isVisibleDocument);
  return searchDocuments(documents, query);
}

export function resourcePage(items: ResourceRecord[], requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / RESOURCE_PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Math.floor(requestedPage) || 1));
  return { page, totalPages, items: items.slice((page - 1) * RESOURCE_PAGE_SIZE, page * RESOURCE_PAGE_SIZE) };
}
/** Document covers are served from the source repo via jsDelivr to keep this project small. */
export const THUMB_CDN = 'https://cdn.jsdelivr.net/gh/Springing-Starz/garden-paths-atlas@main/public';
const repairedCovers = import.meta.glob<{ url: string }>('../assets/document-covers/*.asset.json', { eager: true, import: 'default' });

export function thumbSrc(url: string) {
  if (url === LOCKED_THUMB_URL) return lockedCover.url;
  const repaired = repairedCovers[`../assets/document-covers/${url.split('/').pop()}.asset.json`];
  if (repaired) return repaired.url;
  return url.startsWith('/thumbs/') ? THUMB_CDN + url : url;
}
