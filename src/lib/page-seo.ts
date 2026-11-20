/**
 * Search-result titles and descriptions for catalog pages.
 * The imported pages carry vague titles ("menu p3", "p3") and one shared boilerplate
 * description; Google uses these as sitelink labels, so they are replaced here at head() time
 * without touching what the page shows.
 */
import { classOf } from '@/lib/site';

const SITE = 'Fresh Teacher';
const BOILERPLATE = /^Welcome To Fresh Teacher's Library/i;
// Auto-written one-liners such as "Browse X from Fresh Teacher’s e-Library." add nothing a title doesn't say.
const GENERIC = /^(Browse .+ (from|in) Fresh Teacher[’']s e-Library|.+ from Fresh Teacher[’']s Library)\.$/;

export const CLASS_NAMES: Record<string, string> = {
  baby: 'Baby Class', middle: 'Middle Class', top: 'Top Class',
  p1: 'Primary One (P1)', p2: 'Primary Two (P2)', p3: 'Primary Three (P3)', p4: 'Primary Four (P4)',
  p5: 'Primary Five (P5)', p6: 'Primary Six (P6)', p7: 'Primary Seven (P7)',
  s1: 'Senior One (S1)', s2: 'Senior Two (S2)', s3: 'Senior Three (S3)',
  s4: 'Senior Four (S4)', s5: 'Senior Five (S5)', s6: 'Senior Six (S6)',
};

const FIXED: Record<string, { title: string; description: string }> = {
  'index2.html': {
    title: `Choose Your Class | ${SITE} e-Library`,
    description: `Pick a class from Baby Class to Senior Six to browse free lesson notes, past papers and schemes of work on ${SITE}'s e-Library.`,
  },
  'movie.html': {
    title: `Movies & Series | ${SITE}`,
    description: `Choose feature films or series movies to watch on ${SITE}'s e-Library.`,
  },
  'terms.html': {
    title: `Terms of Service | ${SITE}`,
    description: `Read the terms of service for using ${SITE}'s e-Library and its learning resources.`,
  },
  // The source page is mislabelled "Middle Class Schemes Of Work" but lists Primary Five past papers.
  'PrimaryFiveClassPastPapers.html': {
    title: `Primary Five Class Past Papers | ${SITE}`,
    description: `Download free Primary Five (P5) past papers for Ugandan schools from ${SITE}'s e-Library.`,
  },
};

// Some source titles run an acronym into the next word ("MTCPast Papers"); split them.
const spaced = (title: string) => title.replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1 $2').replace(/Schemesof\b/g, 'Schemes of')
  .replace(/\bLit(\d)L?\s*/g, 'Literacy $1 ').replace(/(\d)([A-Z][a-z])/g, '$1 $2');
const withSite = (title: string) => (title.includes(SITE) ? spaced(title) : `${spaced(title)} | ${SITE}`);
const bareName = (title: string) => spaced(title.replace(/\s*\|\s*Fresh Teacher.*$/i, '').trim());
const joinList = (parts: string[]) => parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;

/** Class key for a class page ("p3.html", "p.6.html") or class menu page ("menu p3.html"). */
function classPage(path: string): { key: string; menu: boolean } | undefined {
  const match = /^(menu )?(baby|middle|top|[ps]\.?\d)\.html$/i.exec(path);
  if (!match?.[2]) return undefined;
  const key = match[2].toLowerCase().replace('.', '');
  return CLASS_NAMES[key] ? { key, menu: Boolean(match[1]) } : undefined;
}

export type PageSeoInput = {
  /** Page path without the leading slash, e.g. "menu p3.html". */
  path: string;
  title: string;
  description?: string | undefined;
  /** Number of documents listed on the page. */
  count?: number | undefined;
  /** Section labels of a class page, e.g. ["EXAMINATIONS", "LESSON NOTES"]. */
  sections?: string[] | undefined;
};

export function pageSeo({ path, title, description, count, sections }: PageSeoInput): { title: string; description: string; canonical?: string } {
  const fixed = FIXED[path];
  if (fixed) return fixed;

  const cls = classPage(path);
  if (cls) {
    const name = CLASS_NAMES[cls.key];
    if (cls.menu) return {
      title: `${name} Resources: Notes, Exams & Videos | ${SITE}`,
      description: `Choose ${name} lesson notes, examination papers, schemes of work or videos from ${SITE}'s free e-Library for Ugandan schools.`,
    };
    const list = (sections ?? []).filter(label => !/more/i.test(label)).map(label => label.toLowerCase());
    // "p.6.html" repeats "p6.html"; point search engines at the main copy.
    const main = `${cls.key}.html`;
    return {
      ...(main !== path ? { canonical: `/${main}` } : {}),
      title: `${name} Notes & Past Papers | ${SITE}`,
      description: `Free ${name} ${list.length ? joinList(list) : 'lesson notes, past papers and schemes of work'} for Ugandan schools, all in one place on ${SITE}'s e-Library.`,
    };
  }

  const name = bareName(title);
  const vague = !description || BOILERPLATE.test(description) || GENERIC.test(description);
  if (!vague) return { title: withSite(title), description };
  return {
    title: withSite(title),
    description: count
      ? `Download ${count} free ${name} for Ugandan schools from ${SITE}'s e-Library.`
      : `Browse free ${name} for Ugandan schools on ${SITE}'s e-Library.`,
  };
}

/** Home → class → page trail for search-result breadcrumbs. */
export function pageTrail(path: string, title: string) {
  const name = title.replace(/\s*\|\s*Fresh Teacher.*$/i, '');
  const key = classOf(path);
  if (!key || !CLASS_NAMES[key]) return [{ name, path: `/${path}` }];
  const hub = `${key}.html`;
  const classCrumb = { name: CLASS_NAMES[key], path: `/${hub}` };
  return path === hub ? [classCrumb] : [classCrumb, { name, path: `/${path}` }];
}
