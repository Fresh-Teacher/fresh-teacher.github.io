import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { useLocation, useRouter } from '@tanstack/react-router';
import menu from '@/data/navigation/menu.json';
import { AppBar } from '@/components/navigation/app-bar';
import { SideDrawer } from '@/components/navigation/side-drawer';
import { activeBranch } from '@/components/navigation/nav-tree';
import { RouteProgress } from '@/components/navigation/route-progress';
import { WhatsAppChat } from '@/components/whatsapp-chat';
import { SiteFooter } from '@/components/site-footer';

export function LibraryShell({ children }: { children: ReactNode }) {
  const pathname = useLocation({ select: location => location.pathname });
  const [openPath, setOpenPath] = useState<number[]>(() => activeBranch(menu, pathname));
  const previousPathname = useRef(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopClosed, setDesktopClosed] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => { setIsMobile(media.matches); setMobileOpen(false); };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    setMobileOpen(false); setInstallOpen(false);
    if (previousPathname.current !== pathname) {
      setOpenPath([]);
      previousPathname.current = pathname;
    }
  }, [pathname]);
  const navigate = useCallback(() => { setOpenPath([]); setMobileOpen(false); setInstallOpen(false); }, []);
  const toggleBranch = useCallback((path: number[]) => {
    setOpenPath(current => path.every((index, level) => current[level] === index) ? path.slice(0, -1) : path);
  }, []);
  const closeInstall = useCallback(() => setInstallOpen(false), []);
  const toggleInstall = useCallback(() => setInstallOpen(value => !value), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const closeMobileAndFocus = useCallback(() => {
    setMobileOpen(false);
    trigger.current?.focus();
  }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileOpen) closeMobileAndFocus();
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [mobileOpen, closeMobileAndFocus]);
  const router = useRouter();
  // Captured page links route in-app instead of reloading; "Return/Back" links go back through app history when there is any.
  const interceptLinks = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.hash) return;
    if (/\.[a-z0-9]+$/i.test(url.pathname) && !/\.html?$/i.test(url.pathname)) return;
    event.preventDefault();
    const label = anchor.textContent ?? '';
    const historyIndex = (window.history.state as { __TSR_index?: number } | null)?.__TSR_index ?? 0;
    if (/\b(return|back)\b/i.test(label) && historyIndex > 0) { router.history.back(); return; }
    const path = url.pathname === '/index.html' ? '/' : url.pathname;
    void router.navigate({ href: path + url.search + url.hash });
  }, [router]);
  // Captured links are plain anchors, so the router can't preload them itself: warm the target on hover or touch.
  const lastPreloaded = useRef('');
  const preloadLink = useCallback((event: { target: EventTarget }) => {
    const anchor = (event.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
    if (/\.[a-z0-9]+$/i.test(url.pathname) && !/\.html?$/i.test(url.pathname)) return;
    if (lastPreloaded.current === url.pathname) return;
    lastPreloaded.current = url.pathname;
    router.preloadRoute({ to: url.pathname }).catch(() => undefined);
  }, [router]);
  const toggle = useCallback(() => {
    setInstallOpen(false);
    if (window.matchMedia('(max-width: 767px)').matches) setMobileOpen(value => !value);
    else setDesktopClosed(value => !value);
  }, []);
  return <div onClick={interceptLinks} onPointerOver={preloadLink} onTouchStart={preloadLink} className={`library-shell ${mobileOpen ? 'library-mobile-open' : ''} ${desktopClosed ? 'library-desktop-closed' : ''}`}>
    <RouteProgress />
    <AppBar triggerRef={trigger} menuExpanded={isMobile ? mobileOpen : !desktopClosed} installOpen={installOpen} onToggleMenu={toggle} onToggleInstall={toggleInstall} onCloseInstall={closeInstall} />
    <SideDrawer mobileOpen={mobileOpen} pathname={pathname} openPath={openPath} onClose={closeMobile} onCloseAndFocus={closeMobileAndFocus} onToggleBranch={toggleBranch} onNavigate={navigate} />
    <main className="library-content">{children}<SiteFooter /></main>
    <WhatsAppChat />
  </div>;
}
