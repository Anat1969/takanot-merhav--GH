import { describe, expect, it } from 'vitest';
import { normalize, stems, tokenize } from './hebrew.ts';

describe('normalize', () => {
  it('מוחק ניקוד', () => expect(normalize('גָּדֵר')).toBe('גדר'));
  it('מוחק גרשיים וגרש בכל הצורות', () => {
    expect(normalize('ס"מ')).toBe('סמ');
    expect(normalize('ס״מ')).toBe('סמ');
    expect(normalize("מ'")).toBe('מ');
    expect(normalize('מ׳')).toBe('מ');
  });
  it('מקף עברי ומקף רגיל מפרידים', () => {
    expect(tokenize('תת־קרקעי')).toEqual(['תת', 'קרקעי']);
    expect(tokenize('תת-קרקעי')).toEqual(['תת', 'קרקעי']);
  });
  it('שומר מספרי סעיפים ומידות', () => {
    expect(tokenize('סעיף 2.7.1, גובה 1.8 מ\'.')).toEqual(['סעיף', '2.7.1', 'גובה', '1.8', 'מ']);
  });
});

describe('stems', () => {
  it('מסיר תחיליות ושילובים', () => {
    expect(stems('והגדרות')).toEqual(['והגדרות', 'הגדרות', 'גדרות']);
    expect(stems('שבמגרש')).toContain('מגרש');
  });
  it('לא מסיר כשנשארות פחות משלוש אותיות', () => {
    expect(stems('הגג')).toEqual(['הגג']);
    expect(stems('בית')).toEqual(['בית']);
  });
  it('מילה בלי תחילית נשארת כמות שהיא', () => expect(stems('גדר')).toEqual(['גדר']));
});
