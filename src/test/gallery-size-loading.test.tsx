import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DocumentGallery } from '@/components/document-gallery';

const probe = vi.hoisted(() => vi.fn(async () => 2048));
vi.mock('@/lib/file-sizes', () => ({ fileSize: probe, formatSize: (bytes: number) => `${bytes} B` }));
vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: '/PrimaryFiveMTCPastPapers.html' }),
  Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href="#" {...props}>{children}</a>,
}));
afterEach(() => { cleanup(); probe.mockClear(); });

it('does not probe file sizes while browsing or changing layout', async () => {
  await act(async () => { render(<DocumentGallery ads={false} items={[{ pdfUrl: 'https://fresh-teacher.github.io/a.docx', description: '', price: '' }]} />); });
  fireEvent.click(screen.getByRole('button', { name: 'List view' }));
  expect(probe).not.toHaveBeenCalled();
});

it('filters by baked sizes without probing remote files', async () => {
  const items = [512, 2 * 1024 * 1024, 6 * 1024 * 1024].map((sizeBytes, index) => ({ pdfUrl: `https://fresh-teacher.github.io/${index}.docx`, description: '', price: '', sizeBytes }));
  await act(async () => { render(<DocumentGallery ads={false} items={items} initialContext={{ size: 'small' }} />); });
  expect(screen.getAllByRole('link', { name: /^Open / })).toHaveLength(1);
  expect(screen.getByRole('link', { name: 'Open 0' })).toBeTruthy();
  expect(probe).not.toHaveBeenCalled();
});

it('resolves missing sizes only when a size filter is explicitly active', async () => {
  await act(async () => { render(<DocumentGallery ads={false} items={[{ pdfUrl: 'https://fresh-teacher.github.io/missing.docx', description: '', price: '' }]} initialContext={{ size: 'small' }} />); });
  expect(probe).toHaveBeenCalledExactlyOnceWith('https://fresh-teacher.github.io/missing.docx');
  expect(screen.getByRole('link', { name: 'Open Missing' })).toBeTruthy();
});