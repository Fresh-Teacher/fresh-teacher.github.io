import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { publicCatalogPaths, sitemapStaticPaths, sitemapPathForLocation, sitemapXML } from '../lib/sitemap';

function testRouter() {
  const root = createRootRoute({ staticData: { sitemap: false } });
  const index = createRoute({ getParentRoute: () => root, path: '/', staticData: { sitemap: true } });
  const search = createRoute({ getParentRoute: () => root, path: 'search', staticData: { sitemap: false } });
  const splat = createRoute({ getParentRoute: () => root, path: '$', staticData: { sitemap: true } });
  return createRouter({ routeTree: root.addChildren([index, search, splat]) });
}

describe('public library sitemap', () => {
  it('includes registered public class and catalog pages, not the redirected index alias', () => {
    const paths = publicCatalogPaths();
    expect(paths).toContain('/p1.html');
    expect(paths).toContain('/baby.html');
    expect(paths).toContain('/PrimaryFiveMTCPastPapers.html');
    expect(paths).not.toContain('/index.html');
    expect(new Set(paths).size).toBe(paths.length);
  });
  it('derives static routes from their explicit inclusion decisions', () => {
    expect(sitemapStaticPaths(testRouter())).toEqual(['/']);
  });
  it('allows only registered catalog paths through the library catch-all', () => {
    const router = testRouter();
    expect(sitemapPathForLocation(router, router.buildLocation({ to: '/$', params: { _splat: 'p1.html' } }), '/$')).toBe('/p1.html');
    expect(sitemapPathForLocation(router, router.buildLocation({ to: '/$', params: { _splat: 'menu baby.html' } }), '/$')).toBe('/menu%20baby.html');
    expect(sitemapPathForLocation(router, router.buildLocation({ to: '/$', params: { _splat: 'missing.html' } }), '/$')).toBeUndefined();
  });
  it('uses the supplied production origin and omits fallback modification dates', () => {
    const xml = sitemapXML('https://fresh-teacher.github.io', [{ path: '/' }, { path: '/p1.html' }, { path: '/p1.html' }]);
    expect(xml).toContain('<loc>https://fresh-teacher.github.io/p1.html</loc>');
    expect(xml.match(/<url>/g)).toHaveLength(2);
    expect(xml).not.toContain('<lastmod>');
  });
  it('preserves an authoritative page timestamp when supplied', () => {
    expect(sitemapXML('https://fresh-teacher.github.io', [{ path: '/p1.html', lastmod: '2026-11-01' }])).toContain('<lastmod>2026-11-01</lastmod>');
  });
  it('rejects unsafe paths and repository subpath origins', () => {
    expect(() => sitemapXML('https://fresh-teacher.github.io/repo', [{ path: '/' }])).toThrow();
    expect(() => sitemapXML('https://fresh-teacher.github.io', [{ path: '//example.com' }])).toThrow();
  });
});