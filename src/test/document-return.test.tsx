import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DocumentDetail } from '@/components/document-detail';
import type { DocumentData } from '@/lib/document-catalog';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, search, children }: { to: string; search?: Record<string, string | number>; children: React.ReactNode }) => {
    const query = search ? `?${new URLSearchParams(Object.entries(search).map(([key, value]) => [key, String(value)]))}` : '';
    return <a href={`${to}${query}`}>{children}</a>;
  },
  useLocation: () => ({ pathname: '/doc/example' }),
}));
vi.mock('@/components/document-viewer', () => ({ DocumentViewer: () => null }));
vi.mock('@/components/document-actions', () => ({ DocumentDownload: () => null, DocumentShare: () => null }));
vi.mock('@/lib/file-sizes', () => ({ fileSize: async () => null, formatSize: () => '' }));

afterEach(cleanup);

it('returns from a document to the complete full-search state', () => {
  const data: DocumentData = {
    item: { pdfUrl: 'https://fresh-teacher.github.io/P7-MTC.pdf', description: '', price: 5000 },
    path: 'PrimarySevenPastPapers.html', category: 'Primary Seven Past Papers', related: [], slug: 'example',
  };
  render(<DocumentDetail data={data} context={{ source: '/search', query: 'MTC P7', page: 7, sort: 'title-desc', type: 'PDF', layout: 'list' }} />);
  expect(screen.getByRole('link', { name: 'Back to search results' })).toHaveAttribute('href', '/search?query=MTC+P7&page=7&sort=title-desc&type=PDF&layout=list');
});
