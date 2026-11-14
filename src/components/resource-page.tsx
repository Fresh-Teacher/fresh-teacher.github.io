import { useMemo, useState } from 'react';
import parse, { Element, type HTMLReactParserOptions } from 'html-react-parser';
import { DocumentGallery } from '@/components/document-gallery';
import { filterResources, type ResourcePageData, type ResourceRecord } from '@/lib/resources';
import shell from '@/data/resource-shell.html?raw';
import media from '@/data/resource-media.json';
import repairs from '@/styles/resource-repairs.css?raw';
import { DocumentSearchInput } from '@/components/document-search-input';

export function ResourcePage({ data }: { data: ResourcePageData }) {
  const [query, setQuery] = useState('');
  const [viewerError, setViewerError] = useState('');
  const items = useMemo(() => filterResources(data.items, query), [data.items, query]);
  const view = async (element: HTMLElement, item: ResourceRecord) => {
    try {
      setViewerError('');
      const { openResourceViewer } = await import('@/lib/resource-viewer');
      await openResourceViewer(element, item);
    } catch { void import('@/lib/viewer-loading').then(m => m.hideViewerLoading());
      setViewerError('The file viewer could not load. You can still download the file.');
    }
  };
  const options: HTMLReactParserOptions = { replace(node) {
    if (!(node instanceof Element)) return;
    if (node.name === 'nav') return <></>;
    if (node.name === 'footer' || (node.attribs['class'] ?? '').split(' ').includes('footer')) return <></>;
    // The shared WhatsApp chat (LibraryShell) replaces the shell's plain floating link.
    if ((node.attribs['class'] ?? '').includes('floating-whatsapp')) return <></>;
    const id = node.attribs['id'];
    if (node.name === 'div' && node.children.some(child => child instanceof Element && child.attribs['id'] === 'jumpToPage')) return <></>;
    if (node.name === 'img') {
      const src = node.attribs['src'];
      const asset = media[src as keyof typeof media];
      if (asset) return <img {...node.attribs} src={asset} />;
    }
    if (id === 'searchInput') return <DocumentSearchInput id={id} query={query} onChange={setQuery} items={data.items} />;
    if (node.attribs['class'] === 'row') return <div className="row">
      <DocumentGallery items={items} sourceItems={data.items} query={query} onQueryChange={setQuery} onClear={() => setQuery('')} onView={(element, item) => void view(element, item)} />
      {viewerError && <p role="alert">{viewerError}</p>}
    </div>;
    if (id === 'previousPageBtn' || id === 'nextPageBtn' || id === 'pageNumbers' || id === 'jumpToPage' || id === 'jumpButton') return <></>;
    return undefined;
  } };
  return <div className="resource-page"><style>{data.styles}</style><style>{repairs}</style>{parse(shell, options)}</div>;
}