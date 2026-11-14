import type { ResourceRecord } from './resources';

export const DOCUMENT_PAGE_SIZE = 12;
export type BrowsingContext = {
  source?: string; query?: string; page?: number; type?: string; subject?: string;
  year?: string; term?: string; kind?: string; size?: string; sort?: string; layout?: string;
};
export function browsingContext(search: Record<string, unknown>): BrowsingContext {
  const result: BrowsingContext = {};
  for (const key of ['source', 'query', 'type', 'subject', 'year', 'term', 'kind', 'size', 'sort', 'layout'] as const) {
    if (typeof search[key] === 'string') result[key] = search[key];
  }
  if (Number.isFinite(Number(search['page'])) && Number(search['page']) > 0) result.page = Math.floor(Number(search['page']));
  return result;
}
export function catalogWindow(items: ResourceRecord[], page: number, afterUrl?: string) {
  const totalPages = Math.max(1, Math.ceil(items.length / DOCUMENT_PAGE_SIZE));
  const currentPage = Math.max(1, Math.min(totalPages, page));
  const start = (currentPage - 1) * DOCUMENT_PAGE_SIZE;
  const index = afterUrl ? items.findIndex(item => item.pdfUrl === afterUrl) : -1;
  const offset = index >= start && index < start + DOCUMENT_PAGE_SIZE ? index + 1 : start;
  return { currentPage, totalPages, items: items.slice(offset, start + DOCUMENT_PAGE_SIZE) };
}