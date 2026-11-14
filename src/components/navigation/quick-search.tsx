import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { ArrowRight, Clock, FileText, Search, TrendingUp, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { searchLibrary, preloadLibrarySearch } from '@/lib/library-search';
import { resourceTitle, type ResourceRecord } from '@/lib/resources';
import { documentMetadata, documentSlug } from '@/lib/document-metadata';
import { POPULAR_SEARCHES, readRecentSearches, rememberSearch, RECENT_SEARCH_KEY } from '@/lib/search-history';

export function QuickSearch({ open, onOpenChange, triggerRef }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [results, setResults] = useState<{ items: ResourceRecord[]; total: number }>({ items: [], total: 0 });
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [active, setActive] = useState(-1);
  const query = input.trim();
  const suggestions = recent.length ? recent : POPULAR_SEARCHES.slice(0, 5);
  const choices = query ? results.items.length : suggestions.length;

  useEffect(() => {
    if (!open) return;
    void preloadLibrarySearch().catch(() => undefined);
    setInput(''); setRecent(readRecentSearches()); setResults({ items: [], total: 0 }); setActive(-1); setStatus('idle');
  }, [open]);

  useEffect(() => {
    if (!open || !query) { setResults({ items: [], total: 0 }); setStatus('idle'); return; }
    let cancelled = false;
    setStatus('loading'); setResults({ items: [], total: 0 }); setActive(-1);
    const timer = setTimeout(() => {
      void searchLibrary(query, 1, 5).then(value => {
        if (!cancelled) { setResults(value); setStatus('ready'); }
      }).catch(() => { if (!cancelled) setStatus('error'); });
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [open, query]);

  useEffect(() => {
    if (active >= 0) document.getElementById(`quick-search-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const viewAll = () => {
    if (query) rememberSearch(query);
    onOpenChange(false);
    void router.navigate({ to: '/search', search: { query, page: 1, sort: 'source', type: 'all', layout: 'grid' } });
  };
  const openDocument = (item: ResourceRecord) => {
    rememberSearch(query); onOpenChange(false);
    void router.navigate({ to: '/doc/$slug', params: { slug: documentSlug(item) }, search: { source: '/search', query, page: 1 } });
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogPortal>
      <DialogOverlay className="qs-overlay" />
      <DialogPrimitive.Content className="qs-dialog" aria-describedby={undefined}
        onOpenAutoFocus={event => { event.preventDefault(); inputRef.current?.focus(); }}
        onCloseAutoFocus={event => { event.preventDefault(); triggerRef.current?.focus(); }}>
        <div className="qs-heading"><DialogTitle className="qs-title">Search the library</DialogTitle>
          <Button variant="source" size="source" className="qs-icon" aria-label="Close search" title="Close search" onClick={() => onOpenChange(false)}><X /></Button>
        </div>
        <form className="qs-form" role="search" onSubmit={event => { event.preventDefault(); viewAll(); }}>
          <Search aria-hidden="true" />
          <input ref={inputRef} value={input} type="search" autoComplete="off" spellCheck={false} enterKeyHint="search"
            placeholder="Subject, class or document…" aria-label="Quick search" role="combobox" aria-autocomplete="list"
            aria-expanded={choices > 0} aria-controls="quick-search-options" aria-activedescendant={active >= 0 ? `quick-search-option-${active}` : undefined}
            onChange={event => { setInput(event.target.value); setResults({ items: [], total: 0 }); setActive(-1); setStatus(event.target.value.trim() ? 'loading' : 'idle'); }}
            onKeyDown={event => {
              if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && choices > 0) {
                event.preventDefault(); setActive(previous => event.key === 'ArrowDown' ? (previous + 1) % choices : (previous <= 0 ? choices - 1 : previous - 1));
              }
              if (event.key === 'Enter' && active >= 0) {
                event.preventDefault(); const item = results.items[active]; const suggestion = suggestions[active];
                if (query && item) openDocument(item);
                else if (!query && suggestion) { setInput(suggestion); setActive(-1); }
              }
              else if (event.key === 'Enter') { event.preventDefault(); viewAll(); }
            }} />
          {input && <Button type="button" variant="source" size="source" className="qs-icon" aria-label="Clear quick search" title="Clear search" onClick={() => { setInput(''); setActive(-1); inputRef.current?.focus(); }}><X /></Button>}
        </form>
        <div className="qs-results">
          <div className="qs-label">{query ? 'Documents' : recent.length ? 'Recent searches' : 'Popular searches'}
            {!query && recent.length > 0 && <Button variant="source" size="source" onClick={() => { try { localStorage.removeItem(RECENT_SEARCH_KEY); } catch { /* Storage unavailable. */ } setRecent([]); }}>Clear</Button>}
          </div>
          <div role="status" className="qs-status">
            {status === 'loading' && 'Searching…'}
            {status === 'error' && 'Search is unavailable. Please try again.'}
            {status === 'ready' && (results.total ? `${results.total.toLocaleString()} documents found` : `No documents found for “${query}”. Try another subject or class.`)}
          </div>
          <div id="quick-search-options" role="listbox" aria-label={query ? 'Suggested documents' : 'Suggested searches'} aria-busy={status === 'loading'}>
            {query ? results.items.map((item, index) => {
              const meta = documentMetadata(item);
              return <Button variant="source" size="source" className="qs-option" key={item.pdfUrl} role="option" id={`quick-search-option-${index}`} aria-selected={active === index}
                onClick={() => openDocument(item)}><FileText aria-hidden="true" /><span><strong>{resourceTitle(item)}</strong><small>{[meta.level, meta.subject, meta.kind, meta.year].filter(Boolean).join(' · ') || 'Document'}</small></span><ArrowRight aria-hidden="true" /></Button>;
            }) : suggestions.map((value, index) => <Button variant="source" size="source" className="qs-option" key={value} role="option" id={`quick-search-option-${index}`} aria-selected={active === index}
              onClick={() => { setInput(value); setActive(-1); }}>{recent.length ? <Clock aria-hidden="true" /> : <TrendingUp aria-hidden="true" />}<span>{value}</span><ArrowRight aria-hidden="true" /></Button>)}
          </div>
        </div>
        <Button variant="source" size="source" className="qs-all" onClick={viewAll}>{query && results.total > 0 ? `View all ${results.total.toLocaleString()} results` : 'Browse full search'}<ArrowRight aria-hidden="true" /></Button>
      </DialogPrimitive.Content>
    </DialogPortal>
  </Dialog>;
}