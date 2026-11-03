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

/**
 * הסצנה הבאה באותו חלק, לפי סדר תוכן העניינים, והסעיף הראשון שלה. null בסוף החלק.
 * כך הסיור עובר על חלק שלם של התוספת ולא רק על סצנה אחת.
 */
export function nextSceneInPart(ref: string): { sceneId: string; ref: string } | null {
  const here = SECTIONS[ref];
  const scene = DATA.rules[ref]?.scene;
  if (!here || !scene) return null;
  const part = DATA.parts.find((p) => p.id === here.partId);
  if (!part) return null;
  const order: { sceneId: string; ref: string }[] = [];
  for (const g of part.groups) {
    for (const s of g.sections) {
      const sc = DATA.rules[s.ref]?.scene;
      if (sc && !order.some((o) => o.sceneId === sc)) order.push({ sceneId: sc, ref: s.ref });
    }
  }
  const i = order.findIndex((o) => o.sceneId === scene);
  return i >= 0 && i < order.length - 1 ? order[i + 1] : null;
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
