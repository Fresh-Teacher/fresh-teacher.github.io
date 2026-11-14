import tracking from '@/data/site-tracking.json';

export function shouldLoadAdsense(enabled: boolean, hostname: string, consent: string | null) {
  return enabled && hostname === 'fresh-teacher.github.io' && consent === 'accepted';
}

// Runs in the document head; preview and unapproved hosts never request ads.
export const adsenseBootstrap = `(function(){var enabled=${JSON.stringify(import.meta.env['VITE_ENABLE_ADSENSE'] === 'true')};var allowed=${shouldLoadAdsense.toString()};function load(){var consent;try{consent=localStorage.getItem('ft-cookie-consent');}catch(e){return;}if(!allowed(enabled,location.hostname,consent)||document.getElementById('ft-adsense'))return;var s=document.createElement('script');s.id='ft-adsense';s.async=true;s.crossOrigin='anonymous';s.src=${JSON.stringify(tracking.adsenseScript)};document.head.appendChild(s);}load();window.addEventListener('ft-cookie-consent-changed',load);})();`;