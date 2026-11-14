import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { loadDocument } from '@/lib/document-catalog';
import { resourceTitle } from '@/lib/resources';
import { DocumentDetail } from '@/components/document-detail';
import { browsingContext } from '@/lib/document-browsing';
import { useRouteStylesheets } from '@/lib/route-stylesheets';
import { documentContent } from '@/lib/document-content';

const docStylesheets = ['bootstrap.min.css', 'font-awesome.css', 'flipbook.style.css'].map(file => `/resource-source/css/${file}`);

export const Route = createFileRoute('/doc/$slug')({
  staticData: { sitemap: false },
  validateSearch: browsingContext,
  loaderDeps: ({ search }) => ({ source: search.source }),
  loader: async ({ params, deps }) => {
    const data = await loadDocument(params.slug, deps.source);
    if (!data) throw notFound();
    if (data.slug !== params.slug) throw redirect({ to: '/doc/$slug', params: { slug: data.slug }, statusCode: 301 });
    return data;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${resourceTitle(loaderData.item)} | Fresh Teacher` : 'Document unavailable | Fresh Teacher';
    const content = loaderData ? documentContent(loaderData.item) : undefined;
    const description = content?.description ?? 'This document is unavailable.';
    const url = loaderData ? `/doc/${loaderData.slug}` : undefined;
    return {
      meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'article' }, { name: 'twitter:card', content: 'summary_large_image' }, ...(url ? [{ property: 'og:url', content: url }] : []), ...(!loaderData ? [{ name: 'robots', content: 'noindex' }] : [])],
      links: [...docStylesheets.map(href => ({ rel: 'stylesheet', href })), ...(url ? [{ rel: 'canonical', href: url }] : [])],
      scripts: loaderData && content ? [{ type: 'application/ld+json', children: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'LearningResource', name: content.title, description, url,
        learningResourceType: content.metadata.kind ?? 'Educational document',
        ...(content.metadata.subject ? { about: { '@type': 'Thing', name: content.metadata.subject } } : {}),
        ...(content.metadata.level ? { educationalLevel: content.metadata.level } : {}),
        associatedMedia: { '@type': 'MediaObject', contentUrl: loaderData.item.pdfUrl, ...(content.format ? { encodingFormat: content.format } : {}) },
      }) }] : [],
    };
  },
  component: DocumentRoute,
});
function DocumentRoute() { const data = Route.useLoaderData(); const context = Route.useSearch(); const ready = useRouteStylesheets(docStylesheets); return <div style={ready ? undefined : { visibility: 'hidden' }}><DocumentDetail key={`${data.slug}-${data.path}`} data={data} context={context} /></div>; }