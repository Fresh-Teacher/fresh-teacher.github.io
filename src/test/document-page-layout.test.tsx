import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LegacyDocumentPage } from '@/components/legacy-document-page';
import { ResourcePage } from '@/components/resource-page';
import type { ResourceRecord } from '@/lib/resources';

const { openResourceViewer } = vi.hoisted(() => ({ openResourceViewer: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/resource-viewer', () => ({ openResourceViewer }));
vi.mock('@/components/document-search-input', () => ({
  DocumentSearchInput: ({ id, query, onChange }: { id: string; query: string; onChange: (query: string) => void }) =>
    <input id={id} aria-label="Search documents" value={query} onChange={event => onChange(event.target.value)} />,
}));
vi.mock('@/components/document-gallery', () => ({
  DocumentGallery: ({ items, onView }: { items: ResourceRecord[]; onView: (element: HTMLElement, item: ResourceRecord) => void }) =>
    <>{items.map(item => <button key={item.pdfUrl} onClick={event => onView(event.currentTarget, item)}>{item.title}</button>)}</>,
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const items: ResourceRecord[] = [
  { title: 'English Lesson', pdfUrl: 'https://example.com/english.pdf', description: '', price: 0 },
  { title: 'Mathematics Lesson', pdfUrl: 'https://example.com/mathematics.pdf', description: '', price: 0 },
];

for (const mode of ['resource', 'infinite', 'paginated'] as const) {
  it(`${mode} document layout preserves filtering, clearing and PDF viewing`, async () => {
    await act(async () => {
      render(mode === 'resource'
        ? <ResourcePage data={{ title: 'Lessons', description: '', styles: '', items }} />
        : <LegacyDocumentPage data={{ title: 'Lessons', description: '', items, mode, template: mode === 'infinite' ? '3963a9155f37d82c' : '1f7a0e2e43bf90c3', styles: 'css', links: [], missingData: null }} fragments={{ css: '' }} />);
    });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'English' } });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Mathematics Lesson' })).toBeNull());
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mathematics Lesson' })).toBeTruthy());
    const view = screen.getByRole('button', { name: 'English Lesson' });
    fireEvent.click(view);
    await waitFor(() => expect(openResourceViewer).toHaveBeenCalledWith(...(mode === 'resource' ? [view, items[0]] : [view, items[0], mode === 'infinite'])));
  });
}