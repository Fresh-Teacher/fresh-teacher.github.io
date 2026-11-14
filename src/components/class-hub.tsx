import { useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { classMenuAnimations, type ClassHubData } from '@/lib/class-hubs';

export function ClassHubLayout({ heading, children, loading = false }: { heading: string; children: ReactNode; loading?: boolean }) {
  return <div className="legacy-page legacy-selection class-hub" role={loading ? 'status' : undefined} aria-label={loading ? 'Loading menu options' : undefined}>
    <div id="wrapper"><div id="page-wrapper"><div className="container-fluid"><div className="row"><div className="col-lg-12 col-md-12 col-sm-12 col-xs-12"><div className="panel">
      <div className="necta11"><h3 className="box-title m-b-0" /><br /><br /><ul className="nav nav-tabs"><li className="active"><span className="class-hub-title"><b>{heading}</b></span></li></ul><hr className="style1" /></div>
      <div className="tab-content"><div className="tab-pane active"><p><b /></p><div className="class-hub-instruction"><b>SELECT ONE ITEM FROM THE DROPDOWN MENU</b></div><p /><div className="necta1">{children}</div></div></div>
      <div className="class-hub-return"><Button asChild variant="source" size="source" className="btn btn-primary legacy-control"><a href="/index.html">↩ RETURN TO LIBRARY <i className="fa-solid fa-book-open class-hub-book" aria-hidden="true" /></a></Button></div>
    </div></div></div></div></div></div>
  </div>;
}

export function ClassHub({ data }: { data: ClassHubData }) {
  const [opened, setOpened] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const pendingFocus = useRef<'first' | 'last' | null>(null);
  const focusItems = (index: number) => Array.from(root.current?.querySelectorAll<HTMLAnchorElement>(`#class-menu-${index} [role="menuitem"]`) ?? []);
  useEffect(() => {
    if (opened !== null && pendingFocus.current) {
      const items = focusItems(opened);
      (pendingFocus.current === 'last' ? items.at(-1) : items[0])?.focus();
      pendingFocus.current = null;
    }
  }, [opened]);
  useEffect(() => {
    if (opened === null) return;
    const dismiss = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('.legacy-dropdown-trigger')) return;
      if (!root.current?.querySelector(`#class-group-${opened}`)?.contains(event.target)) setOpened(null);
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpened(null); triggers.current[opened]?.focus(); }
    };
    document.addEventListener('click', dismiss, true);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('click', dismiss, true); document.removeEventListener('keydown', escape); };
  }, [opened]);
  const openFromKeyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    pendingFocus.current = event.key === 'ArrowUp' ? 'last' : 'first';
    if (opened === index) {
      const items = focusItems(index);
      (pendingFocus.current === 'last' ? items.at(-1) : items[0])?.focus();
      pendingFocus.current = null;
    } else setOpened(index);
  };
  const navigateMenu = (event: KeyboardEvent<HTMLUListElement>, index: number) => {
    if (event.key === 'Tab') { setOpened(null); return; }
    if (event.key === ' ') { event.preventDefault(); (event.target as HTMLElement).click(); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = focusItems(index);
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLAnchorElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  };
  return <div ref={root}><ClassHubLayout heading={data.heading}>
    {data.menus.map((menu, index) => <div id={`class-group-${index}`} className={`btn-group m-r-10 ${menu.featured ? 'class-resource-featured' : ''}`} key={menu.label}>
      <Button ref={element => { triggers.current[index] = element; }} id={`class-trigger-${index}`} type="button" variant="source" size="source" className="btn btn-info dropdown-toggle waves-effect waves-light legacy-control legacy-dropdown-trigger" aria-haspopup="menu" aria-expanded={opened === index} aria-controls={`class-menu-${index}`} onClick={() => setOpened(current => current === index ? null : index)} onKeyDown={event => openFromKeyboard(event, index)}>
        <b>{menu.label}</b>{menu.featured && <span className="class-resource-new"><span>NEW!</span></span>}
      </Button>
      <div className="class-resource-reveal" hidden={opened !== index}>
      <ul id={`class-menu-${index}`} role="menu" aria-labelledby={`class-trigger-${index}`} hidden={opened !== index} className={`dropdown-menu class-menu-${classMenuAnimations[menu.label] ?? 'slideInUp'} ${opened === index ? 'legacy-panel-open' : 'legacy-dropdown-closed'}`} onKeyDown={event => navigateMenu(event, index)}>
        {menu.items.map((item, itemIndex) => 'href' in item ? <li role="none" key={itemIndex}><a role="menuitem" tabIndex={-1} href={item.href} onClick={() => setOpened(null)}>{item.label}</a></li> : 'divider' in item ? <li role="separator" className="divider" key={itemIndex} /> : <li role="none" key={itemIndex}><span className="class-resource-empty" role="status">{item.empty}</span></li>)}
      </ul>
      </div>
    </div>)}
  </ClassHubLayout></div>;
}