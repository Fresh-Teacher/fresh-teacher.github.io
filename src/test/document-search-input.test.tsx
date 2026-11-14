import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DocumentSearchInput } from '@/components/document-search-input';
import { filterResources, type ResourceRecord } from '@/lib/resources';

afterEach(cleanup);
const items: ResourceRecord[] = [
  { title: 'P7 Mathematics Notes', description: 'Primary seven maths notes', price: 0, pdfUrl: 'https://example.com/p7-maths.pdf' },
  { title: 'P7 Science Notes', description: 'Primary seven science notes', price: 0, pdfUrl: 'https://example.com/p7-science.pdf' },
];
function setup() {
  function Harness() {
    const [query, setQuery] = useState('');
    return <><DocumentSearchInput items={items} query={query} onChange={setQuery} /><div data-testid="matches">{filterResources(items, query).map(item => item.pdfUrl).join(',')}</div></>;
  }
  render(<Harness />);
  const input = screen.getByRole('combobox');
  fireEvent.focus(input);
  return input;
}
it('uses the current catalog for suggestions and typo-tolerant local matches', async () => {
  const input = setup();
  fireEvent.change(input, { target: { value: 'mathemtics' } });
  await screen.findByRole('option', { name: /P.7 Mathematics Notes/ });
  expect(screen.queryByRole('option', { name: /Science Notes/ })).toBeNull();
  expect(screen.getByTestId('matches').textContent).toBe(items[0]?.pdfUrl);
});
it('selects a keyboard suggestion without leaving the local catalog', async () => {
  const input = setup();
  fireEvent.change(input, { target: { value: 'science' } });
  await screen.findByRole('option', { name: /Science Notes/ });
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(input).toHaveValue('P.7 Science Notes');
  expect(screen.getByTestId('matches').textContent).toBe(items[1]?.pdfUrl);
  expect(input).toHaveAttribute('aria-expanded', 'false');
});
it('dismisses suggestions with Escape while preserving the filter, and clear restores all documents', async () => {
  const input = setup();
  fireEvent.change(input, { target: { value: 'science' } });
  await screen.findByRole('option', { name: /Science Notes/ });
  fireEvent.keyDown(input, { key: 'Escape' });
  expect(input).toHaveValue('science');
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect(input).toHaveValue('');
  expect(input).toHaveFocus();
  expect(screen.getByTestId('matches').textContent).toBe(items.map(item => item.pdfUrl).join(','));
});
it('discards stale suggestions when the query changes', async () => {
  const input = setup();
  fireEvent.change(input, { target: { value: 'science' } });
  await screen.findByRole('option', { name: /Science Notes/ });
  fireEvent.change(input, { target: { value: 'zzzzzzzz' } });
  expect(screen.queryByRole('option')).toBeNull();
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('No matching documents'));
});