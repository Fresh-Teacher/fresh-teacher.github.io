import { useEffect, useRef, type ReactNode, type KeyboardEvent } from 'react';
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
  const root = useRef<HTMLDivElement>(null);
  const groupFor = (index: number) => root.current?.querySelector<HTMLDetailsElement>(`#class-group-${index}`);
  const focusItems = (index: number) => Array.from(groupFor(index)?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]') ?? []);
  const close = (group: HTMLDetailsElement, restoreFocus = false) => {
    group.open = false;
    if (restoreFocus) group.querySelector<HTMLElement>('summary')?.focus();
  };
  useEffect(() => {
    const dismiss = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      for (const group of root.current?.querySelectorAll<HTMLDetailsElement>('details[open]') ?? []) {
        if (!group.contains(event.target)) close(group);
      }
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const group = root.current?.querySelector<HTMLDetailsElement>('details[open]');
      if (!group) return;
      event.preventDefault();
      close(group, true);
    };
    document.addEventListener('click', dismiss, true);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('click', dismiss, true); document.removeEventListener('keydown', escape); };
  }, []);
  const openFromKeyboard = (event: KeyboardEvent<HTMLElement>, index: number) => {
    // Enter/Space toggle natively, including before hydration. Arrow keys are an enhancement.
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    const group = groupFor(index);
    if (!group) return;
    group.open = true;
    const items = focusItems(index);
    (event.key === 'ArrowUp' ? items.at(-1) : items[0])?.focus();
  };
  const navigateMenu = (event: KeyboardEvent<HTMLUListElement>, index: number) => {
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
    {data.menus.map((menu, index) => menu.href ? <div id={`class-group-${index}`} className={`btn-group m-r-10 ${menu.featured ? 'class-resource-featured' : ''}`} key={menu.label}>
      <Button asChild variant="source" size="source" className="btn btn-info waves-effect waves-light legacy-control"><a href={menu.href}><b>{menu.label}</b>{menu.featured && <span className="class-resource-new"><span>NEW!</span></span>}</a></Button>
    </div> : <details suppressHydrationWarning id={`class-group-${index}`} name="class-resources" data-native-dropdown className={`btn-group m-r-10 ${menu.featured ? 'class-resource-featured' : ''}`} key={menu.label}>
      <Button asChild variant="source" size="source" className="btn btn-info dropdown-toggle waves-effect waves-light legacy-control legacy-dropdown-trigger">
        <summary id={`class-trigger-${index}`} data-toggle="dropdown" aria-controls={`class-menu-${index}`} onKeyDown={event => openFromKeyboard(event, index)}>
          <b>{menu.label}</b>{menu.featured && <span className="class-resource-new"><span>NEW!</span></span>}
        </summary>
      </Button>
      <div className="class-resource-reveal">
        <ul id={`class-menu-${index}`} role="menu" aria-labelledby={`class-trigger-${index}`} className={`dropdown-menu class-menu-${classMenuAnimations[menu.label] ?? 'slideInUp'}`} onKeyDown={event => navigateMenu(event, index)}>
          {menu.items.map((item, itemIndex) => 'href' in item ? <li role="none" key={itemIndex}><a role="menuitem" href={item.href}>{item.label}</a></li> : 'divider' in item ? <li role="separator" className="divider" key={itemIndex} /> : <li role="none" key={itemIndex}><span className="class-resource-empty" role="status">{item.empty}</span></li>)}
        </ul>
      </div>
    </details>)}
  </ClassHubLayout></div>;
}
