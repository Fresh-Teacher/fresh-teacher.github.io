import { expect, it } from 'vitest';
import { documentPlaceholder } from '@/lib/document-placeholder';

it('uses the uploaded red PDF placeholder', () => {
  expect(documentPlaceholder('https://example.org/lesson.PDF?download=1')?.url).toMatch(/-pdf.webp$/);
});
it('uses the uploaded Word placeholder for both Word formats', () => {
  for (const extension of ['doc', 'docx']) expect(documentPlaceholder(`https://example.org/lesson.${extension}`)?.url).toMatch(/-word.webp$/);
});
it('uses the uploaded Excel placeholder for both Excel formats', () => {
  for (const extension of ['xls', 'xlsx']) expect(documentPlaceholder(`https://example.org/lesson.${extension}`)?.url).toMatch(/-excel.webp$/);
});
it('uses the uploaded PowerPoint placeholder for presentations and slideshows', () => {
  for (const extension of ['ppt', 'pptx', 'pps', 'ppsx']) expect(documentPlaceholder(`https://example.org/lesson.${extension}`)?.url).toMatch(/-powerpoint.webp$/);
});
it('retains a generic fallback for other formats', () => {
  expect(documentPlaceholder('https://example.org/lesson.txt')?.url).toMatch(/-txt.webp$/);
  expect(documentPlaceholder('https://example.org/lesson.rtf')?.url).toMatch(/-rtf.png$/);
});
it('uses the zipped-folder placeholder for compressed files', () => {
  for (const extension of ['zip', 'rar', '7z', 'tar', 'gz']) expect(documentPlaceholder(`https://example.org/notes.${extension}`)?.url).toMatch(/-archive.webp$/);
});
