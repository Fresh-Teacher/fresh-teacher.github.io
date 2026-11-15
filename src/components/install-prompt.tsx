import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from '@/components/ui/button';
import installMascot from '@/assets/install-mascot.webp.asset.json';
import { isInstalled, offerInstall, readPreference, rememberInstalled, requestInstall, type BeforeInstallPromptEvent } from '@/lib/app-installation';

const BLOCK_KEY = "ft-install-blocked";
const SNOOZE_KEY = "ft-install-snooze-until";
const SNOOZE_DAYS = 7;
const EXIT_MS = 420;

function save(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* storage can be disabled */ }
}

// Standard pattern: stay hidden until the browser fires `beforeinstallprompt`,
// so "Install now" always opens the real install dialog.
export function InstallPrompt() {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (isInstalled()) return;
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      offerInstall(event as BeforeInstallPromptEvent);
      const snoozed = Date.now() < Number(readPreference(SNOOZE_KEY) || 0);
      if (!readPreference(BLOCK_KEY) && !snoozed) setOpen(true);
    };
    const onInstalled = () => { rememberInstalled(); offerInstall(null); setOpen(false); };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const close = () => {
    setLeaving(true);
    window.setTimeout(() => { setOpen(false); setLeaving(false); }, EXIT_MS);
  };
  const remindLater = () => { save(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86400000)); close(); };
  const notInterested = () => { save(BLOCK_KEY, "1"); close(); };
  const installNow = async () => {
    const outcome = await requestInstall();
    if (outcome === 'accepted') close(); else remindLater();
  };

  if (!open) return null;

  return (
    <div className={`ftp-backdrop ${leaving ? "popup-fade-out" : "popup-fade-in"}`} role="dialog" aria-modal="true"
      aria-labelledby="install-app-title" aria-describedby="install-app-description">
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
          <div className="ftp-actions">
            <Button variant="source" size="source" type="button" onClick={installNow} className="ftp-btn ftp-cookie-solid">Install now</Button>
            <Button variant="source" size="source" type="button" onClick={remindLater} className="ftp-btn ftp-cookie-outline">Remind me later</Button>
          </div>
          <Button variant="source" size="source" type="button" onClick={notInterested} className="ftp-btn ftp-ghost ftp-install-dismiss">Not Interested</Button>
        </div>
      </div>
    </div>
  );
}
