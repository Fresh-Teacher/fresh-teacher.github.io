import { useEffect, useLayoutEffect, useRef, useState, type SyntheticEvent, type TouchEvent } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { homepageShelves, homepageClassNames } from '@/data/homepage-shelves';
import repairCSS from '../styles/import-repairs.css?raw';
import capturedCssUrl from '../styles/captured.css?url';
import { jsonLd, LOGO_URL, pageMeta, SITE_NAME, SITE_URL } from '@/lib/site';

// Read by search engines and screen readers; the door animation stays the visible first screen.
const visuallyHidden = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 } as const;

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => {
    const page = pageMeta({
      path: '/',
      title: "Fresh Teacher's Library – Lesson Notes, Past Papers & Schemes of Work",
      description: "Free lesson notes, past papers and schemes of work for Ugandan nursery, primary and secondary schools, from Baby Class to Senior Six.",
    });
    return {
      meta: page.meta,
      links: [...page.links, { rel: "stylesheet", href: capturedCssUrl }],
      scripts: [jsonLd({
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: SITE_NAME, inLanguage: 'en',
            publisher: { '@id': `${SITE_URL}/#organization` },
            potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?query={search_term_string}` }, 'query-input': 'required name=search_term_string' } },
          { '@type': 'EducationalOrganization', '@id': `${SITE_URL}/#organization`, name: SITE_NAME, alternateName: 'Fresh Teacher', url: `${SITE_URL}/`,
            logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 }, areaServed: { '@type': 'Country', name: 'Uganda' } },
        ],
      })],
    };
  },
  component: Index,
});

export function Index() {
  const [doorOpen, setDoorOpen] = useState(false);
  const [doorSettled, setDoorSettled] = useState(false);
  const opened = useRef(false);
  const audio = useRef<HTMLAudioElement>(null);
  // Match SSR on the first render, then restore before the browser paints client navigation.
  useLayoutEffect(() => {
    try {
      if (sessionStorage.getItem('library-door-open') === '1') {
        opened.current = true;
        setDoorOpen(true);
        setDoorSettled(true);
      }
    } catch { /* Storage may be unavailable. */ }
    document.documentElement.dataset['freshReady'] = 'true';
  }, []);
  useEffect(() => {
    if (!doorOpen || doorSettled) return;
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 2000;
    const timer = window.setTimeout(() => setDoorSettled(true), delay);
    return () => window.clearTimeout(timer);
  }, [doorOpen, doorSettled]);
  const openDoor = (event: SyntheticEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (opened.current) return;
    opened.current = true;
    setDoorOpen(true);
    try { sessionStorage.setItem('library-door-open', '1'); } catch { /* Storage unavailable. */ }
    audio.current?.removeAttribute('data-early-played');
    void audio.current?.play().catch(() => {});
  };
  const absorbTouch = (event: TouchEvent<HTMLElement>) => event.stopPropagation();
  const doorState = `${doorOpen ? ' door-open' : ''}${doorSettled ? ' door-settled' : ''}`;
  const doorProps = {
    variant: 'source' as const, size: 'source' as const,
    'aria-label': 'Open library', tabIndex: doorOpen ? -1 : 0,
    'aria-hidden': doorSettled,
    onClick: openDoor, onTouchStart: absorbTouch, onTouchMove: absorbTouch, onTouchEnd: openDoor,
  };
  return <div className="library-homepage">
    <style>{repairCSS}</style>
    <h1 style={visuallyHidden}>Fresh Teacher's Library – Uganda Lesson Notes, Past Papers &amp; Schemes of Work</h1>
    <Button {...doorProps} className={`leftcurtain${doorState}`}>
      <img src="/__l5e/assets-v1/4373bdc3-b065-4dee-ab19-0780eab6434e/7c2eea45ca9862de.webp" alt="" fetchPriority="high" decoding="async" />
    </Button>
    <Button {...doorProps} className={`rightcurtain${doorState}`}>
      <img src="/__l5e/assets-v1/15ff8b2e-9ded-417f-bd6f-9b1bda768c46/d52f1d3e4b7ea8ab.webp" alt="" fetchPriority="high" decoding="async" />
    </Button>
    <Button {...doorProps} className={`rope${doorState}`}>
      <b className="door-instruction">Tap on the door to enter</b>
      <img className="door-arrow" src="/__l5e/assets-v1/797833db-47fc-42ae-9e47-48a95c206600/243d7d09dd033233.webp" alt="" width="70" fetchPriority="high" decoding="async" />
    </Button>
    <div className="container">
      <p className="homepage-instruction">Choose one class from the shelf to continue.</p>
      <div className="page-wrapper" inert={!doorOpen} suppressHydrationWarning>
        {homepageShelves.map((shelf, shelfIndex) => <span className="shelf-row" key={shelfIndex}>
          <div className="bookshelf">
            <div className="covers">
              {shelf.map(([href, src]) => <div className="thumb book-1" key={href}>
                <a href={href} aria-label={`Open ${homepageClassNames[href ?? '']} resources`}>
                  <img src={src} alt={homepageClassNames[href ?? '']} width="1654" height="2339" loading="lazy" decoding="async" />
                </a>
              </div>)}
            </div>
            <img className="shelf-img" src="/__l5e/assets-v1/399d77fe-8a95-4c7e-add0-baf5990d224a/36bc42cbc31e7907.webp" alt="" width="1000" height="96" decoding="async" />
          </div>
        </span>)}
      </div>
      <audio ref={audio} id="audiocracker" src="/__l5e/assets-v1/cf501954-f080-4191-86cf-fa10dc89d210/door.mp3" preload="auto" suppressHydrationWarning />
    </div>
  </div>;
}
