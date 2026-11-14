import { Fragment, useEffect, useMemo, useRef, useState, useDeferredValue } from 'react';
import { Element, domToReact, attributesToProps, htmlToDOM, type HTMLReactParserOptions, type DOMNode } from 'html-react-parser';

// Parse each source fragment once; re-renders reuse the tree instead of re-parsing ~80KB of HTML.
const domCache = new Map<string, DOMNode[]>();
const parsedDom = (html: string) => {
  let dom = domCache.get(html);
  if (!dom) { dom = htmlToDOM(html) as DOMNode[]; domCache.set(html, dom); }
  return dom;
};
import { Button } from '@/components/ui/button';
import { DocumentGallery } from '@/components/document-gallery';
import { type ResourceRecord } from '@/lib/resources';
import { legacyGreeting, legacySearch, type LegacyPageData } from '@/lib/legacy-pages';
import repairs from '@/styles/legacy-repairs.css?raw';
import { DocumentSearchInput } from '@/components/document-search-input';
import { moreDocumentsHref, type MoreDocumentsRepo } from '@/data/more-documents';
import { addClassResourceMenus } from '@/lib/class-resource-menus';

export function LegacyPage({ data, fragments, moreDocuments }: { data: LegacyPageData; fragments: Record<string, string>; moreDocuments?: MoreDocumentsRepo[] | undefined }) {
  const [query, setQuery] = useState('');
  // Typing stays instant; heavy search and list re-rendering follow at lower priority.
  const deferredQuery = useDeferredValue(query);
  const [greeting, setGreeting] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dropdown, setDropdown] = useState<string | null>(null);
  const dropdownTrigger = useRef<HTMLElement>(null);
  const [sidebar, setSidebar] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [door, setDoor] = useState(false);
  const [viewerError, setViewerError] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const queryResult = useMemo(() => legacySearch(data.items, deferredQuery), [data.items, deferredQuery]);

  useEffect(() => {
    setGreeting(legacyGreeting(new Date().getHours()));
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setExpanded(new Set()); setDropdown(null); dropdownTrigger.current?.focus(); } };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, []);

  useEffect(() => {
    if (dropdown === null) return;
    const dismiss = (event: MouseEvent) => {
      const target = event.target;
      const group = dropdownTrigger.current?.parentElement;
      // Switching is handled atomically by click; do not move the pressed target mid-tap.
      if (target instanceof window.Element && target.closest('.legacy-dropdown-trigger')) return;
      if (!(target instanceof Node) || !group?.contains(target)) setDropdown(null);
    };
    // Dismiss on click (after the tap completes) so links inside menus navigate first.
    document.addEventListener('click', dismiss, true);
    return () => document.removeEventListener('click', dismiss, true);
  }, [dropdown]);

  // Repair only the audited malformed input: its embedded icon closes the input
  // early and leaves the placeholder sentence as visible text outside the bar.
  const repairSearchMarkup = (html: string) => html.replace(/<input\b(?=[^>]*\bid="searchInput")[^\n]*?<\/i>\s*Type a keyword here to search\.\.\."\s*type="text"\s*\/>/g, '<input id="searchInput" type="search"/>');
  const originalSource = repairSearchMarkup(fragments[data.template] ?? '');
  const source = moreDocuments ? addClassResourceMenus(originalSource) : originalSource;
  const nodeText = (node: DOMNode): string => 'data' in node ? node.data : 'children' in node ? (node.children as DOMNode[]).map(nodeText).join(' ') : '';
  const groupKey = (node: Element) => nodeText(node).trim();
  const isMoreDocuments = (node: Element) => /MORE\s+(?:DOCUMENTS|ITEMS)/i.test(nodeText(node));
  const dropdownKeys = new WeakMap<Element, string>();
  let dropdownIndex = 0;
  const dropdownKey = (node: Element) => {
    const existing = dropdownKeys.get(node);
    if (existing !== undefined) return existing;
    const key = `dropdown-${dropdownIndex++}`;
    dropdownKeys.set(node, key);
    return key;
  };
  const toggle = (key: string) => setExpanded(current => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  const view = async (element: HTMLElement, item: ResourceRecord) => {
    try {
      setViewerError('');
      const { openResourceViewer } = await import('@/lib/resource-viewer');
      await openResourceViewer(element, item, data.mode === 'infinite');
    } catch { void import('@/lib/viewer-loading').then(m => m.hideViewerLoading()); setViewerError('The file viewer could not load. You can still download the file.'); }
  };
  const children = (node: Element) => domToReact(node.children as DOMNode[], options);
  const cards = <>
    {data.missingData
      ? <p role="status">This page’s original file list is currently unavailable.</p>
      : <DocumentGallery items={queryResult} sourceItems={data.items} query={deferredQuery} onQueryChange={setQuery} onClear={() => setQuery('')} onView={(element, item) => void view(element, item)} />}
    {viewerError && <p role="alert">{viewerError}</p>}
  </>;
  const options: HTMLReactParserOptions = { replace(node) {
    if (!(node instanceof Element)) return;
    const props = attributesToProps(node.attribs);
    const id = node.attribs['id'];
    const classes = node.attribs['class'] ?? '';
    // LibraryShell owns the only footer; keep audited fragments unchanged.
    if (node.name === 'footer' || classes.split(' ').includes('footer')) return <></>;
    if (node.name === 'div' && node.children.some(child => child instanceof Element && child.attribs['id'] === 'jumpToPage')) return <></>;
    if ((node.name === 'nav' && classes.includes('navbar')) || classes.split(' ').includes('sidebar')) return <></>;
    if (node.name === 'fresh-fragment') return <>{domToReact(parsedDom(repairSearchMarkup(fragments[node.attribs['data-key'] ?? ''] ?? '')), options)}</>;
    if (id === 'searchInput' || id === 'search') return <DocumentSearchInput id={id} query={query} onChange={setQuery} items={data.items} />;
    if (id === 'cardsContainer') return <div {...props}>{cards}</div>;
    if (data.mode === 'paginated' && classes === 'row') return <div {...props}>{cards}</div>;
    if (id === 'noMoreResults' || id === 'previousPageBtn' || id === 'nextPageBtn' || id === 'pageNumbers' || id === 'jumpToPage' || id === 'jumpButton') return <></>;
    if (id === 'greeting') {
      const icon = greeting.includes('morning') ? ['sun', '#f59e0b'] : greeting.includes('afternoon') ? ['cloud-sun', '#fb923c'] : ['moon', '#818cf8'];
      return <div {...props}>{greeting}{greeting && <> <i className={`fa-solid fa-${icon[0]}`} style={{ color: icon[1] }} aria-hidden="true" /></>}</div>;
    }
    // The shared WhatsApp chat (LibraryShell) replaces each page's captured copy.
    if (id === 'africavotes-chat' || classes.includes('africaVotesChat') || classes.includes('contactWhatsapp')) return <></>;
    if (classes.includes('rope')) return <Button {...props} variant="source" size="source" className={`${classes} legacy-control ${door ? 'legacy-rope-open' : ''}`} aria-label="Open library" onClick={() => setDoor(true)}>{children(node)}</Button>;
    if (classes.includes('leftcurtain') || classes.includes('rightcurtain')) return <div {...props} role="button" aria-label="Open library" tabIndex={door ? -1 : 0} onClick={() => setDoor(true)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setDoor(true); } }} className={`${classes} ${door ? 'legacy-door-open' : ''}`}>{children(node)}</div>;
    if (node.name === 'a' && classes.includes('open-close')) return <Button {...props} variant="source" size="source" className={`${classes} legacy-control`} aria-label="Toggle class menu" onClick={() => { if (window.innerWidth <= 575) { setMobileSidebar(value => !value); setSidebar(true); } else setSidebar(value => !value); }}>{children(node)}</Button>;
    if (classes.split(' ').includes('sidebar')) return <div {...props} className={`${classes} ${sidebar ? '' : 'legacy-sidebar-closed'}`}>{children(node)}</div>;
    if (classes.includes('store-product')) {
      if (!nodeText(node).toLowerCase().includes(deferredQuery.toLowerCase())) return <></>;
      return <div {...props}>{children(node)}</div>;
    }
    if (node.attribs['data-toggle'] === 'dropdown' && node.parent instanceof Element) {
      const key = dropdownKey(node.parent);
      const activate = (element: HTMLElement) => { dropdownTrigger.current = element; setDropdown(current => current === key ? null : key); };
      const label = moreDocuments && isMoreDocuments(node) ? <b>MORE ITEMS</b> : children(node);
      if (node.name === 'button') return <Button {...props} type="button" variant="source" size="source" className={`${classes} legacy-control legacy-dropdown-trigger`} aria-expanded={dropdown === key} onClick={event => activate(event.currentTarget)}>{label}</Button>;
      return <Button asChild variant="source" size="source"><a {...props} className={`${classes} legacy-control legacy-dropdown-trigger`} href="#" role="button" aria-expanded={dropdown === key} onClick={event => { event.preventDefault(); activate(event.currentTarget); }} onKeyDown={event => { if (event.key === ' ') { event.preventDefault(); activate(event.currentTarget); } }}>{children(node)}</a></Button>;
    }
    if (classes.split(' ').includes('dropdown-menu') && node.parent instanceof Element) {
      const opened = dropdown === dropdownKey(node.parent);
      const content = moreDocuments && isMoreDocuments(node.parent) ? moreDocuments.map((item, index) => <Fragment key={item.repo}>{index > 0 && <li className="divider" style={{ marginTop: 0, marginBottom: 0 }} />}<li><a href={moreDocumentsHref(item.repo)}>{item.label}</a></li></Fragment>) : children(node);
      return <ul {...props} hidden={!opened} className={`${classes} ${opened ? 'legacy-panel-open' : 'legacy-dropdown-closed'}`} onClick={event => { if (event.target instanceof window.Element && event.target.closest('a[href]')) setDropdown(null); }}>{content}</ul>;
    }
    const isToggle = node.name === 'a' && node.attribs['href'] === '#' && node.parent instanceof Element && node.parent.children.some(child => child instanceof Element && ['ul', 'div'].includes(child.name));
    if (isToggle) {
      const key = node.parent instanceof Element ? groupKey(node.parent) : nodeText(node);
      return <Button asChild variant="source" size="source" className={`${classes} legacy-control`}><a {...props} href="#" role="button" aria-expanded={expanded.has(key)} onClick={event => { event.preventDefault(); toggle(key); }}>{children(node)}</a></Button>;
    }
    if ((classes.includes('dropdown-menu') || classes.includes('collapse') || classes.includes('nav-second-level') || classes.includes('nav-third-level')) && node.parent instanceof Element && expanded.has(groupKey(node.parent))) return <ul {...props} className={`${classes} legacy-panel-open`}>{children(node)}</ul>;
    if (node.name === 'button') return <Button {...props} variant="source" size="source" className={`${classes} legacy-control`}>{children(node)}</Button>;
    if (node.name === 'form') return <form {...props} onSubmit={event => event.preventDefault()}>{children(node)}</form>;
    return undefined;
  } };
  return <div ref={root} className={`legacy-page ${data.mode === 'static' ? 'legacy-selection' : ''} ${sidebar ? '' : 'legacy-sidebar-hidden'} ${mobileSidebar ? 'legacy-sidebar-mobile-open' : ''}`}><style>{fragments[data.styles]}</style><style>{repairs}</style>{domToReact(parsedDom(source), options)}</div>;
}