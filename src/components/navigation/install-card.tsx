import { memo, useEffect, useRef, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShareMenuItems } from '@/components/document-actions';
import '@/styles/library-share.css';
import { Button } from '@/components/ui/button';
import installCardMascot from '@/assets/install-card-mascot.webp.asset.json';
import { isAppleMobile, requestInstall } from '@/lib/app-installation';
import { useAppInstallation } from '@/hooks/use-app-installation';

export const InstallCard = memo(function InstallCard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { available } = useAppInstallation();
  const [apple, setApple] = useState(false);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    setApple(isAppleMobile());
    setPreview(import.meta.env.DEV || window.self !== window.top);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const close = (event: MouseEvent) => {
      if (event.target instanceof Element && !dialogRef.current?.contains(event.target) && !event.target.closest('.library-appbar-actions, .library-share-popup')) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const install = async () => {
    setBusy(true);
    const outcome = await requestInstall();
    setBusy(false);
    if (outcome === 'accepted') onClose();
    setUnavailable(outcome === 'unavailable');
  };

  return <div className="library-profile library-install-card" role="dialog" aria-label="Install the app" aria-describedby="library-install-description" ref={dialogRef}>
    <Button variant="source" size="source" className="library-profile-close" aria-label="Close install card" onClick={onClose}><X /></Button>
    <div className="library-install-head">
      <span className="library-install-badge" aria-hidden><Download /></span>
      <h2>Get the Fresh App</h2>
    </div>
    <div className="library-install-overview">
      <img src={installCardMascot.url} alt="Fresh App mascot holding a phone" width={480} height={683} className="library-install-figure" />
      <p className="library-install-text" id="library-install-description">
        Take Fresh Teacher’s Library with you — install the Fresh App on your phone or tablet for one-tap access to notes, schemes of work and past papers.
      </p>
    </div>
    {available && <Button variant="source" size="source" className="library-install-btn" disabled={busy} onClick={() => void install()}>
      <Download aria-hidden />{busy ? 'Opening…' : 'Install Fresh App'}
    </Button>}
    {unavailable && <p role="status" className="library-install-text">The install offer has expired. Use your browser’s menu instead.</p>}
    {!available && <div className="library-install-help">
      {preview && <p>Open the published site directly in your browser to install the app. Installation isn’t available inside this preview.</p>}
      {apple ? <ol>
        <li>Open this page in Safari.</li>
        <li>Tap <Share2 size={18} aria-hidden /> <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</li>
        <li>Keep <strong>Open as Web App</strong> enabled if shown, then tap <strong>Add</strong>.</li>
      </ol> : <p>Open your browser’s menu and select <strong>Install app</strong> or <strong>Add to Home Screen</strong>. On a computer, look for the install icon in the address bar. If neither is available, try Chrome, Edge, or Safari.</p>}
    </div>}
    <LibraryShare />
  </div>;
});

const LIBRARY_TITLE = 'Fresh Teacher’s Library';
export const LIBRARY_SHARE_INTRODUCTION = 'Hello, visit Fresh Teacher’s Library to access thousands of free educational materials like Lesson Notes, Schemes of Work, Past Papers, Holiday Packages and many other educational materials.\n\nFollow this link to visit it now:';

export function LibraryShare() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const link = () => new URL('/', window.location.origin).href;
  const message = () => `${LIBRARY_SHARE_INTRODUCTION}\n${link()}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(message()); setCopied(true); toast.success('Link copied'); window.setTimeout(() => setCopied(false), 2000); }
    catch { toast.error('Could not copy message and link'); }
  };
  return <DropdownMenu open={open} onOpenChange={(next) => { setOpen(next); if (next) setCopied(false); }} modal={false}>
    <DropdownMenuTrigger asChild>
      <Button variant="source" size="source" className="library-install-btn library-share-btn">
        <Share2 aria-hidden /><span>Share the Fresh Teacher’s Library</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent side="bottom" align="center" collisionPadding={12} sideOffset={8} aria-label={`Share ${LIBRARY_TITLE}`} className="dg-share-popup library-share-popup">
      <div className="dg-share-head"><span>Share</span><button type="button" className="dg-share-close" aria-label="Close share menu" onClick={() => setOpen(false)}><X size={20} /></button></div>
      <ShareMenuItems copied={copied} copy={copy} subject={LIBRARY_TITLE} introduction={LIBRARY_SHARE_INTRODUCTION} message={message} link={link} />
    </DropdownMenuContent>
  </DropdownMenu>;
}
