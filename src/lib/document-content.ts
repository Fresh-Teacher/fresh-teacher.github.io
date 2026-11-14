import { documentMetadata } from './document-metadata';
import { documentExtension } from './document-formats';
import { resourceTitle, type ResourceRecord } from './resources';

const uses: Record<string, string> = {
  Mock: 'Mock papers can support practice before an examination and help identify topics for further revision.',
  PLE: 'PLE resources can support examination preparation and revision.',
  'Scheme of Work': 'Schemes of work can support the organisation of teaching activities across a term.',
  'End of Term': 'End-of-term resources can support revision and review of learning at the end of a term.',
  'Mid Term': 'Mid-term resources can support practice and review during a term.',
  'Beginning of Term': 'Beginning-of-term resources can support practice and review at the start of a term.',
  'Holiday Package': 'Holiday packages can support continued study and practice during school breaks.',
  'Lesson Notes': 'Lesson notes can support lesson preparation, independent study and revision.',
  Revision: 'Revision resources can support practice and review of previously studied topics.',
};

export function documentContent(item: ResourceRecord) {
  const title = resourceTitle(item);
  const metadata = documentMetadata(item);
  const format = documentExtension(item.pdfUrl).toUpperCase();
  const classes = metadata.level?.split(', ').map(level => level.replace(/^P(\d)$/, 'Primary $1').replace(/^S(\d)$/, 'Senior $1')).join(' and ');
  const details = [
    metadata.subject && `Subject: ${metadata.subject}.`,
    classes && `Class: ${classes}.`,
    metadata.term && `${metadata.term}.`,
    metadata.year && `Year: ${metadata.year}.`,
  ].filter(Boolean).join(' ');
  const overview = `${title} is ${format ? `a ${format}` : 'an educational'} resource in Fresh Teacher’s Library.${details ? ` ${details}` : ''}`;
  const use = metadata.kind ? uses[metadata.kind] : undefined;
  const paragraphs = [overview, ...(use ? [use] : [])];
  const facts = [
    { label: 'Subject', value: metadata.subject },
    { label: 'Class', value: classes },
    { label: 'Year', value: metadata.year },
    { label: 'Term', value: metadata.term },
    { label: 'Resource type', value: metadata.kind },
    { label: 'File format', value: format || undefined },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));
  const questions = [
    classes ? { question: 'Which class is this resource for?', answer: `The catalog identifies this resource with ${classes}.` } : undefined,
    metadata.subject ? { question: 'Which subject does it cover?', answer: `The title or catalog identifies the subject as ${metadata.subject}.` } : undefined,
    metadata.term || metadata.year ? { question: 'Which term or year is listed?', answer: [metadata.term, metadata.year].filter(Boolean).join(' · ') + '.' } : undefined,
  ].filter((question): question is { question: string; answer: string } => Boolean(question));
  return { title, metadata, format, paragraphs, facts, questions, description: overview };
}