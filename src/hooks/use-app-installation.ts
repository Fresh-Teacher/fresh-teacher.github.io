import { useEffect, useState, useSyncExternalStore } from 'react';
import { hasInstallOffer, isInstalled, subscribeInstall } from '@/lib/app-installation';

export function useAppInstallation() {
  const available = useSyncExternalStore(subscribeInstall, hasInstallOffer, () => false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    const refresh = () => setInstalled(isInstalled());
    const completed = () => setInstalled(true);
    refresh();
    media.addEventListener('change', refresh);
    window.addEventListener('appinstalled', completed);
    return () => {
      media.removeEventListener('change', refresh);
      window.removeEventListener('appinstalled', completed);
    };
  }, []);
  return { available, installed };
}