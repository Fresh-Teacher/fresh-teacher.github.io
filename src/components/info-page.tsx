import { Link } from '@tanstack/react-router';
import styles from '@/styles/site-footer.css?raw';
import { pageMeta } from '@/lib/site';

export type InfoSection = { heading: string; body?: string[]; list?: string[]; after?: string[] };

export function infoHead(path: string, title: string, description: string) {
  return pageMeta({ path, title: `${title} | Fresh Teacher's Library`, description });
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
