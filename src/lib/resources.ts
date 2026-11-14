import { searchDocuments } from './document-search';
import { isDocumentFile } from './document-formats';

export interface ResourceRecord {
  title?: string;
  description: string;
  price: string | number;
  pdfUrl: string;
}

export interface ResourcePageData {
  title: string;
  description: string;
  styles: string;
  items: ResourceRecord[];
}

export const RESOURCE_PAGE_SIZE = 42;

export function resourceTitle(item: ResourceRecord) {
  let name = item.title?.trim() || item.pdfUrl.substring(item.pdfUrl.lastIndexOf('/') + 1).split('?')[0] || 'Document';
  try { name = decodeURIComponent(name); } catch { /* Keep malformed source filenames intact. */ }
  return name.replace(/\.(pdf|docx?|pptx?|xlsx?)$/i, '').replace(/[_-]+/g, ' ').replace(/\b([ps])[\s.]*([1-7])\b/gi, '$1.$2').replace(/\s+/g, ' ').trim()
    .split(' ').map(word => /^(p\.?\d|s\.?\d|mtc|sst|ple|uce|uace|cre|ire|ii?|iii|iv|vi?)$/i.test(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

export function filterResources(items: ResourceRecord[], query: string) {
  const documents = items.every(item => isDocumentFile(item.pdfUrl)) ? items : items.filter(item => isDocumentFile(item.pdfUrl));
  return searchDocuments(documents, query);
}

export function resourcePage(items: ResourceRecord[], requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / RESOURCE_PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Math.floor(requestedPage) || 1));
  return { page, totalPages, items: items.slice((page - 1) * RESOURCE_PAGE_SIZE, page * RESOURCE_PAGE_SIZE) };
}