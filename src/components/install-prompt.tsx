import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from '@/components/ui/button';
import installMascot from '@/assets/install-mascot.webp.asset.json';
import { INSTALLED_KEY, isInstalled, offerInstall, readPreference, rememberInstalled, requestInstall, supportsManualInstall, type BeforeInstallPromptEvent } from '@/lib/app-installation';

const BLOCK_KEY = "ft-install-blocked";
const SNOOZE_KEY = "ft-install-snooze-until";
const SNOOZE_DAYS = 7;
const EXIT_MS = 420;

export function InstallPrompt({ onComplete }: { onComplete: () => void }) {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showManualHint, setShowManualHint] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [installing, setInstalling] = useState(false);
  const completed = useRef(false);
  const exitTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onInstalled = () => {
      completed.current = true;
      rememberInstalled();
      offerInstall(null);
      deferredPrompt.current = null;
      window.clearTimeout(exitTimer.current);
      setOpen(false);
      onComplete();
    };
    if (isInstalled()) { onInstalled(); return; }
    if (readPreference(BLOCK_KEY) || Date.now() < Number(readPreference(SNOOZE_KEY) || 0) || !supportsManualInstall()) {
      completed.current = true;
      onComplete();
      return;
    }
    setOpen(true);
    const onStorage = (event: StorageEvent) => { if (event.key === INSTALLED_KEY && event.newValue === '1') onInstalled(); };
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const onDisplayMode = () => { if (isInstalled()) onInstalled(); };

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      if (completed.current) return;
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      offerInstall(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('storage', onStorage);
    displayMode.addEventListener('change', onDisplayMode);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('storage', onStorage);
      displayMode.removeEventListener('change', onDisplayMode);
      window.clearTimeout(exitTimer.current);
    };
  }, [onComplete]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); remindLater(); }
      if (event.key !== 'Tab') return;
      const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      const first = buttons?.[0];
      const last = buttons?.[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); if (previous instanceof HTMLElement) previous.focus(); };
  }, [open]);

  const close = () => {
    if (completed.current) return;
    completed.current = true;
    setLeaving(true);
    exitTimer.current = window.setTimeout(() => {
      setOpen(false);
      setLeaving(false);
      onComplete();
    }, EXIT_MS);
  };

  const installNow = async () => {
    if (!deferredPrompt.current) { setShowManualHint(true); return; }
    setInstalling(true);
    const outcome = await requestInstall();
    setInstalling(false);
    if (outcome === 'unavailable') { setShowManualHint(true); return; }
    deferredPrompt.current = null;
    if (outcome === 'accepted') close();
    else remindLater();
  };

  const remindLater = () => {
    try {
      window.localStorage.setItem(
        SNOOZE_KEY,
        String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000),
      );
    } catch {
      /* ignore */
    }
    close();
  };

  const notInterested = () => {
    try {
      window.localStorage.setItem(BLOCK_KEY, "1");
    } catch {
      /* ignore */
    }
    close();
  };

  if (!open) return null;

  return (
    <div
      className={`ftp-backdrop ${leaving ? "popup-fade-out" : "popup-fade-in"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-app-title"
      aria-describedby="install-app-description"
      ref={dialogRef}
    >
      <div className={`ftp-card ftp-cookie ftp-install ${leaving ? "popup-slide-down" : "popup-slide-up"}`}>
        <div className="ftp-band" aria-hidden />
        <img src={installMascot.url} alt="Fresh App mascot holding a phone" width={360} height={512} className="ftp-mascot ftp-install-mascot popup-bob" />
        <Button variant="source" size="source" type="button" onClick={remindLater} aria-label="Close" className="ftp-close">
          <X width={16} height={16} />
        </Button>
        <div className="ftp-body">
        <h2 id="install-app-title" className="ftp-title">Install the Fresh App</h2>
        <p className="ftp-text" id="install-app-description">
          Easily access Fresh Teacher&apos;s Platform anytime when you install the Fresh App on your
          device — lesson notes, schemes of work and past papers are just one tap away.
        </p>
        {showManualHint && (
          <p className="ftp-hint">
            On iPhone or iPad: tap the Share button, then &quot;Add to Home Screen&quot;. In Chrome or Edge:
            open the browser menu and choose &quot;Install app&quot; or &quot;Add to Home screen&quot;.
          </p>
        )}
        <div className="ftp-actions">
          <Button variant="source" size="source" type="button" disabled={installing} onClick={installNow} className="ftp-btn ftp-cookie-solid">
            {installing ? 'Installing…' : 'Install now'}
          </Button>
          <Button variant="source" size="source" type="button" onClick={remindLater} className="ftp-btn ftp-cookie-outline">
            Remind me later
          </Button>
        </div>
          <Button variant="source" size="source" type="button" onClick={notInterested} className="ftp-btn ftp-ghost ftp-install-dismiss">
            Not Interested
          </Button>
        </div>
      </div>
    </div>
  );
}
