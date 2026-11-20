import { memo, useCallback, useMemo, useState } from 'react';
import { DocumentGallery } from '@/components/document-gallery';
import { filterResources, type ResourcePageData, type ResourceRecord } from '@/lib/resources';
import repairs from '@/styles/resource-repairs.css?raw';
import { DocumentSearchInput } from '@/components/document-search-input';
import { createQueryStore, useQuery, type QueryStore } from '@/lib/query-store';

// Islands: only these read the search text, so typing never rebuilds the page shell.
function SearchIsland({ store, id, items }: { store: QueryStore; id: string; items: ResourceRecord[] }) {
  return <DocumentSearchInput id={id} query={useQuery(store)} onChange={store.set} items={items} />;
}

const GalleryIsland = memo(function GalleryIsland({ store, items: all, onView }: { store: QueryStore; items: ResourceRecord[]; onView: (element: HTMLElement, item: ResourceRecord) => void }) {
  const query = useQuery(store);
  const items = useMemo(() => filterResources(all, query), [all, query]);
  const clear = useCallback(() => store.set(''), [store]);
  return <DocumentGallery items={items} sourceItems={all} query={query} onQueryChange={store.set} onClear={clear} onView={onView} />;
});

export function ResourcePage({ data }: { data: ResourcePageData }) {
  const [store] = useState(() => createQueryStore());
  const [viewerError, setViewerError] = useState('');
  const onView = useCallback((element: HTMLElement, item: ResourceRecord) => {
    void (async () => {
      try {
        setViewerError('');
        const { openResourceViewer } = await import('@/lib/resource-viewer');
        await openResourceViewer(element, item);
      } catch { void import('@/lib/viewer-loading').then(m => m.hideViewerLoading());
        setViewerError('The file viewer could not load. You can still download the file.');
      }
    })();
  }, []);
  return <div className="resource-page"><style>{data.styles}</style><style>{repairs}</style>
    <div className="container mt-5">
      <div className="container mt-5"><br />
        <div className="search-bar"><SearchIsland store={store} id="searchInput" items={data.items} /></div>
        <div className="row">
          <GalleryIsland store={store} items={data.items} onView={onView} />
          {viewerError && <p role="alert">{viewerError}</p>}
        </div>
        <div className="pagination-container" />
      </div>
      <div className="d-flex justify-content-center mt-3" />
    </div>
  </div>;
}
