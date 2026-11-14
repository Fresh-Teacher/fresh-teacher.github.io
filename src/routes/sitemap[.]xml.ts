import { createFileRoute } from '@tanstack/react-router';
import { getRouterInstance } from '@tanstack/react-start';
import { isSitemapRouteIncluded, publicCatalogPaths, SITEMAP_BASE_URL, sitemapPathForLocation, sitemapStaticPaths, sitemapXML } from '@/lib/sitemap';

export const Route = createFileRoute('/sitemap.xml')({
  staticData: { sitemap: false },
  server: { handlers: { GET: async () => {
    const router = await getRouterInstance();
    const entries = sitemapStaticPaths(router).map(path => ({ path }));
    if (isSitemapRouteIncluded(router.routesById['/$'])) {
      for (const pathname of publicCatalogPaths()) {
        const location = router.buildLocation({ to: '/$', params: { _splat: pathname.slice(1) }, search: () => ({}), hash: '' });
        const path = sitemapPathForLocation(router, location, '/$');
        if (path) entries.push({ path });
      }
    }
    if (!entries.length) return new Response('No public pages included', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    // Catalog extraction/build dates do not describe significant page changes.
    return new Response(sitemapXML(SITEMAP_BASE_URL, entries), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
  } } },
});