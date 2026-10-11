import { describe, expect, it } from 'vitest';
import raw from '../../data/takanot.json';
import { DATA, SECTIONS } from './data.ts';
import { formatValue, withOp } from './format.ts';
import { crossCheck, DataSchema } from './schema.ts';

describe('data/takanot.json', () => {
  it('עובר את הסכמה ואת בדיקות ההצלבה', () => {
    expect(crossCheck(DataSchema.parse(raw))).toEqual([]);
  });
  it('61 סעיפים בתוכן העניינים, 28 עם תמצית', () => {
    expect(Object.keys(SECTIONS).length).toBe(61);
    expect(Object.keys(DATA.rules).length).toBe(28);
  });
  it('אימות בלי מקור נכשל', () => {
    const d = DataSchema.parse(raw);
    d.params.riser_max = { ...d.params.riser_max, verified: true, source: null };
    expect(crossCheck(d).join()).toContain('riser_max');
  });
});

describe('עיצוב ערכים', () => {
  it('ס״מ מתחת למטר', () => expect(formatValue({ value: 0.175, unit: 'm' })).toBe('17.5 ס״מ'));
  it('מטרים', () => expect(formatValue({ value: 2.5, unit: 'm' })).toBe('2.50 מ׳'));
  it('שטח', () => expect(formatValue({ value: 8, unit: 'm2' })).toBe('8 מ״ר'));
  it('יחס', () => expect(formatValue({ value: 0.1, unit: 'ratio' })).toBe('10%'));
  it('שיפוע', () => expect(formatValue({ value: 1 / 12, unit: 'slope' })).toBe('1:12'));
  it('אופרטור', () => expect(withOp({ value: 1.05, unit: 'm', op: '>=' })).toBe('≥ 1.05 מ׳'));
});
