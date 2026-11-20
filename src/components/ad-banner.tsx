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
    const script = document.getElementById('ft-adsense') as HTMLScriptElement | null;
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
    // Retry visible units when the asynchronously loaded bootstrap is ready.
    const onLoad = () => {
      const bounds = node.getBoundingClientRect();
      if (bounds.bottom >= -200 && bounds.top <= window.innerHeight + 200) request();
    };
    script?.addEventListener('load', onLoad);
    return () => { observer.disconnect(); script?.removeEventListener('load', onLoad); };
  }, [slot, identity]);

  return <aside className="library-ad" aria-label="Advertisement">
    <p className="library-ad-label">Advertisement</p>
    <div className="library-ad-space">
      {slot ? <ins key={identity} ref={element} className="adsbygoogle library-ad-unit" data-ad-client={tracking.adsensePublisher} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" /> : <div className="library-ad-placeholder" aria-hidden="true" />}
    </div>
  </aside>;
}