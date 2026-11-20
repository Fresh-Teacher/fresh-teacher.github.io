export const INSTALLED_KEY = 'ft-app-installed';

export function readPreference(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function rememberInstalled() {
  try { localStorage.setItem(INSTALLED_KEY, '1'); } catch { /* storage can be disabled */ }
}

export function isInstalled() {
  return ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'].some(mode =>
      window.matchMedia(`(display-mode: ${mode})`).matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}


export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

// One shared offer: the automatic popup and the app-bar install card both drive the same browser prompt.
let pendingOffer: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function subscribeInstall(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function isAppleMobile() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function offerInstall(event: BeforeInstallPromptEvent | null) {
  pendingOffer = event;
  listeners.forEach(listener => listener());
}

export function hasInstallOffer() {
  return pendingOffer !== null;
}

export async function requestInstall(): Promise<InstallOutcome> {
  const event = pendingOffer;
  if (!event) return 'unavailable';
  // Browser offers are single-use, including dismissed or failed attempts.
  offerInstall(null);
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === 'accepted') {
      rememberInstalled();
    }
    return outcome === 'accepted' ? 'accepted' : 'dismissed';
  } catch {
    return 'unavailable';
  }
}