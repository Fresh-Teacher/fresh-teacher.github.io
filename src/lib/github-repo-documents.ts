import type { ResourceRecord } from './resources';
import { isDocumentFile } from './document-formats';

const OWNER = 'Fresh-Teacher';

/** GitHub Pages (Jekyll) hides files and folders starting with these characters. */
const HIDDEN_BY_PAGES = /^[_.#~]/;

/** Repos without a GitHub Pages site; their files are served from raw GitHub content instead. */
export const REPOS_WITHOUT_PAGES = new Set(['s6-past-papers','s4-past-papers','s1','p7-past-papers','p7-sst-past-papers','p6-past-papers','p5-past-papers','p4-past-papers','p3','p3-past-papers','p2-past-papers','p1-past-papers','baby']);

/** Public URL for a file inside a Fresh-Teacher repository, with every path segment encoded. */
export function repoFileUrl(repo: string, path: string) {
  const segments = path.split('/');
  const encoded = segments.map(encodeURIComponent).join('/');
  // Every More Documents repo is served from raw GitHub so files never depend on GitHub Pages being enabled.
  if (repo.toLowerCase() !== 'fresh-teacher.github.io' || segments.some(segment => HIDDEN_BY_PAGES.test(segment))) {
    return `https://raw.githubusercontent.com/${OWNER}/${encodeURIComponent(repo)}/HEAD/${encoded}`;
  }
  const base = repo.toLowerCase() === 'fresh-teacher.github.io' ? 'https://fresh-teacher.github.io' : `https://fresh-teacher.github.io/${repo}`;
  return `${base}/${encoded}`;
}

export function treeToDocuments(repo: string, tree: { path: string; type: string }[]): ResourceRecord[] {
  return tree
    .filter(entry => entry.type === 'blob')
    .map(entry => ({ title: '', description: '', price: '', pdfUrl: repoFileUrl(repo, entry.path) }))
    .filter(item => isDocumentFile(item.pdfUrl));
}

/** Compatibility entry point backed exclusively by bundled static catalog files. */
export async function fetchRepoDocuments(repo: string): Promise<ResourceRecord[]> {
  const { loadRepositoryDocuments } = await import('./repository-catalog');
  return loadRepositoryDocuments(repo);
}
