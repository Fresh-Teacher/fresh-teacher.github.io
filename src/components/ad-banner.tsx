import { useEffect, useRef } from 'react';
import units from '@/data/ad-units.json';
import tracking from '@/data/site-tracking.json';
import { requestAdOnce, shouldRequestManualAd } from '@/lib/manual-ads';

type AdWindow = Window & { adsbygoogle?: { push: (value: Record<string, never>) => unknown } };

export function AdBanner({ placement, identity }: { placement: keyof typeof units; identity: string }) {
  const element = useRef<HTMLModElement>(null);
  const slot = units[placement] as string | null;
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const request = () => {
      if (!shouldRequestManualAd(import.meta.env['VITE_ENABLE_ADSENSE'] === 'true', location.hostname, slot)) return;
      const script = document.getElementById('ft-adsense') as HTMLScriptElement | null;
      if (!script || !node.isConnected || node.getBoundingClientRect().width === 0) return;
      requestAdOnce(node, () => {
        const adWindow = window as AdWindow;
        const queue = adWindow.adsbygoogle ?? ([] as Record<string, never>[]);
        adWindow.adsbygoogle = queue;
        queue.push({});
      });
    };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) request();
    }, { rootMargin: '200px' });
    observer.observe(node);
    return () => { observer.disconnect(); };
  }, [slot, identity]);

  return <aside className="library-ad" aria-label="Advertisement">
    <p className="library-ad-label">Advertisement</p>
    <div className="library-ad-space">
      {slot ? <ins key={identity} ref={element} className="adsbygoogle library-ad-unit" data-ad-client={tracking.adsensePublisher} data-ad-slot={slot} /> : <div className="library-ad-placeholder" aria-hidden="true" />}
    </div>
  </aside>;
}