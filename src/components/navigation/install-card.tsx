import { memo, useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle, Share2, X } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShareMenuItems } from '@/components/document-actions';
import '@/styles/library-share.css';
import { Button } from '@/components/ui/button';
import installCardMascot from '@/assets/install-card-mascot.webp.asset.json';
import googlePlayBadge from '@/assets/google-play-badge.webp.asset.json';
import appStoreBadge from '@/assets/app-store-badge.svg.asset.json';

export const APP_APK_URL = 'https://fresh-teacher.github.io/Fresh%20App.apk';
export const PLAY_STORE_URL = 'https://play.google.com/store/search?q=Fresh%20App&c=apps';
export const APP_STORE_URL = 'https://apps.apple.com/us/search?term=Fresh%20App';

// Official Android robot glyph in its brand green.
function AndroidIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true" fill="#3DDC84"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4483-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993 0 .5511-.4483.9997-.9993.9997m11.4045-6.02 1.9973-3.4592a.416.416 0 0 0-.1521-.5676.416.416 0 0 0-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 0 0-.5677-.1521.4157.4157 0 0 0-.1521.5676l1.9973 3.4592C2.61 11.9105.3432 14.9946 0 18.53h24c-.3432-3.5354-2.61-6.6195-6.1185-9.2086"/></svg>;
}

export const InstallCard = memo(function InstallCard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [apkState, setApkState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const close = (event: MouseEvent) => {
      if (event.target instanceof Element && !event.target.closest('.library-appbar-actions, .library-share-popup')) onClose();
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

  const downloadApk = async () => {
    setApkState('loading');
    try {
      const response = await fetch(APP_APK_URL);
      if (!response.ok) throw new Error('File unavailable');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'Fresh App.apk';
      // Keep the synthetic click from reaching the card's outside-tap close handler.
      anchor.addEventListener('click', (event) => event.stopPropagation());
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setApkState('done');
    } catch { setApkState('error'); }
  };

  return <div className="library-profile library-install-card" role="dialog" aria-label="Install the app" aria-describedby="library-install-description" ref={dialogRef}>
    <Button variant="source" size="source" className="library-profile-close" aria-label="Close install card" onClick={onClose}><X /></Button>
    <div className="library-install-head">
      <span className="library-install-badge" aria-hidden><AndroidIcon /></span>
      <h2>Get the Fresh App</h2>
    </div>
    <div className="library-install-overview">
      <img src={installCardMascot.url} alt="Fresh App mascot holding a phone" width={480} height={683} className="library-install-figure" />
      <p className="library-install-text" id="library-install-description">
        Take Fresh Teacher’s Library with you — install the Fresh App on your phone or tablet for one-tap access to notes, schemes of work and past papers.
      </p>
    </div>
    <Button variant="source" size="source" className="library-install-btn" disabled={apkState === 'loading'} onClick={() => void downloadApk()}>
      {apkState === 'loading' ? <LoaderCircle className="library-install-spin" aria-hidden /> : apkState === 'done' ? <Check aria-hidden /> : <AndroidIcon />}
      {apkState === 'loading' ? 'Downloading…' : apkState === 'done' ? 'Downloaded' : 'Download the Fresh App apk'}
    </Button>
    {apkState === 'error' && <p role="alert" className="library-install-error">Download unavailable. <a href={APP_APK_URL} target="_blank" rel="noreferrer">Open the app file directly</a></p>}
    <div className="library-install-divider" aria-hidden><span>or get it from</span></div>
    <div className="library-install-stores">
      <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" aria-label="Get the Fresh App on Google Play">
        <img src={googlePlayBadge.url} alt="Get it on Google Play" width={646} height={250} />
      </a>
      <a href={APP_STORE_URL} target="_blank" rel="noreferrer" aria-label="Get the Fresh App on the Apple App Store">
        <img src={appStoreBadge.url} alt="Download on the App Store" />
      </a>
    </div>
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
