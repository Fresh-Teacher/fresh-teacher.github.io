import { memo } from 'react';
import { Home, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import menu from '@/data/navigation/menu.json';
import { NavTree } from './nav-tree';

interface SideDrawerProps {
  mobileOpen: boolean;
  pathname: string;
  openPath: number[];
  onClose: () => void;
  onCloseAndFocus: () => void;
  onToggleBranch: (path: number[]) => void;
  onNavigate: () => void;
}

export const SideDrawer = memo(function SideDrawer({ mobileOpen, pathname, openPath, onClose, onCloseAndFocus, onToggleBranch, onNavigate }: SideDrawerProps) {
  return <>
    {mobileOpen && <Button variant="source" size="source" className="library-menu-backdrop" aria-label="Close class menu" onClick={onClose} />}
    <aside id="library-navigation" className="library-sidenav" aria-label="Class navigation">
      <div className="library-sidenav-heading"><span>Library</span><Button variant="source" size="source" className="library-mobile-close library-icon-control" aria-label="Close class menu" onClick={onCloseAndFocus}><X /></Button></div>
      <nav aria-label="Library navigation">
        <Button asChild variant="source" size="source" className={`library-menu-control library-menu-home ${pathname === '/' ? 'library-menu-active' : ''}`}><a href="/" onClick={onNavigate} aria-current={pathname === '/' ? 'page' : undefined}><Home /><span>Library home</span></a></Button>
        <NavTree items={menu} pathname={pathname} openPath={openPath} onToggle={onToggleBranch} onNavigate={onNavigate} />
      </nav>
    </aside>
  </>;
});