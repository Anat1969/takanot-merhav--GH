import raw from '../../data/takanot.json';
import { crossCheck, DataSchema, type Data } from './schema.ts';

function load(): Data {
  const d = DataSchema.parse(raw);
  const errors = crossCheck(d);
  if (errors.length) throw new Error('data/takanot.json לא תקין:\n' + errors.join('\n'));
  return d;
}

export const DATA: Data = load();

export interface Section {
  ref: string;
  title: string;
  partId: string;
  partTitle: string;
}

/** כל הסעיפים בתוכן העניינים, לפי מספר */
export const SECTIONS: Record<string, Section> = {};
for (const p of DATA.parts) {
  for (const g of p.groups) {
    for (const s of g.sections) SECTIONS[s.ref] = { ref: s.ref, title: s.title, partId: p.id, partTitle: p.title };
  }
}

export const DEFAULT_REF = '3.2.2.5';

export function sceneOf(ref: string): string | null {
  return DATA.rules[ref]?.scene ?? null;
}

/** הפרמטרים שמופיעים בסצנה, לפי סדר הסעיפים שלה */
export function paramsOfScene(sceneId: string): string[] {
  const rules = DATA.scenes[sceneId]?.rules ?? [];
  return Object.keys(DATA.params).filter((k) => rules.includes(DATA.params[k].rule));
}
