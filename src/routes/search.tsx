import { useEffect, useRef, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Clock, Search, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentGallery } from '@/components/document-gallery';
import { DocumentsSkeleton } from '@/components/documents-skeleton';
import { searchLibrary, librarySort } from '@/lib/library-search';
import { infoHead } from '@/components/info-page';

import { readRecentSearches, rememberSearch, RECENT_SEARCH_KEY, POPULAR_SEARCHES } from '@/lib/search-history';

export const Route = createFileRoute('/search')({
  staticData: { sitemap: false },
  validateSearch: (search: Record<string, unknown>) => ({ query: typeof search['query'] === 'string' ? search['query'] : '', page: Number.isFinite(Number(search['page'])) ? Math.max(1, Math.floor(Number(search['page'])) || 1) : 1, sort: librarySort(search['sort']), type: typeof search['type'] === 'string' ? search['type'] : 'all', layout: search['layout'] === 'list' ? 'list' : 'grid' }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => searchLibrary(deps.query, deps.page, 12, deps.sort, deps.type),
  head: () => infoHead('Search the Library', 'Search Fresh Teacher’s complete library of nursery, primary and secondary notes, past papers and teaching documents.'),
  pendingComponent: DocumentsSkeleton,
  pendingMs: 400,
  errorComponent: () => <p role="alert" className="p-6">Library search is unavailable. Please try again.</p>,
  notFoundComponent: () => <p className="p-6">Search page not found.</p>,
  component: LibrarySearch,
});

function LibrarySearch() {
  const { query, sort, type, layout } = Route.useSearch();
  const { items, total, page } = Route.useLoaderData();
  const [input, setInput] = useState(query);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate({ from: '/search' });

  useEffect(() => { setRecent(readRecentSearches()); }, []);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setInput(query); }, [query]);
  // Search as you type (debounced), keeping the URL shareable
  useEffect(() => {
    const value = input.trim();
    if (value === query.trim()) return;
    const timer = setTimeout(() => void navigate({ search: { query: value, page: 1, sort, type, layout }, replace: true }), 300);
    return () => clearTimeout(timer);
  }, [input, query, navigate, sort, type, layout]);
  // Remember searches that produced results
  useEffect(() => {
    const value = query.trim();
    if (!value || total === 0) return;
    const timer = setTimeout(() => setRecent(rememberSearch(value)), 1200);
    return () => clearTimeout(timer);
  }, [query, total]);
  const submit = (value: string) => { setInput(value); void navigate({ search: { query: value.trim(), page: 1, sort, type, layout } }); };
  const clearRecent = () => { setRecent([]); try { localStorage.removeItem(RECENT_SEARCH_KEY); } catch { /* Storage unavailable. */ } };
  const pages = Math.max(1, Math.ceil(total / 12));
  const goPage = (next: number) => { void navigate({ search: { query, page: next, sort, type, layout } }); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); };

  return <section className="py-6">
    <h1 className="px-6 text-2xl font-bold text-foreground">Search the Library</h1>
    <form role="search" className="ls-bar" onSubmit={event => { event.preventDefault(); submit(input); }}>
      <Search aria-hidden />
      <input ref={inputRef} type="search" enterKeyHint="search" autoComplete="off" spellCheck={false} className="ls-input" placeholder="Search notes, past papers, subjects, classes…" aria-label="Search the entire library" value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') submit(''); }} />
      {input && <Button variant="source" size="source" type="button" className="ls-clear" aria-label="Clear search" onClick={() => { submit(''); inputRef.current?.focus(); }}><X className="h-5 w-5" /></Button>}
    </form>

    {!query && <>
      {recent.length > 0 && <div className="ls-section">
        <h2>Recent searches <Button variant="source" size="source" type="button" className="normal-case tracking-normal underline" onClick={clearRecent}>Clear</Button></h2>
        <div className="ls-chips">{recent.map(value => <Button variant="source" size="source" key={value} type="button" className="ls-chip" onClick={() => submit(value)}><Clock aria-hidden />{value}</Button>)}</div>
      </div>}
      <div className="ls-section">
        <h2>Popular searches</h2>
        <div className="ls-chips">{POPULAR_SEARCHES.map(value => <Button variant="source" size="source" key={value} type="button" className="ls-chip" onClick={() => submit(value)}><TrendingUp aria-hidden />{value}</Button>)}</div>
      </div>
    </>}

    {query && <DocumentGallery key={`${query}:${page}:${sort}:${type}`} items={items} query={query} sourcePath="/search" initialContext={{ layout }} onClear={() => submit('')} onQueryChange={submit} searchResults={{ total, page, sort, type, onChange: (nextSort, nextType) => void navigate({ search: { query, page: 1, sort: librarySort(nextSort), type: nextType, layout } }) }} />}
    {total > 12 && <nav aria-label="Search result pages" className="flex items-center justify-center gap-4 py-4">
      <Button variant="outline" aria-label="Previous results" disabled={page <= 1} onClick={() => goPage(page - 1)}><ChevronLeft /></Button>
      <span>{page} / {pages}</span>
      <Button variant="outline" aria-label="Next results" disabled={page >= pages} onClick={() => goPage(page + 1)}><ChevronRight /></Button>
    </nav>}
  </section>;
}
