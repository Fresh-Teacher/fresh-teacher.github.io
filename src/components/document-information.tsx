import type { documentContent } from '@/lib/document-content';
import { formatSize } from '@/lib/file-sizes';

export function DocumentInformation({ content, bytes }: { content: ReturnType<typeof documentContent>; bytes: number | null }) {
  const facts = [
    { label: 'Document Name', value: content.title },
    { label: 'Resource Type', value: content.metadata.kind },
    { label: 'Size', value: bytes != null ? formatSize(bytes) : undefined },
    { label: 'File Format', value: content.format || undefined },
    { label: 'Subject', value: content.metadata.subject },
    { label: 'Class level', value: content.facts.find(fact => fact.label === 'Class')?.value },
    { label: 'Year', value: content.metadata.year },
    { label: 'Term', value: content.metadata.term },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));
  return <section className="document-information" aria-labelledby="document-information-title">
    <h2 className="document-information-title" id="document-information-title">About this document</h2>
    <dl className="document-facts" aria-label="Document details">
      {facts.map(({ label, value }) => <div key={label}><dt>{label}:</dt><dd>{value}</dd></div>)}
    </dl>
  </section>;
}
