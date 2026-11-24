import tracking from '@/data/site-tracking.json';

export function shouldLoadAdsense(enabled: boolean, hostname: string) {
  return enabled && hostname === 'fresh-teacher.github.io';
}

// Ads only appear on individual document pages, never on the homepage or class menus.
export function isAdPage(pathname: string) {
  return /^\/doc\/[^/]+/.test(pathname);
}

// Runs in the document head; preview hosts and non-document pages never request ads.
export const adsenseBootstrap = `(function(){var enabled=${JSON.stringify(import.meta.env['VITE_ENABLE_ADSENSE'] === 'true')};var allowed=${shouldLoadAdsense.toString()};var page=${isAdPage.toString()};if(!allowed(enabled,location.hostname)||!page(location.pathname)||document.getElementById('ft-adsense'))return;var s=document.createElement('script');s.id='ft-adsense';s.async=true;s.crossOrigin='anonymous';s.src=${JSON.stringify(tracking.adsenseScript)};document.head.appendChild(s);})();`;

// Loads the ad script after in-app navigation onto a document page.
export function ensureAdsenseScript() {
  const existing = document.getElementById('ft-adsense') as HTMLScriptElement | null;
  if (existing) return existing;
  const s = document.createElement('script');
  s.id = 'ft-adsense'; s.async = true; s.crossOrigin = 'anonymous'; s.src = tracking.adsenseScript;
  document.head.appendChild(s);
  return s;
}
