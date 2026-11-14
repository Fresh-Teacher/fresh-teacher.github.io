export const INSTALL_DELAY_MS = 40 * 1000;
export const INSTALLED_KEY = 'ft-app-installed';
export const BROWSING_KEY = 'ft-install-browsing-ms';
export const COOKIE_CLOSED_EVENT = 'ft-cookie-notice-closed';

export function readPreference(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function rememberInstalled() {
  try { localStorage.setItem(INSTALLED_KEY, '1'); } catch { /* storage can be disabled */ }
}

export function isInstalled() {
  return readPreference(INSTALLED_KEY) === '1' ||
    ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'].some(mode =>
      window.matchMedia(`(display-mode: ${mode})`).matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function supportsManualInstall() {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

// One shared offer: the automatic popup and the app-bar install card both drive the same browser prompt.
let pendingOffer: BeforeInstallPromptEvent | null = null;

export function offerInstall(event: BeforeInstallPromptEvent | null) {
  pendingOffer = event;
}

export function hasInstallOffer() {
  return pendingOffer !== null;
}

export async function requestInstall(): Promise<InstallOutcome> {
  const event = pendingOffer;
  if (!event) return 'unavailable';
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === 'accepted') {
      pendingOffer = null;
      rememberInstalled();
    }
    return outcome === 'accepted' ? 'accepted' : 'dismissed';
  } catch {
    return 'unavailable';
  }
}