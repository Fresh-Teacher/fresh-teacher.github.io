// External hosting only; the normal Lovable runtime remains unchanged.
import { defineConfig } from '@lovable.dev/vite-tanstack-config';
import { githubPagesPaths } from './scripts/github-pages-config';

// GitHub's user-site origin, never a repository preview or Lovable hostname.
process.env['VITE_PUBLIC_SITE_URL'] ??= 'https://fresh-teacher.github.io';

export default defineConfig({
  nitro: false,
  tanstackStart: {
    server: { entry: 'server' },
    pages: githubPagesPaths().map(path => ({ path })),
    prerender: { enabled: true, autoStaticPathsDiscovery: false, crawlLinks: false, failOnError: true, concurrency: 4 },
    spa: { enabled: true, maskPath: '/_shell' },
  },
});