import MiniSearch from 'minisearch';
import type { ResourceRecord } from './resources';

const aliases: Record<string, string> = {
  maths: 'mathematics', math: 'mathematics', mtc: 'mathematics', sci: 'science', scie: 'science', sciense: 'science',
  sst: 'socialstudies', eng: 'english', agric: 'agriculture', ent: 'entrepreneurship',
  cre: 'religiouseducation', ire: 'religiouseducation', re: 'religiouseducation',
  lit: 'literacy', litracy: 'literacy', schemes: 'scheme', exams: 'examination', exam: 'examination',
  eot: 'endofterm', bot: 'beginningofterm', mot: 'midterm',
};
const numbers = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];
export function searchTokens(value: string): string[] {
  let text = value.toLowerCase().replace(/%20/g, ' ').replace(/[_-]/g, ' ');
  text = text.replace(/\bm\W*t\W*c\b/g, 'mathematics').replace(/\bs\W*s\W*t\b/g, 'socialstudies');
  text = text.replace(/\b(christian|islamic)?\s*religious\s+education\b/g, 'religiouseducation').replace(/\bsocial\s+studies\b/g, 'socialstudies').replace(/\bend\s+of\s+term\b/g, 'endofterm')
    .replace(/\bbeginning\s+of\s+term\b/g, 'beginningofterm').replace(/\bmid\s+term\b/g, 'midterm')
    .replace(/\bschemes?\s+of\s+work\b/g, 'scheme');
  numbers.forEach((word, index) => {
    text = text.replace(new RegExp(`\\b(primary|senior)\\s+(${word}|${index + 1})\\b`, 'g'), (_, level: string) => `${level === 'primary' ? 'p' : 's'}${index + 1}`);
  });
  text = text.replace(/\b([ps])[\s.]*([1-7])\b/g, '$1$2');
  text = text.replace(/\bterm\s+(iii|ii|i)\b/g, (_, roman: string) => `term ${{ i: '1', ii: '2', iii: '3' }[roman]}`);
  return (text.match(/[a-z0-9]+/g) ?? []).map(token => aliases[token] ?? token);
}

const cache = new WeakMap<ResourceRecord[], MiniSearch>();
const stopWords = new Set(['pdf', 'the', 'a', 'of', 'and', 'for', 'in', 'with']);
export function libraryQueryTokens(query: string) {
  return searchTokens(query).filter(term => !stopWords.has(term));
}
export function searchDocuments(items: ResourceRecord[], query: string, includeDescription = true) {
  if (!query.trim()) return items;
  let index = includeDescription ? cache.get(items) : undefined;
  if (!index) {
    index = new MiniSearch({ fields: ['title', 'description'], tokenize: searchTokens, processTerm: term => term });
    index.addAll(items.map((item, id) => ({ id, title: `${item.title ?? ''} ${item.pdfUrl.split('/').pop() ?? ''}`, description: includeDescription ? item.description : '' })));
    if (includeDescription) cache.set(items, index);
  }
  const normalized = libraryQueryTokens(query).join(' ');
  if (!normalized) return items;
  const matches = index.search(normalized, { combineWith: 'AND', prefix: term => term.length >= 3 && !/^\d+$/.test(term), fuzzy: term => term.length >= 5 && !/\d/.test(term) ? 0.15 : false, boost: { title: 2 } });
  return matches.map(match => items[Number(match.id)]).filter((item): item is ResourceRecord => Boolean(item));
}

export function suggestedSearch(items: ResourceRecord[], query: string) {
  let index = cache.get(items);
  if (!index) { searchDocuments(items, query || 'mathematics'); index = cache.get(items); }
  return index?.autoSuggest(query, { fuzzy: 0.25, prefix: true }).slice(0, 3).map(result => result.suggestion) ?? [];
}