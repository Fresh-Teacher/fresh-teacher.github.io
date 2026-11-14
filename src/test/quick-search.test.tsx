import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { QuickSearch } from '@/components/navigation/quick-search';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), search: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({ useRouter: () => ({ navigate: mocks.navigate }) }));
vi.mock('@/lib/library-search', () => ({ searchLibrary: mocks.search, preloadLibrarySearch: () => Promise.resolve([]) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear(); });
const item = { title: 'P7 Science Notes', description: 'Primary seven science lesson notes', price: 0, pdfUrl: 'https://example.com/science.pdf' };
function setup() {
  HTMLElement.prototype.scrollIntoView = vi.fn();
  const close = vi.fn();
  render(<QuickSearch open onOpenChange={close} triggerRef={createRef<HTMLButtonElement>()} />);
  return close;
}
it('hands Enter to the full search page with a shareable query', async () => {
  mocks.search.mockResolvedValue({ items: [item], total: 48 });
  const close = setup();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'P7 science' } });
  await screen.findByRole('option', { name: /P.7 Science Notes/i });
  fireEvent.submit(screen.getByRole('search'));
  expect(mocks.navigate).toHaveBeenCalledWith({ to: '/search', search: { query: 'P7 science', page: 1, sort: 'source', type: 'all', layout: 'grid' } });
  expect(close).toHaveBeenCalledWith(false);
});
it('opens a keyboard-selected document with its full search return context', async () => {
  mocks.search.mockResolvedValue({ items: [item], total: 48 });
  setup();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'P7 science' } });
  await screen.findByRole('option', { name: /P.7 Science Notes/i });
  fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
  fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
  expect(mocks.navigate).toHaveBeenCalledWith(expect.objectContaining({ to: '/doc/$slug', search: { source: '/search', query: 'P7 science', page: 1 } }));
});
it('ignores a stale response when a newer query has finished', async () => {
  let resolveOld: ((value: { items: typeof item[]; total: number }) => void) | undefined;
  mocks.search.mockImplementation((query: string) => query === 'science' ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve({ items: [], total: 0 }));
  setup();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'science' } });
  await waitFor(() => expect(mocks.search).toHaveBeenCalledWith('science', 1, 5));
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'unmatched' } });
  await screen.findByText(/No documents found/);
  resolveOld?.({ items: [item], total: 48 });
  await waitFor(() => expect(screen.queryByRole('option')).not.toBeInTheDocument());
  expect(screen.getByRole('status')).toHaveTextContent('unmatched');
});