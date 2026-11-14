import { shouldLoadAdsense } from './adsense';

export function shouldRequestManualAd(enabled: boolean, hostname: string, consent: string | null, slot: unknown) {
  return shouldLoadAdsense(enabled, hostname, consent) && typeof slot === 'string' && /^\d+$/.test(slot);
}

export function showCatalogAd(index: number, count: number) {
  return index === 7 && count > 8;
}

// React can replay effects; each physical ad element must be queued only once.
const requested = new WeakSet<HTMLElement>();
export function requestAdOnce(element: HTMLElement, push: () => void) {
  if (requested.has(element)) return false;
  requested.add(element);
  try { push(); } catch { return false; }
  return true;
}