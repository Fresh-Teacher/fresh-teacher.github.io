import { DocumentsSkeleton } from '@/components/documents-skeleton';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { LegacyPage } from '@/components/legacy-page';
import legacyManifest from '@/data/legacy/manifest.json';
import type { LegacyPageData } from '@/lib/legacy-pages';
import type { StaticPage } from '@/lib/static-catalog';
import { useRouteStylesheets, warmRouteStylesheets } from '@/lib/route-stylesheets';
import { findMoreDocumentsRepo } from '@/data/more-documents';
import { loadRepositoryDocuments } from '@/lib/repository-catalog';

// Reuse the shared document-listing layout so repository pages look like every other document page.
const TEMPLATE_PAGE = 'PrimaryFiveMTCPastPapers.html';
const legacyPages = import.meta.glob<{ default: StaticPage<LegacyPageData> }>('../data/catalog/pages/legacy/*.json');
const fragmentFiles = import.meta.glob<{ default: string }>('../data/legacy/fragments/*.json');

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
    const [items] = await Promise.all([
      loadRepositoryDocuments(entry.repo),
      read(base.template),
      read(base.styles),
      warmRouteStylesheets(base.links),
    ]);
    const title = `${entry.label} | Fresh Teacher`;
    const data: LegacyPageData = { ...base, title, description: `${entry.label} from Fresh Teacher's Library.`, items, missingData: null };
    return { repo: entry.repo, data, fragments };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.data.title ?? 'More Documents | Fresh Teacher';
    const description = loaderData?.data.description ?? "More documents from Fresh Teacher's Library.";
    return {
      meta: [
        { title }, { name: 'description', content: description },
        { property: 'og:title', content: title }, { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
      ],
      links: (loaderData?.data.links ?? []).map(href => ({ rel: 'stylesheet', href })),
    };
  },
  staleTime: Infinity,
  preloadStaleTime: Infinity,
  pendingComponent: DocumentsSkeleton,
  component: MoreDocumentsPage,
});

function MoreDocumentsPage() {
  const result = Route.useLoaderData();
  const ready = useRouteStylesheets(result.data.links);
  return (
    <>
      {!ready && <div className="documents-skeleton-overlay"><DocumentsSkeleton /></div>}
      <div className={ready ? 'route-fade route-fade--in' : 'route-fade'}>
        <LegacyPage key={result.repo} data={result.data} fragments={result.fragments} />
      </div>
    </>
  );
}
