import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import appIcon from '@/assets/icon-192.png.asset.json';
import '@/styles/library-share.css';
import { isInstalled, offerInstall, readPreference, rememberInstalled, requestInstall, type BeforeInstallPromptEvent } from '@/lib/app-installation';
import { useAppInstallation } from '@/hooks/use-app-installation';

const BLOCK_KEY = 'ft-install-blocked';
const SNOOZE_KEY = 'ft-install-snooze-until';
export const INSTALL_DELAY_MS = 30000;
export const INSTALL_SNOOZE_MS = 7 * 86400000;

export function InstallPrompt() {
  const [open, setOpen] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [busy, setBusy] = useState(false);
  const { available, installed } = useAppInstallation();

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      // A fresh browser offer proves a previous installation is no longer present.
      try { localStorage.removeItem('ft-app-installed'); } catch { /* storage unavailable */ }
      offerInstall(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => { rememberInstalled(); offerInstall(null); setOpen(false); };
    const engage = () => setEngaged(true);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('pointerdown', engage, { once: true });
    window.addEventListener('keydown', engage, { once: true });
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('pointerdown', engage);
      window.removeEventListener('keydown', engage);
      offerInstall(null);
    };
  }, []);

  useEffect(() => {
    if (!available || !engaged || installed || isInstalled() || readPreference(BLOCK_KEY)) return;
    if (Date.now() < Number(readPreference(SNOOZE_KEY) || 0)) return;
    const timer = window.setTimeout(() => setOpen(true), INSTALL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [available, engaged, installed]);

  const close = () => {
    try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + INSTALL_SNOOZE_MS)); } catch { /* storage unavailable */ }
    setOpen(false);
  };
  const install = async () => {
    setBusy(true);
    await requestInstall();
    setBusy(false);
    close();
  };

  if (!open || !available || installed) return null;
  return <aside className="library-install-banner" aria-label="Install the Fresh App">
    <img src={appIcon.url} width={48} height={48} alt="" />
    <div><strong>Fresh App</strong><span>Lesson notes &amp; past papers</span></div>
    <Button variant="source" size="source" className="library-banner-install" disabled={busy} onClick={() => void install()}><Download size={18} aria-hidden />Install</Button>
    <Button variant="source" size="source" className="library-banner-close" aria-label="Remind me later" onClick={close}><X size={20} /></Button>
  </aside>;
}
