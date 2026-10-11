// חיפוש סעיפים (SPEC.md, מסלול 3). הנרמול הבסיסי מ־hebrew.ts, ומעליו אותיות סופיות, מילים נרדפות וניקוד ציון.
import { normalize, stems } from './hebrew.ts';

const FINALS: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };

/** נרמול לחיפוש: hebrew.normalize, אותיות סופיות לרגילות, יי/וו כפולות ליחידות */
export function fold(s: string): string {
  return normalize(s)
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/יי/g, 'י')
    .replace(/וו/g, 'ו')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface Doc {
  ref: string;
  title: string;
  body: string;
  keywords: string[];
  partId: string;
  hasRule: boolean;
}

interface Indexed extends Doc {
  fTitle: string;
  fKw: string;
  fBody: string;
}

export interface Hit {
  doc: Doc;
  score: number;
  terms: string[];
}

const W_TITLE = 10;
const W_KW = 7;
const W_BODY = 4;
const W_VARIANT = 0.7;
const W_PHRASE = 15;
const REF_EXACT = 100;
const REF_PREFIX = 50;
export const MAX_HITS = 14;

export class Searcher {
  private docs: Indexed[];
  private synonyms: string[][];

  constructor(docs: Doc[], synonyms: string[][]) {
    this.docs = docs.map((d) => ({
      ...d,
      fTitle: fold(d.title),
      fKw: fold(d.keywords.join(' ')),
      fBody: fold(d.body),
    }));
    this.synonyms = synonyms.map((g) => g.map(fold));
  }

  /** הטוקן, הצורות שלו בלי תחיליות, וכל קבוצת מילים נרדפות שאחת מהן נמצאת בהן */
  variants(token: string): string[] {
    const own = stems(token);
    const out = [...own];
    for (const g of this.synonyms) {
      if (own.some((v) => g.includes(v))) for (const s of g) if (!out.includes(s)) out.push(s);
    }
    return out;
  }

  search(query: string): Hit[] {
    const raw = query.trim();
    if (!raw) return [];

    if (/^\d+(\.\d+)*\.?$/.test(raw)) {
      const p = raw.replace(/\.$/, '');
      return this.docs
        .filter((d) => d.ref === p || d.ref.startsWith(p + '.') || d.ref.startsWith(p))
        .map((d) => ({ doc: d, score: d.ref === p ? REF_EXACT : REF_PREFIX, terms: [] }))
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_HITS);
    }

    const tokens = fold(raw).split(' ').filter(Boolean);
    const phrase = fold(raw);
    const hits: Hit[] = [];
    for (const d of this.docs) {
      let score = 0;
      let all = true;
      for (const t of tokens) {
        let s = 0;
        this.variants(t).forEach((v, i) => {
          const w = i === 0 ? 1 : W_VARIANT;
          if (hasWord(d.fTitle, v)) s = Math.max(s, W_TITLE * w);
          else if (hasWord(d.fKw, v)) s = Math.max(s, W_KW * w);
          else if (hasWord(d.fBody, v)) s = Math.max(s, W_BODY * w);
        });
        if (!s) all = false;
        score += s;
      }
      if (tokens.length > 1 && d.fTitle.includes(phrase)) score += W_PHRASE;
      if (all && score) hits.push({ doc: d, score: score + (d.hasRule ? 1 : 0), terms: tokens });
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, MAX_HITS);
  }

  /** האם מילה מהטקסט מתאימה לאחד המונחים (לסימון בממשק) */
  matchesWord(word: string, terms: string[]): boolean {
    const w = fold(word);
    if (!w) return false;
    return terms.some((t) =>
      this.variants(t).some((v) => !v.includes(' ') && v.length > 1 && stems(w).some((s) => s.startsWith(v))),
    );
  }
}

/** הביטוי מופיע בתחילת מילה (או אחרי תחיליות) בטקסט. ביטוי של כמה מילים: הכלה פשוטה */
function hasWord(hay: string, v: string): boolean {
  if (!v) return false;
  if (v.includes(' ')) return hay.includes(v);
  return hay.split(' ').some((w) => stems(w).some((s) => s.startsWith(v)));
}
