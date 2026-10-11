// נרמול ופירוק לתחיליות לחיפוש בעברית (SPEC.md, "חיפוש")

const NIQQUD = /[֑-ׇ]/g;
// גרש וגרשיים בכל צורותיהם נמחקים: ס"מ = סמ, מה"ע = מהע
const QUOTES = /["'׳״‘’“”`]/g;
// מקף עברי, מקפים ולוכסן מפרידים בין מילים
const SEPARATORS = /[־‐-―\-/]/g;

const PREFIX_LETTERS = new Set(['ו', 'ה', 'ב', 'ל', 'מ', 'ש', 'כ']);
const MIN_STEM = 3;
const MAX_PREFIX = 3;

export function normalize(input: string): string {
  return input
    .normalize('NFC')
    // המקף העברי נמצא בטווח הניקוד, ולכן מוחלף ברווח לפני מחיקת הניקוד
    .replace(SEPARATORS, ' ')
    .replace(NIQQUD, '')
    .replace(QUOTES, '')
    .toLowerCase();
}

/** מילים אחרי נרמול. מספרים נשמרים כמילים ("1.8", "2.7.1"). */
export function tokenize(input: string): string[] {
  return normalize(input)
    .split(/[^\p{L}\p{N}.]+/u)
    .map((t) => t.replace(/^\.+|\.+$/g, ''))
    .filter(Boolean);
}

/**
 * המילה וכל הצורות שלה בלי תחיליות (ו, ה, ב, ל, מ, ש, כ ושילובים),
 * כל עוד נשארות לפחות שלוש אותיות. "והגדרות" ← והגדרות, הגדרות, גדרות.
 */
export function stems(word: string): string[] {
  const out = [word];
  let rest = word;
  for (let i = 0; i < MAX_PREFIX; i++) {
    if (!PREFIX_LETTERS.has(rest[0]) || rest.length - 1 < MIN_STEM) break;
    rest = rest.slice(1);
    out.push(rest);
  }
  return out;
}
