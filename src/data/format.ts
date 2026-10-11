// עיצוב ערכים לתצוגה (DATA-MODEL.md, "עיצוב ערך לתצוגה")
import type { Param } from './schema.ts';

const NBSP = ' ';

export function formatValue(p: Pick<Param, 'value' | 'unit'>): string {
  const v = p.value;
  switch (p.unit) {
    case 'm': {
      if (v < 1) {
        const cm = Math.round(v * 1000) / 10;
        return (Number.isInteger(cm) ? cm.toFixed(0) : cm.toFixed(1)) + NBSP + 'ס״מ';
      }
      return v.toFixed(2) + NBSP + 'מ׳';
    }
    case 'm2':
      return v + NBSP + 'מ״ר';
    case 'ratio':
      return Math.round(v * 100) + '%';
    case 'slope':
      return '1:' + Math.round(1 / v);
    default:
      return String(v);
  }
}

export function opSign(op: Param['op']): string {
  return op === '>=' ? '≥' : op === '<=' ? '≤' : op;
}

export function isLimit(op: Param['op']): boolean {
  return op !== '=';
}

export function meters(v: number, digits = 2): string {
  return v.toFixed(digits) + NBSP + 'מ׳';
}

export function sqm(v: number): string {
  return v.toFixed(2) + NBSP + 'מ״ר';
}

/** "≤ 17.5 ס״מ" */
export function withOp(p: Pick<Param, 'value' | 'unit' | 'op'>): string {
  return opSign(p.op) + ' ' + formatValue(p);
}
