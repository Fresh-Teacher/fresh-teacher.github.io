import { memo, useEffect, useRef, useState, type RefObject } from 'react';
import { Download, Menu, Search } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { InstallCard } from './install-card';
import { QuickSearch } from './quick-search';
import { preloadLibrarySearch } from '@/lib/library-search';

interface AppBarProps {
  triggerRef: RefObject<HTMLButtonElement | null>;
  menuExpanded: boolean;
  installOpen: boolean;
  onToggleMenu: () => void;
  onToggleInstall: () => void;
  onCloseInstall: () => void;
}

export const AppBar = memo(function AppBar({ triggerRef, menuExpanded, installOpen, onToggleMenu, onToggleInstall, onCloseInstall }: AppBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const [shortcut, setShortcut] = useState('Ctrl K');
  const warmSearch = () => { void preloadLibrarySearch().catch(() => undefined); };
  useEffect(() => { setShortcut(/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K'); }, []);
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(warmSearch, { timeout: 4000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(warmSearch, 2000);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, [role="dialog"]'))) return;
      if ((event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey)) {
        event.preventDefault(); setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <><header className="library-appbar">
    <Button ref={triggerRef} variant="source" size="source" className="library-icon-control" aria-label="Toggle class menu" aria-controls="library-navigation" aria-expanded={menuExpanded} onClick={onToggleMenu} title="Class menu"><Menu /></Button>
    <Button asChild variant="source" size="source" className="library-brand"><Link to="/"><span>FRESH TEACHER'S LIBRARY</span><span className="library-brand-caption">For Fresh Teachers and Planned Kids</span></Link></Button>
    <div className="library-appbar-actions">
      <Button ref={searchTrigger} variant="source" size="source" className="library-icon-control library-search-control" aria-label="Search the library" aria-haspopup="dialog" aria-expanded={searchOpen} title={`Search the library (${shortcut})`} onPointerEnter={warmSearch} onFocus={warmSearch} onClick={() => { warmSearch(); onCloseInstall(); setSearchOpen(true); }}><Search /><kbd className="library-search-shortcut" aria-hidden="true">{shortcut}</kbd></Button>
      <Button variant="source" size="source" className="library-install-control" aria-label="Install the app" aria-expanded={installOpen} onClick={onToggleInstall} title="Install the app"><Download /></Button>
      <InstallCard open={installOpen} onClose={onCloseInstall} />
    </div>
  </header><QuickSearch open={searchOpen} onOpenChange={setSearchOpen} triggerRef={searchTrigger} /></>;
});
