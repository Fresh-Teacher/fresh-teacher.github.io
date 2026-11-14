import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DocumentInformation } from '@/components/document-information';
import { documentContent } from '@/lib/document-content';

afterEach(cleanup);
const content = documentContent({ pdfUrl: 'https://fresh-teacher.github.io/P.4_MTC_NOTES_2024.pdf', description: '', price: 5000 });

it('shows document details straight away with nothing to expand', () => {
  const { container } = render(<DocumentInformation content={content} bytes={1024} />);
  expect(screen.getByRole('heading', { name: 'About this document' })).not.toBeNull();
  expect(screen.queryAllByRole('button')).toHaveLength(0);
  const facts = container.querySelector('dl');
  expect(facts).not.toBeNull();
  const text = facts?.textContent ?? '';
  expect(text).toContain('Document Name');
  expect(text).toContain('Size');
  expect(text).toContain('1 KB');
  expect(text).toContain(content.title);
});

it('has no FAQs section and leaves out facts it does not know', () => {
  const { container } = render(<DocumentInformation content={content} bytes={null} />);
  expect(screen.queryByRole('heading', { name: /FAQ/i })).toBeNull();
  const text = container.querySelector('dl')?.textContent ?? '';
  expect(text).not.toContain('Size');
  expect(text).toContain('Document Name');
});
