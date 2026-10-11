import { describe, expect, it } from 'vitest';
import { buildSearcher } from '../ui/searchDocs.ts';
import { fold } from './index.ts';

const s = buildSearcher();
const refs = (q: string) => s.search(q).map((h) => h.doc.ref);

describe('fold', () => {
  it('אותיות סופיות לרגילות', () => expect(fold('סעיף')).toBe('סעיפ'));
  it('יי ווו כפולות', () => expect(fold('בניין')).toBe(fold('בנין')));
});

describe('חיפוש סעיפים', () => {
  it('מספר סעיף מדויק ראשון', () => expect(refs('3.2.2.5')[0]).toBe('3.2.2.5'));
  it('תחילית מספר מחזירה את כל הפרק', () => {
    const r = refs('3.2.2');
    expect(r).toContain('3.2.2.5');
    expect(r).toContain('3.2.2.14');
  });
  it('מילה בכותרת', () => expect(refs('מעקה')).toContain('3.2.2.14'));
  it('תחילית: במדרגות', () => expect(refs('במדרגות').length).toBeGreaterThan(0));
  it('מילה נרדפת: מסעד מוצא מעקה', () => expect(refs('מסעד')).toContain('3.2.2.14'));
  it('מילה נרדפת: זיזית מוצאת בליטות', () => expect(refs('זיזית')).toContain('4.03'));
  it('בניין ובנין מוצאים אותו דבר', () => expect(refs('בניין')).toEqual(refs('בנין')));
  it('ביטוי: מרחק הליכה', () => expect(refs('מרחק הליכה')[0]).toMatch(/^3\.(2\.15|8\.18)/));
  it('אין תוצאות למילה זרה', () => expect(refs('קשקשת')).toEqual([]));
  it('לכל היותר 14 תוצאות', () => expect(refs('ה').length).toBeLessThanOrEqual(14));
  it('סימון מילה בטקסט', () => expect(s.matchesWord('המעקה', ['מעקה'])).toBe(true));
});
