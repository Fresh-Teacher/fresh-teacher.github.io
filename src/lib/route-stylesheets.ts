import { useEffect, useLayoutEffect, useState } from 'react';

// Route-scoped legacy stylesheets. The route head() still declares them so SSR
// and the static prerender ship styled HTML, but client-side navigation leaves
// those <link> tags in <head> after leaving the route, and their cascade breaks
// unrelated pages. This hook reference-counts the links: it attaches before
// paint (layout effect), keeps links shared by the next page, and only removes
// unused links once every newly requested stylesheet has finished loading, so
// navigation never paints a half-styled or wrongly-styled frame.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const counts = new Map<string, number>();
const pending = new Set<Promise<void>>();
const loading = new Map<string, Promise<void>>();
let sweepScheduled = false;

function linksFor(href: string) {
  return Array.from(document.head.querySelectorAll<HTMLLinkElement>(`link[rel="stylesheet"][href="${href}"]`));
}

function sweep() {
  if (sweepScheduled) return;
  sweepScheduled = true;
  requestAnimationFrame(async () => {
    while (pending.size) await Promise.all(Array.from(pending));
    sweepScheduled = false;
    for (const [href, count] of Array.from(counts)) {
      if (count > 0) continue;
      counts.delete(href);
      for (const link of linksFor(href)) link.remove();
    }
  });
}

const warmed = new Map<string, Promise<void>>();

// Downloads a route's stylesheets into the HTTP cache without applying them, so a
// loader can fetch CSS in parallel with its data. Applying them early would leak
// their cascade onto the page still on screen (and onto hover-preloaded routes),
// so only the hook above ever attaches a real stylesheet. Never rejects; a slow or
// failed download just resolves after the timeout and the hook's own wait takes over.
export function warmRouteStylesheets(hrefs: string[], timeoutMs = 2500): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  return Promise.all(hrefs.map((href) => {
    if (linksFor(href).some((link) => link.sheet)) return Promise.resolve();
    let request = warmed.get(href);
    if (!request) {
      request = new Promise<void>((resolve) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = href;
        link.addEventListener('load', () => resolve(), { once: true });
        link.addEventListener('error', () => resolve(), { once: true });
        setTimeout(resolve, timeoutMs);
        document.head.appendChild(link);
      });
      warmed.set(href, request);
    }
    return request;
  })).then(() => undefined);
}

// Returns false while any of this page's stylesheets is still downloading so the
// caller can keep the page hidden instead of painting an unstyled frame.
export function useRouteStylesheets(hrefs: string[]) {
  const key = hrefs.join('\n');
  const [ready, setReady] = useState(true);
  useIsoLayoutEffect(() => {
    const files = key.split('\n').filter(Boolean);
    for (const href of files) {
      counts.set(href, (counts.get(href) ?? 0) + 1);
      const matches = linksFor(href);
      if (matches.length === 0) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        const done = new Promise<void>((resolve) => {
          link.addEventListener('load', () => resolve(), { once: true });
          link.addEventListener('error', () => resolve(), { once: true });
          setTimeout(resolve, 4000);
        });
        pending.add(done);
        loading.set(href, done);
        done.then(() => { pending.delete(done); loading.delete(href); });
        document.head.appendChild(link);
      } else {
        for (const extra of matches.slice(1)) extra.remove();
      }
    }
    const waits = files.map((href) => loading.get(href)).filter(Boolean) as Promise<void>[];
    let cancelled = false;
    if (waits.length) {
      setReady(false);
      Promise.all(waits).then(() => { if (!cancelled) setReady(true); });
    } else setReady(true);
    return () => {
      cancelled = true;
      for (const href of files) counts.set(href, Math.max(0, (counts.get(href) ?? 1) - 1));
      sweep();
    };
  }, [key]);
  return ready;
}
