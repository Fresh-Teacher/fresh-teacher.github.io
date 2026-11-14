import { expect, it } from 'vitest';
import { githubPagesPaths, MAX_STATIC_PAGES } from '../../scripts/github-pages-config';

it('keeps the old homepage and class links in the static deployment', () => {
  const paths = githubPagesPaths();
  expect(paths).toContain('/');
  expect(paths).toContain('/p1.html');
  expect(paths).toContain('/baby.html');
  expect(paths.length).toBeLessThanOrEqual(MAX_STATIC_PAGES);
});