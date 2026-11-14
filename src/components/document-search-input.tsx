import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowRight, FileText, Search, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { filterResources, resourceTitle, type ResourceRecord } from '@/lib/resources';
import { documentMetadata } from '@/lib/document-metadata';

export function DocumentSearchInput({ query, onChange, id, items = [] }: { query: string; onChange: (value: string) => void; id?: string; items?: ResourceRecord[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [settledQuery, setSettledQuery] = useState(query);
  const searching = query !== settledQuery;
  useEffect(() => {
    const timer = setTimeout(() => setSettledQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);
  const matches = useMemo(() => filterResources(items, settledQuery), [items, settledQuery]);
  const suggestions = useMemo(() => Array.from(new Set(items.flatMap(item => {
    const meta = documentMetadata(item);
    return [meta.subject, meta.kind].filter((value): value is string => Boolean(value));
  }))).slice(0, 5), [items]);
  const hasQuery = Boolean(query.trim());
  const choices = searching ? [] : hasQuery ? matches.slice(0, 5).map(item => ({ value: resourceTitle(item), item })) : suggestions.map(value => ({ value, item: undefined }));
  const expanded = open && items.length > 0;
  const choose = (value: string) => { onChange(value); setActive(-1); inputRef.current?.focus(); setOpen(false); };
  return <div className="dg-search-shell" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActive(-1); } }}>
    <div className="dg-search" role="search" aria-label="Search documents on this page">
      <Search size={20} aria-hidden="true" />
      <input ref={inputRef} id={id} type="search" role="combobox" aria-label="Search these documents" placeholder="Search these documents…" autoComplete="off" spellCheck={false} enterKeyHint="search"
        aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? listId : undefined} aria-activedescendant={expanded && active >= 0 && choices[active] ? `${listId}-${active}` : undefined}
        value={query} onFocus={() => setOpen(true)} onChange={event => { onChange(event.target.value); setActive(-1); setOpen(true); }}
        onKeyDown={event => {
          if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && choices.length) {
            event.preventDefault(); setOpen(true); setActive(previous => event.key === 'ArrowDown' ? (previous + 1) % choices.length : previous <= 0 ? choices.length - 1 : previous - 1);
          } else if (event.key === 'Enter') {
            event.preventDefault(); const choice = expanded ? choices[active] : undefined;
            if (choice) choose(choice.value); else { setOpen(false); setActive(-1); }
          } else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(-1); }
        }} />
      {query && <Button type="button" variant="source" size="source" className="dg-icon" aria-label="Clear search" title="Clear search" onClick={() => { onChange(''); setActive(-1); setOpen(true); inputRef.current?.focus(); }}><X size={18} /></Button>}
    </div>
    {expanded && <div className="dg-search-panel">
      <p className="dg-search-label">{hasQuery ? 'Matching documents' : 'Subjects & document types'}</p>
      <div role="status" className="dg-search-status">{searching ? 'Searching…' : hasQuery ? matches.length ? `${matches.length.toLocaleString()} documents found on this page` : 'No matching documents. Try another subject or keyword.' : ''}</div>
      <div id={listId} role="listbox" aria-label={hasQuery ? 'Matching documents' : 'Suggested searches'} aria-busy={searching}>
        {choices.map((choice, index) => <Button type="button" variant="source" size="source" className="dg-search-option" key={`${choice.value}-${index}`} id={`${listId}-${index}`} role="option" aria-selected={active === index}
          onPointerDown={event => event.preventDefault()} onClick={() => choose(choice.value)}>
          {choice.item ? <FileText aria-hidden="true" /> : <TrendingUp aria-hidden="true" />}<span>{choice.item ? <><strong>{choice.value}</strong><small>{Object.values(documentMetadata(choice.item)).filter(Boolean).join(' · ')}</small></> : choice.value}</span><ArrowRight aria-hidden="true" />
        </Button>)}
      </div>
      {hasQuery && !searching && matches.length > 0 && <Button type="button" variant="source" size="source" className="dg-search-all" onClick={() => { inputRef.current?.focus(); setOpen(false); setActive(-1); }}>Show all {matches.length.toLocaleString()} matches<ArrowRight size={16} aria-hidden="true" /></Button>}
    </div>}
  </div>;
}