import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentDownload, DocumentShare } from './document-actions';
import { DocumentGallery } from './document-gallery';
import { documentContent } from '@/lib/document-content';
import { DocumentInformation } from './document-information';
import { AdBanner } from './ad-banner';
import { filterResources, resourceTitle, type ResourceRecord } from '@/lib/resources';
import type { DocumentData } from '@/lib/document-catalog';
import { fileSize } from '@/lib/file-sizes';
import { DocumentViewer } from './document-viewer';
import { DocumentSearchInput } from './document-search-input';
import type { BrowsingContext } from '@/lib/document-browsing';

export function DocumentDetail({ data, context }: { data: DocumentData; context: BrowsingContext }) {
  const [query, setQuery] = useState(context.query ?? '');
  const [bytes, setBytes] = useState<number | null>(null);
  const [viewerError, setViewerError] = useState('');
  const content = documentContent(data.item);
  // An exam class ZIP lists the same files individually, so its page doubles as a folder browser.
  const isPackage = /\.zip$/i.test(data.item.pdfUrl) && data.path.startsWith('more/exams-');
  useEffect(() => { let cancelled = false; void fileSize(data.item.pdfUrl).then(value => { if (!cancelled) setBytes(value); }); return () => { cancelled = true; }; }, [data.item.pdfUrl]);
  const view = async (element: HTMLElement, item: ResourceRecord) => {
    try {
      setViewerError('');
      const { openResourceViewer } = await import('@/lib/resource-viewer');
      await openResourceViewer(element, item, false);
    } catch { void import('@/lib/viewer-loading').then(m => m.hideViewerLoading()); setViewerError('The file viewer could not load. You can still download the file.'); }
  };
  return <main className="document-detail"><Button asChild variant="source" size="source" className="document-back">{context.source === '/search' || context.source === 'search' ? <Link to="/search" search={{ query: context.query ?? '', page: context.page ?? 1, sort: context.sort === 'title-asc' || context.sort === 'title-desc' ? context.sort : 'source', type: context.type ?? 'all', layout: context.layout === 'list' ? 'list' : 'grid' }}><ArrowLeft size={18} />Back to search results</Link> : <Link {...(data.path.startsWith('more/') ? { to: '/more/$repo' as const, params: { repo: data.path.slice(5) } } : { to: '/$' as const, params: { _splat: data.path } })}><ArrowLeft size={18} />{data.category}</Link>}</Button>
    <section className="document-overview"><h1>{resourceTitle(data.item)}</h1>
      <div className="dg-card-actions"><DocumentDownload item={data.item} /><DocumentShare item={data.item} /><a className="document-original" href={data.item.pdfUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={18} aria-hidden="true" />Open original</a></div>
    </section>
    <AdBanner key={`${data.slug}-actions`} placement="document" identity={`${data.slug}-actions`} />
    {isPackage ? <p className="document-package-note">This ZIP contains all {data.related.length} files listed below. View or download any single file, or download the complete ZIP above.</p> : <DocumentViewer key={data.item.pdfUrl} item={data.item} />}
    <DocumentInformation content={content} bytes={bytes} />
    <AdBanner key={`${data.slug}-bottom`} placement="document" identity={`${data.slug}-bottom`} />
    {data.related.length > 0 && <section className="document-related"><h2>{isPackage ? 'Files in this package' : 'Related documents'}</h2><DocumentSearchInput query={query} onChange={setQuery} items={data.related} /><DocumentGallery ads={false} items={filterResources(data.related, query)} sourceItems={data.related} sourcePath={data.path} query={query} onQueryChange={setQuery} onClear={() => setQuery('')} initialContext={context} afterUrl={data.item.pdfUrl} onView={(element, item) => void view(element, item)} />{viewerError && <p role="alert">{viewerError}</p>}</section>}
  </main>;
}