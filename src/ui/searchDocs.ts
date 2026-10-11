import { DATA, SECTIONS } from '../data/data.ts';
import { formatValue } from '../data/format.ts';
import { Searcher, type Doc } from '../search/index.ts';

/** גוף סעיף כטקסט פשוט: {param} מוחלף בערך המעוצב */
export function plainBody(ref: string): string {
  const r = DATA.rules[ref];
  if (!r) return '';
  return r.body.join(' ').replace(/\{(\w+)\}/g, (_, k: string) => formatValue(DATA.params[k]));
}

export function buildSearcher(): Searcher {
  const docs: Doc[] = Object.values(SECTIONS).map((s) => ({
    ref: s.ref,
    title: s.title,
    body: plainBody(s.ref),
    keywords: DATA.rules[s.ref]?.keywords ?? [],
    partId: s.partId,
    hasRule: !!DATA.rules[s.ref],
  }));
  return new Searcher(docs, DATA.synonyms);
}
