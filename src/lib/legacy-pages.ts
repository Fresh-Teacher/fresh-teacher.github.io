import type { ResourceRecord } from './resources';
import { searchDocuments } from './document-search';

export interface LegacyPageData {
  title: string;
  description: string;
  template: string;
  styles: string;
  items: ResourceRecord[];
  mode: 'static' | 'infinite' | 'paginated';
  missingData: string | null;
  links: string[];
}

export const LEGACY_BATCH_SIZE = 12;

export function legacySearch(items: ResourceRecord[], query: string) {
  return searchDocuments(items, query);
}

export function legacyVisible(items: ResourceRecord[], batches: number) {
  return items.slice(0, Math.max(1, batches) * LEGACY_BATCH_SIZE);
}

export function legacyGreeting(hour: number) {
  return hour >= 5 && hour < 12 ? 'Hello, good morning!' : hour >= 12 && hour < 18 ? 'Hello, good afternoon!' : 'Hello, good evening!';
}