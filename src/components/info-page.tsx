import { Link } from '@tanstack/react-router';
import styles from '@/styles/site-footer.css?raw';

export type InfoSection = { heading: string; body?: string[]; list?: string[]; after?: string[] };

export function infoHead(title: string, description: string) {
  const full = `${title} | Fresh Teacher's Library`;
  return { meta: [
    { title: full }, { name: 'description', content: description },
    { property: 'og:title', content: full }, { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] };
}

export function InfoPage({ title, sections }: { title: string; sections: InfoSection[] }) {
  return <article className="info-page">
    <style>{styles}</style>
    <Link to="/" className="info-page__back">← Back to Library</Link>
    <h1>{title}</h1>
    {sections.map(s => <section key={s.heading}>
      <h2>{s.heading}</h2>
      {s.body?.map(p => <p key={p}>{p}</p>)}
      {s.list && <ul>{s.list.map(i => <li key={i}>{i}</li>)}</ul>}
      {s.after?.map(p => <p key={p}>{p}</p>)}
    </section>)}
  </article>;
}
