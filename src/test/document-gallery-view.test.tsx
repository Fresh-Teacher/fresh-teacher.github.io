import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DocumentGallery } from '@/components/document-gallery';
import { BROKEN_THUMB_URL } from '@/lib/document-formats';

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: '/PrimaryFiveClassPastPapers.html' }),
  Link: ({ children, params }: { children: React.ReactNode; params: { slug: string } }) => <a href={`/doc/${params.slug}`}>{children}</a>,
}));
vi.mock('@/lib/file-sizes', () => ({ fileSize: async () => null, formatSize: () => '' }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const BAKED = { pdfUrl: 'https://fresh-teacher.github.io/P7_SST_Full_Year_2024.pdf', description: '', price: 5000, thumbUrl: '/thumbs/p7-sst.jpg' };

it('spins over the file-type card until the real cover arrives', async () => {
  vi.useFakeTimers();
  render(<DocumentGallery items={[BAKED]} />);
  act(() => { vi.advanceTimersByTime(200); });
  expect(screen.getByRole('status', { name: 'Loading document cover…' })).toBeTruthy();
  expect(document.querySelector('img.dg-thumb-cover-ready')).toBeNull();
  const image = document.querySelector('img.dg-thumb-cover');
  if (!image) throw new Error('Cover missing');
  fireEvent.load(image);
  act(() => {});
  expect(screen.queryByRole('status', { name: 'Loading document cover…' })).toBeNull();
  expect(document.querySelector('img.dg-thumb-cover-ready')).toBeTruthy();
});

it('names every cover image after its document so search engines can read it', async () => {
  await act(async () => { render(<DocumentGallery items={[BAKED]} />); });
  const image = screen.getByRole('img', { name: 'P.7 SST Full Year 2024 cover' });
  expect(image.getAttribute('src')).toBe('https://cdn.jsdelivr.net/gh/Springing-Starz/garden-paths-atlas@main/public/thumbs/p7-sst.jpg');
});

it('shows the file-type card instead of a cover when a document has no baked thumbnail', async () => {
  await act(async () => { render(<DocumentGallery items={[{ pdfUrl: 'https://fresh-teacher.github.io/lesson.docx', description: '', price: 5000 }]} />); });
  expect(document.querySelector('img.dg-file-logo')).toBeTruthy();
  expect(document.querySelector('img.dg-thumb-cover')).toBeNull();
});

it('falls back to the file-type card when a cover fails to load', async () => {
  await act(async () => { render(<DocumentGallery items={[BAKED]} />); });
  const image = document.querySelector('img.dg-thumb-cover');
  if (!image) throw new Error('Cover missing');
  fireEvent.error(image);
  expect(document.querySelector('img.dg-thumb-cover')).toBeNull();
  expect(document.querySelector('img.dg-file-logo')).toBeTruthy();
});

it('opens catalog PDFs through the original overlay callback but keeps Word viewing on its dedicated page', async () => {
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} });
  const pdf = { pdfUrl: 'https://fresh-teacher.github.io/lesson.pdf', description: '', price: 5000 };
  const word = { ...pdf, pdfUrl: 'https://fresh-teacher.github.io/lesson.docx' };
  const onView = vi.fn();
  await act(async () => { render(<DocumentGallery items={[pdf, word]} onView={onView} />); });
  const view = screen.getByRole('button', { name: /^View$/ });
  fireEvent.click(view);
  expect(onView).toHaveBeenCalledWith(view, pdf);
  expect(screen.getByRole('link', { name: /^View$/ }).getAttribute('href')).toMatch(/^\/doc\//);
  expect(onView).toHaveBeenCalledTimes(1);
});

it('shows broken-link records with the broken cover, including directly supplied search pages', async () => {
  const broken = { ...BAKED, pdfUrl: 'https://fresh-teacher.github.io/P7_Missing_Maths.pdf', thumbUrl: BROKEN_THUMB_URL };
  const searchResults = { total: 2, page: 1, sort: 'source', type: 'all', onChange: vi.fn() };
  let view: ReturnType<typeof render>;
  await act(async () => { view = render(<DocumentGallery items={[BAKED, broken]} ads={false} />); });
  expect(screen.getByRole('heading', { name: 'P.7 SST Full Year 2024' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'P.7 Missing Maths' })).toBeTruthy();
  await act(async () => { view!.rerender(<DocumentGallery items={[BAKED, broken]} ads={false} searchResults={searchResults} />); });
  expect(screen.getByRole('heading', { name: 'P.7 Missing Maths' })).toBeTruthy();
});
