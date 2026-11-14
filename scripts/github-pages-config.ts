import resources from '../src/data/resource-manifest.json';
import legacy from '../src/data/legacy/manifest.json';

export const MAX_STATIC_PAGES = 2000;
export function githubPagesPaths() {
  const paths = [...new Set(['/', '/about', '/cookies', '/disclaimer', '/privacy', '/terms', '/search', '/sitemap.xml',
    ...Object.keys(resources).map(path => `/${path}`),
    ...Object.keys(legacy).filter(path => path !== 'index.html').map(path => `/${path}`)])];
  if (paths.length > MAX_STATIC_PAGES) throw new Error('Static page limit exceeded; review the publishing list.');
  return paths;
}