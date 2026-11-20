import { memo, useCallback, useDeferredValue, useMemo, useState } from 'react';
import { DocumentGallery } from '@/components/document-gallery';
import { DocumentSearchInput } from '@/components/document-search-input';
import { legacySearch, type LegacyPageData } from '@/lib/legacy-pages';
import { createQueryStore, useQuery, type QueryStore } from '@/lib/query-store';
import type { ResourceRecord } from '@/lib/resources';
import repairs from '@/styles/legacy-repairs.css?raw';

// Only audited fixed list templates use this shell. Other legacy pages retain
// their existing renderer, including interactive class menus and special pages.
const infiniteTemplates = new Set(['0d1c944db2e6fae2', '3963a9155f37d82c', '9956681e548cd7ca', 'e4a5fda8c953e38e']);
const paginatedTemplates = new Set(['081119b0c7356c1b', '1f7a0e2e43bf90c3', '5f9619ab243e6e5b', '6cdd9b5824b18719', '8bc91c4262cbb080', '8efdd731ebecc4f9', 'd81c0590639bbb73', 'dd368ef47178e011']);

export function hasDirectDocumentLayout(data: Pick<LegacyPageData, 'mode' | 'template'>) {
  return (data.mode === 'infinite' && infiniteTemplates.has(data.template)) ||
    (data.mode === 'paginated' && paginatedTemplates.has(data.template));
}

function SearchIsland({ store, items }: { store: QueryStore; items: ResourceRecord[] }) {
  return <DocumentSearchInput id="searchInput" query={useQuery(store)} onChange={store.set} items={items} />;
}

const GalleryIsland = memo(function GalleryIsland({ store, data, onView }: { store: QueryStore; data: LegacyPageData; onView: (element: HTMLElement, item: ResourceRecord) => void }) {
  const query = useDeferredValue(useQuery(store));
  const items = useMemo(() => legacySearch(data.items, query), [data.items, query]);
  const clear = useCallback(() => store.set(''), [store]);
  return <DocumentGallery items={items} sourceItems={data.items} query={query} onQueryChange={store.set} onClear={clear} onView={onView} />;
});

export function LegacyDocumentPage({ data, fragments }: { data: LegacyPageData; fragments: Record<string, string> }) {
  const [store] = useState(() => createQueryStore());
  const [viewerError, setViewerError] = useState('');
  const onView = useCallback((element: HTMLElement, item: ResourceRecord) => {
    void (async () => {
      try {
        setViewerError('');
        const { openResourceViewer } = await import('@/lib/resource-viewer');
        await openResourceViewer(element, item, data.mode === 'infinite');
      } catch {
        void import('@/lib/viewer-loading').then(module => module.hideViewerLoading());
        setViewerError('The file viewer could not load. You can still download the file.');
      }
    })();
  }, [data.mode]);
  const cards = <>
    {data.missingData ? <p role="status">This page’s original file list is currently unavailable.</p> : <GalleryIsland store={store} data={data} onView={onView} />}
    {viewerError && <p role="alert">{viewerError}</p>}
  </>;
  const duplicateJump = data.template === '8bc91c4262cbb080' || data.template === 'd81c0590639bbb73';
  return <div className="legacy-page">
    <style>{fragments[data.styles]}</style><style>{repairs}</style>
    {data.mode === 'infinite' ? <><br />
      <div className="container"><br /><br />
        <div className="row"><div className="col-md-12 mb-3"><SearchIsland store={store} items={data.items} /></div></div>
        <div className="row" id="cardsContainer">{cards}</div>
        <div className="spinner"><div className="spinner-border text-primary" role="status"><span className="sr-only">Loading...</span></div></div>
      </div>
    </> : <div className="container mt-5">
      <div className="container mt-5"><br />
        <div className="search-bar"><SearchIsland store={store} items={data.items} /></div>
        <div className="row">{cards}</div>
        <div className="pagination-container" />
      </div>
      <div className="d-flex justify-content-center mt-3" />
      {duplicateJump && <div className="d-flex justify-content-center mt-3" />}
      <a className="floating-whatsapp" href="https://api.whatsapp.com/send?phone=+256750687790&text=Hi%20Fresh%20Teacher">
        <img alt="WhatsApp" src="/__l5e/assets-v1/eb9a5fbb-3e02-4743-8f69-12ddd0abe323/6dc8821e-whatsapp-us.png" width="50" />
      </a>
    </div>}
  </div>;
}