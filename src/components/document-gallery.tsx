import { isViewerLoading, showViewerLoading } from '@/lib/viewer-loading';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, FileText, LayoutGrid, List, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ArrowRight, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { resourceTitle, type ResourceRecord } from '@/lib/resources';
import { pdfThumbnail, pdfPageCount } from '@/lib/pdf-thumbs';
import { fileSize, formatSize } from '@/lib/file-sizes';
import { Link, useLocation } from '@tanstack/react-router';
import { catalogWindow, type BrowsingContext } from '@/lib/document-browsing';
import { documentMetadata, documentSlug } from '@/lib/document-metadata';
import { searchTokens, suggestedSearch } from '@/lib/document-search';
import { DocumentDownload, DocumentShare } from '@/components/document-actions';
import { documentViewer } from '@/lib/document-viewer';
import { LogoLoader } from '@/components/logo-loader';
import { documentPlaceholder } from '@/lib/document-placeholder';
import styles from '@/styles/document-gallery.css?raw';
import { AdBanner } from './ad-banner';
import { showCatalogAd } from '@/lib/manual-ads';

type Layout = 'grid' | 'list';
type SizeBand = 'all' | 'small' | 'medium' | 'large';
type Sort = 'source' | 'title-asc' | 'title-desc' | 'size-asc' | 'size-desc';

function extension(url: string) {
  const name = url.substring(url.lastIndexOf('/') + 1).split('?')[0] ?? '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.substring(dot + 1).toUpperCase() : 'FILE';
}

function sizeBand(bytes: number | null | undefined): SizeBand | null {
  if (bytes == null) return null;
  if (bytes < 1024 * 1024) return 'small';
  if (bytes < 5 * 1024 * 1024) return 'medium';
  return 'large';
}

const thumbListeners = new WeakMap<Element, (visible: boolean) => void>();
let thumbObserver: IntersectionObserver | undefined;
let thumbObserverType: typeof IntersectionObserver | undefined;
function observeThumb(node: Element, listener: (visible: boolean) => void) {
  if (thumbObserverType !== IntersectionObserver) { thumbObserver = undefined; thumbObserverType = IntersectionObserver; }
  thumbObserver ??= new IntersectionObserver(entries => {
    for (const entry of entries) thumbListeners.get(entry.target)?.(entry.isIntersecting);
  }, { rootMargin: '100px' });
  thumbListeners.set(node, listener);
  thumbObserver.observe(node);
  return () => { thumbListeners.delete(node); thumbObserver?.unobserve(node); };
}

function Thumb({ url, initialFeedback }: { url: string; initialFeedback: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [nearby, setNearby] = useState<boolean | null>(null);
  const viewer = documentViewer(url);
  const isPdf = viewer.kind === 'pdf';
  const pdfSrc = viewer.kind === 'pdf' ? viewer.src : url;
  const [pages, setPages] = useState<number>();
  // The first row has feedback in static HTML, before observers or React run.
  // Actual PDF work is still exclusively started by viewport proximity.
  const showLoading = (nearby ?? initialFeedback) && !loaded && !failed && isPdf;
  const placeholder = documentPlaceholder(url);
  useEffect(() => {
    setSrc(null); setFailed(false); setLoaded(false); setNearby(null); setPages(undefined);
    if (!isPdf) return;
    const node = ref.current;
    if (!node) return;
    let cancelled = false;
    const start = () => {
      setNearby(true);
      void pdfThumbnail(pdfSrc).then(result => {
        if (cancelled) return;
        setPages(pdfPageCount(pdfSrc));
        if (result) setSrc(result); else setFailed(true);
      }).catch(() => { if (!cancelled) setFailed(true); });
    };
    if (typeof IntersectionObserver === 'undefined') {
      start();
      return () => { cancelled = true; };
    }
    let stop = () => {};
    stop = observeThumb(node, visible => {
      if (visible) { stop(); start(); } else setNearby(false);
    });
    return () => { cancelled = true; stop(); };
  }, [pdfSrc, isPdf]);
  return <div ref={ref} className="dg-thumb">
    {(!loaded || failed || !isPdf) && <div className="dg-thumb-placeholder">{placeholder ? <img className="dg-file-logo" src={placeholder.url} alt="" /> : <FileText aria-hidden="true" size={40} strokeWidth={1.2} />}</div>}
    {src && !failed && <img className={`dg-thumb-cover${loaded ? ' dg-thumb-cover-ready' : ''}`} src={src} alt="" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
    {showLoading && <div className="dg-thumb-loading"><LogoLoader label="Loading document thumbnail…" /></div>}
    <span className="dg-badge">{extension(url)}</span>
    {pages && <span className="dg-page-count">{pages} pages</span>}
  </div>;
}

export function DocumentGallery({ items, sourceItems = items, onView, query = '', onClear, onQueryChange, sourcePath, initialContext = {}, afterUrl, searchResults, ads = true }: { items: ResourceRecord[]; sourceItems?: ResourceRecord[]; onView?: (element: HTMLElement, item: ResourceRecord) => void; query?: string; onClear?: () => void; onQueryChange?: (value: string) => void; sourcePath?: string; initialContext?: BrowsingContext; afterUrl?: string; ads?: boolean; searchResults?: { total: number; page: number; sort: string; type: string; onChange: (sort: string, type: string) => void } }) {
  const location = useLocation();
  useEffect(() => {
    if (!onView) return;
    const warm = () => { void import('@/lib/resource-viewer').then(m => m.preloadResourceViewer()).catch(() => undefined); };
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) { const id = w.requestIdleCallback(warm, { timeout: 2500 }); return () => w.cancelIdleCallback?.(id); }
    const id = window.setTimeout(warm, 1500); return () => window.clearTimeout(id);
  }, [onView]);
  const source = sourcePath ?? location.pathname.replace(/^\//, '');
  const [layout, setLayout] = useState<Layout>(initialContext.layout === 'list' ? 'list' : 'grid');
  const [type, setType] = useState(initialContext.type ?? 'all');
  const [subject, setSubject] = useState(initialContext.subject ?? 'all');
  const [year, setYear] = useState(initialContext.year ?? 'all');
  const [term, setTerm] = useState(initialContext.term ?? 'all');
  const [kind, setKind] = useState(initialContext.kind ?? 'all');
  const [size, setSize] = useState<SizeBand>(['small', 'medium', 'large'].includes(initialContext.size ?? '') ? initialContext.size as SizeBand : 'all');
  const [sort, setSort] = useState<Sort>(['title-asc', 'title-desc', 'size-asc', 'size-desc'].includes(initialContext.sort ?? '') ? initialContext.sort as Sort : 'source');
  const initialPage = initialContext.page ?? (afterUrl ? Math.floor(Math.max(0, items.findIndex(item => item.pdfUrl === afterUrl)) / 12) + 1 : 1);
  const [page, setPage] = useState(initialPage);
  const [jump, setJump] = useState(String(initialPage));
  const [continueAfter, setContinueAfter] = useState(afterUrl);
  const previousFilters = useRef({ items, type, subject, year, term, kind, size, sort });
  const [sizes, setSizes] = useState<Record<string, number | null>>({});
  const [backToTop, setBackToTop] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const metadata = useMemo(() => new Map(items.map(item => [item, documentMetadata(item)])), [items]);
  const types = useMemo(() => Array.from(new Set(items.map(item => extension(item.pdfUrl)))).sort(), [items]);
  const needsSizes = size !== 'all' || sort.startsWith('size');
  const sizeFilterData = needsSizes ? sizes : undefined;
  const filtered = useMemo(() => {
    const sizes = sizeFilterData ?? {};
    if (searchResults) return items;
    let list = items.filter(item => {
      const meta = metadata.get(item);
      return (type === 'all' || extension(item.pdfUrl) === type) && (subject === 'all' || meta?.subject === subject) &&
        (year === 'all' || meta?.year === year) && (term === 'all' || meta?.term === term) &&
        (kind === 'all' || meta?.kind === kind) && (size === 'all' || sizeBand(sizes[item.pdfUrl]) === size);
    });
    if (sort !== 'source') list = [...list].sort((a, b) => {
      if (sort === 'title-asc') return resourceTitle(a).localeCompare(resourceTitle(b));
      if (sort === 'title-desc') return resourceTitle(b).localeCompare(resourceTitle(a));
      const av = sizes[a.pdfUrl], bv = sizes[b.pdfUrl];
      if (av == null) return bv == null ? 0 : 1;
      if (bv == null) return -1;
      return sort === 'size-asc' ? av - bv : bv - av;
    });
    return list;
  }, [items, metadata, type, subject, year, term, kind, size, sizeFilterData, sort, searchResults]);
  const { totalPages, currentPage, items: pageItems } = searchResults ? { totalPages: Math.max(1, Math.ceil(searchResults.total / 12)), currentPage: searchResults.page, items } : catalogWindow(filtered, page, continueAfter);
  const search: BrowsingContext = { source, query, page: currentPage, type: searchResults?.type ?? type, subject, year, term, kind, size, sort: searchResults?.sort ?? sort, layout };
  useEffect(() => {
    const previous = previousFilters.current;
    previousFilters.current = { items, type, subject, year, term, kind, size, sort };
    if (previous.items === items && previous.type === type && previous.subject === subject && previous.year === year && previous.term === term && previous.kind === kind && previous.size === size && previous.sort === sort) return;
    setPage(1); setJump('1'); setContinueAfter(undefined);
  }, [items, type, subject, year, term, kind, size, sort]);
  useEffect(() => {
    const scroll = () => setBackToTop(window.scrollY > 500);
    window.addEventListener('scroll', scroll, { passive: true }); scroll();
    return () => window.removeEventListener('scroll', scroll);
  }, []);
  useEffect(() => {
    let cancelled = false;
    const targets = size !== 'all' || sort.startsWith('size') ? items : pageItems;
    void (async () => {
      for (let i = 0; i < targets.length; i += 4) {
        if (cancelled) return;
        const batch = targets.slice(i, i + 4);
        const values = await Promise.all(batch.map(item => fileSize(item.pdfUrl)));
        if (!cancelled) setSizes(previous => { const next = { ...previous }; batch.forEach((item, index) => { next[item.pdfUrl] = values[index] ?? null; }); return next; });
      }
    })();
    return () => { cancelled = true; };
  }, [items, currentPage, size, sort, subject, year, term, kind, type]);
  const reset = () => { setType('all'); setSubject('all'); setYear('all'); setTerm('all'); setKind('all'); setSize('all'); setSort('source'); onClear?.(); };
  const go = (value: number) => { const next = Math.max(1, Math.min(totalPages, value || 1)); setContinueAfter(undefined); setPage(next); setJump(String(next)); top.current?.scrollIntoView({ block: 'start' }); };
  const suggestions = filtered.length === 0 && query ? suggestedSearch(sourceItems, query) : [];
  return <div className="dg" ref={top}>
    <style>{styles}</style>
    <div className="dg-toolbar">
      <div className="dg-toolbar-row"><p className="dg-count" aria-live="polite">{(searchResults?.total ?? filtered.length).toLocaleString()} documents{query ? ` for “${query}”` : ''}</p>
        <div className="dg-layout-toggle" role="group" aria-label="Choose layout">{(['list', 'grid'] as const).map(mode => <Button variant="source" size="source" key={mode} className={layout === mode ? 'dg-active' : ''} aria-pressed={layout === mode} aria-label={`${mode === 'list' ? 'List' : 'Grid'} view`} title={`${mode} view`} onClick={() => setLayout(mode)}>{mode === 'list' ? <List size={20} /> : <LayoutGrid size={20} />}</Button>)}</div>
      </div>
      <div className="dg-filters">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="source" size="source" className="dg-chip dg-sort-trigger">Sort by <ChevronDown size={16} aria-hidden="true" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="dg-sort-menu" collisionPadding={8}>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="dg-sort-option">Type</DropdownMenuSubTrigger>
              <DropdownMenuPortal><DropdownMenuSubContent className="dg-sort-submenu" collisionPadding={8}>
                <DropdownMenuRadioGroup value={searchResults?.type ?? type} onValueChange={value => searchResults ? searchResults.onChange(searchResults.sort, value) : setType(value)}>
                  <DropdownMenuRadioItem className="dg-sort-option" value="all">All types</DropdownMenuRadioItem>
                  {(searchResults ? ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX', 'RTF', 'TXT', 'ODT'] : types).map(value => <DropdownMenuRadioItem className="dg-sort-option" key={value} value={value}>{value}</DropdownMenuRadioItem>)}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent></DropdownMenuPortal>
            </DropdownMenuSub>
            {!searchResults && <DropdownMenuSub>
              <DropdownMenuSubTrigger className="dg-sort-option">Size</DropdownMenuSubTrigger>
              <DropdownMenuPortal><DropdownMenuSubContent className="dg-sort-submenu" collisionPadding={8}>
                <DropdownMenuRadioGroup value={size} onValueChange={value => setSize(value as SizeBand)}>
                  <DropdownMenuRadioItem className="dg-sort-option" value="all">All sizes</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem className="dg-sort-option" value="small">Under 1 MB</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem className="dg-sort-option" value="medium">1–5 MB</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem className="dg-sort-option" value="large">5 MB and over</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent></DropdownMenuPortal>
            </DropdownMenuSub>}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="dg-sort-option">Order</DropdownMenuSubTrigger>
              <DropdownMenuPortal><DropdownMenuSubContent className="dg-sort-submenu" collisionPadding={8}>
                <DropdownMenuRadioGroup value={searchResults?.sort ?? sort} onValueChange={value => searchResults ? searchResults.onChange(value, searchResults.type) : setSort(value as Sort)}>
                  <DropdownMenuRadioItem className="dg-sort-option" value="source">{query ? 'Best match' : 'Original order'}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem className="dg-sort-option" value="title-asc">Title A–Z</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem className="dg-sort-option" value="title-desc">Title Z–A</DropdownMenuRadioItem>
                  {!searchResults && <><DropdownMenuRadioItem className="dg-sort-option" value="size-asc">Smallest first</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem className="dg-sort-option" value="size-desc">Largest first</DropdownMenuRadioItem></>}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent></DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="dg-sort-option" onSelect={() => searchResults ? searchResults.onChange('source', 'all') : reset()}><RotateCcw size={15} /> Reset</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    {pageItems.length === 0 ? <div className="dg-empty" role="status">{filtered.length > 0 ? <p>{currentPage < totalPages ? 'Continue to the next page for more documents.' : 'You have reached the end of this catalog.'}</p> : <><p>No matching documents.</p>{suggestions.length > 0 && <div>Did you mean? {suggestions.map(value => <Button key={value} variant="source" size="source" className="dg-chip" onClick={() => onQueryChange?.(value)}>{value}</Button>)}</div>}<Button variant="source" size="source" className="dg-chip" onClick={reset}>Clear filters</Button></>}</div> :
      <div className={`dg-cards dg-${layout}`}>{pageItems.map((item, index) => {
        return <Fragment key={`${item.pdfUrl}-${index}`}><article className="dg-card"><Link to="/doc/$slug" params={{ slug: documentSlug(item) }} search={search} className="dg-thumb-link" aria-label={`Open ${resourceTitle(item)}`}><Thumb url={item.pdfUrl} initialFeedback={index < 4} /></Link><div className="dg-card-body">
          <h3 className="dg-card-title"><Link to="/doc/$slug" params={{ slug: documentSlug(item) }} search={search}><HighlightedTitle item={item} query={query} /></Link></h3>
          <p className="dg-card-meta"><span className="dg-card-size">{sizes[item.pdfUrl] != null ? formatSize(sizes[item.pdfUrl] ?? 0) : '\u00a0'}</span></p>
          <div className="dg-card-actions">{onView && documentViewer(item.pdfUrl).kind === 'pdf' ? <Button variant="source" size="source" className="dg-action dg-view" style={{ touchAction: 'manipulation' }} onPointerDown={() => { void import('@/lib/resource-viewer').then(m => m.preloadResourceViewer()).catch(() => undefined); }} onClick={event => { if (event.currentTarget.dataset['viewerReady']) return; if (isViewerLoading()) return; showViewerLoading(); onView(event.currentTarget, item); }}><BookOpen size={16} /> View</Button> : <Button asChild variant="source" size="source" className="dg-action dg-view"><Link to="/doc/$slug" params={{ slug: documentSlug(item) }} search={search}><BookOpen size={16} /> View</Link></Button>}<DocumentDownload item={item} /><DocumentShare item={item} /></div>
        </div></article>{ads && showCatalogAd(index, pageItems.length) && <AdBanner key={`${source}-${currentPage}-${query}`} placement="catalog" identity={`${source}-${currentPage}-${query}-${sort}-${type}`} />}</Fragment>;
      })}</div>}
    {!searchResults && filtered.length > 0 && <nav className="dg-pagination" aria-label="Document pages"><Button variant="source" size="source" className="dg-icon" title="Previous page" aria-label="Previous page" disabled={currentPage === 1} onClick={() => go(currentPage - 1)}><ChevronLeft /></Button>
      {Array.from(new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])).filter(value => value > 0 && value <= totalPages).sort((a, b) => a - b).map((value, index, pages) => <Fragment key={value}>{index > 0 && value - (pages[index - 1] ?? 0) > 1 && <span>…</span>}<Button variant="source" size="source" className={`dg-icon ${value === currentPage ? 'dg-selected' : ''}`} aria-label={`Page ${value}`} aria-current={value === currentPage ? 'page' : undefined} onClick={() => go(value)}>{value}</Button></Fragment>)}
      <Button variant="source" size="source" className="dg-icon" title="Next page" aria-label="Next page" disabled={currentPage === totalPages} onClick={() => go(currentPage + 1)}><ChevronRight /></Button>
      <form onSubmit={event => { event.preventDefault(); go(Number(jump)); }}><label>Go to page <input type="number" min="1" max={totalPages} value={jump} onChange={event => setJump(event.target.value)} aria-label="Go to page" /></label><Button variant="source" size="source" className="dg-icon" type="submit" aria-label="Jump to page" title="Jump to page"><ArrowRight /></Button></form><span>Page {currentPage} of {totalPages}</span>
    </nav>}
    {backToTop && <Button variant="source" size="source" className="dg-back-top dg-icon" aria-label="Back to top" title="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><ArrowUp /></Button>}
  </div>;
}

function HighlightedTitle({ item, query }: { item: ResourceRecord; query: string }) {
  const tokens = searchTokens(query);
  return <>{resourceTitle(item).split(/(\s+)/).map((word, index) => tokens.length > 0 && searchTokens(word).some(token => tokens.some(term => token === term || (term.length >= 3 && token.startsWith(term)))) ? <mark key={index}>{word}</mark> : word)}</>;
}
