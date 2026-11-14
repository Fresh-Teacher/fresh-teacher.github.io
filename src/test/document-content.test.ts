import { describe, expect, it } from 'vitest';
import { documentContent } from '@/lib/document-content';
import { documentMetadata } from '@/lib/document-metadata';
import type { ResourceRecord } from '@/lib/resources';

const record = (name: string, description = ''): ResourceRecord => ({ pdfUrl: `https://fresh-teacher.github.io/${name}`, description, price: 5000 });

describe('Source-backed document content', () => {
  it('uses detected class, subject, term, year and file format', () => {
    const content = documentContent(record('P_7_MATHS_MOCK_2023_TERM_II.pdf', 'Primary Seven'));
    expect(content.metadata).toEqual({ subject: 'Mathematics', level: 'P7', year: '2023', term: 'Term 2', kind: 'Mock' });
    expect(content.facts).toEqual([
      { label: 'Subject', value: 'Mathematics' }, { label: 'Class', value: 'Primary 7' },
      { label: 'Year', value: '2023' }, { label: 'Term', value: 'Term 2' },
      { label: 'Resource type', value: 'Mock' }, { label: 'File format', value: 'PDF' },
    ]);
  });
  it('does not supply missing educational facts', () => {
    const content = documentContent(record('Untitled.pdf'));
    expect(content.facts).toEqual([{ label: 'File format', value: 'PDF' }]);
    expect(content.questions).toEqual([]);
    expect(content.metadata).toEqual({ subject: undefined, year: undefined, term: undefined, level: undefined, kind: undefined });
  });
  it('uses the actual office format without relabelling it PDF', () => {
    expect(documentContent(record('Senior Two English Notes.docx')).format).toBe('DOCX');
  });
  it('retains all explicitly named classes and terms', () => {
    expect(documentMetadata(record('P.5 & P.6 Revision TERM I, II, III.pdf'))).toMatchObject({ level: 'P5, P6', term: 'Terms 1, 2, 3' });
  });
  it('recognises word-number terms from catalog filenames', () => {
    expect(documentMetadata(record('P.5 GRAMMAR SCHEME TERM THREE.pdf'))).toMatchObject({ term: 'Term 3', kind: 'Scheme of Work' });
  });
  it('keeps metadata independent of browsing-category selection', () => {
    const item = record('P.5 SCIENCE TERM 1.pdf');
    expect(documentContent(item)).toEqual(documentContent({ ...item }));
  });
});