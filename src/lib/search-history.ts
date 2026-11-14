export const RECENT_SEARCH_KEY = 'library-recent-searches';
export const POPULAR_SEARCHES = ['Mathematics', 'English', 'Science', 'Social Studies', 'Past papers', 'Lesson notes', 'Schemes of work', 'Holiday work'];

export function readRecentSearches(): string[] {
  try {
    const values: unknown = JSON.parse(localStorage.getItem(RECENT_SEARCH_KEY) ?? '[]');
    return Array.isArray(values) ? values.filter((value): value is string => typeof value === 'string').slice(0, 6) : [];
  } catch { return []; }
}

export function rememberSearch(value: string): string[] {
  const query = value.trim();
  const recent = readRecentSearches();
  if (!query) return recent;
  const next = [query, ...recent.filter(item => item.toLowerCase() !== query.toLowerCase())].slice(0, 6);
  try { localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next)); } catch { /* Search works without storage. */ }
  return next;
}