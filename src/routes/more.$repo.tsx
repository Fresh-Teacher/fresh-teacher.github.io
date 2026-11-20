import { remoteGlob } from '@/lib/remote-catalog';
import { DocumentsSkeleton } from '@/components/documents-skeleton';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { LegacyDocumentPage, hasDirectDocumentLayout } from '@/components/legacy-document-page';
import { lazy, Suspense } from 'react';
import legacyManifest from '@/data/legacy/manifest.json';
import type { LegacyPageData } from '@/lib/legacy-pages';
import type { StaticPage } from '@/lib/static-catalog';
import { useRouteStylesheets, warmRouteStylesheets } from '@/lib/route-stylesheets';
import { findMoreDocumentsRepo } from '@/data/more-documents';
import { loadRepositoryDocuments } from '@/lib/repository-catalog';
import { pageSeo } from '@/lib/page-seo';
import { pageMeta } from '@/lib/site';

// Reuse the shared document-listing layout so repository pages look like every other document page.
const TEMPLATE_PAGE = 'PrimaryFiveMTCPastPapers.html';
const legacyPages = remoteGlob<StaticPage<LegacyPageData>>('../data/catalog/pages/legacy/');
const fragmentFiles = import.meta.glob<{ default: string }>('../data/legacy/fragments/*.json');
const LegacyPage = lazy(() => import('@/components/legacy-page').then(module => ({ default: module.LegacyPage })));

export const Route = createFileRoute('/more/$repo')({
  staticData: { sitemap: false },
  ssr: false,
  loader: async ({ params }) => {
    const entry = findMoreDocumentsRepo(params.repo);
    if (!entry) throw notFound();
    const legacy = legacyManifest[TEMPLATE_PAGE as keyof typeof legacyManifest];
    const load = legacyPages[`../data/catalog/pages/legacy/${legacy.data}`];
    if (!load) throw notFound();
    const { documentIds: _ids, ...base } = (await load()).default;
    const fragments: Record<string, string> = {};
    const read = async (key: string): Promise<void> => {
      if (key in fragments) return;
      const get = fragmentFiles[`../data/legacy/fragments/${key}.json`];
      if (!get) return;
      const text = (await get()).default;
      fragments[key] = text;
      await Promise.all(Array.from(text.matchAll(/data-key="([^"]+)"/g), match => read(match[1] ?? '')));
    };
    void warmRouteStylesheets(base.links);
    const [items] = await Promise.all([
      loadRepositoryDocuments(entry.repo),
      read(base.template),
      read(base.styles),
    ]);
    const title = `${entry.label} | Fresh Teacher`;
    const data: LegacyPageData = { ...base, title, description: `${entry.label} from Fresh Teacher's Library.`, items, missingData: null };
    return { repo: entry.repo, data, fragments };
  },
  head: ({ loaderData }) => {
    const { title, description } = loaderData
      ? pageSeo({ path: `more/${loaderData.repo}`, title: loaderData.data.title, description: loaderData.data.description, count: loaderData.data.items.length })
      : { title: 'More Documents | Fresh Teacher', description: "More documents from Fresh Teacher's Library." };
    const page = pageMeta({ path: loaderData ? `/more/${loaderData.repo}` : '/more', title, description, canonical: loaderData ? undefined : false });
    return {
      meta: page.meta,
      links: [...page.links, ...(loaderData?.data.links ?? []).map(href => ({ rel: 'stylesheet', href }))],
    };
  },
  staleTime: Infinity,
  preloadStaleTime: Infinity,
  pendingComponent: DocumentsSkeleton,
  component: MoreDocumentsPage,
});

function MoreDocumentsPage() {
  const result = Route.useLoaderData();
  useRouteStylesheets(result.data.links);
  return (
    <>
      <div className="route-fade route-fade--in">
        <Suspense fallback={<DocumentsSkeleton />}>
          {hasDirectDocumentLayout(result.data)
            ? <LegacyDocumentPage key={result.repo} data={result.data} fragments={result.fragments} />
            : <LegacyPage key={result.repo} data={result.data} fragments={result.fragments} />}
        </Suspense>
      </div>
    </>
  );
}
