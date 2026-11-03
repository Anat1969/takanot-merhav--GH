import { useEffect, useRef } from 'react';
import { DATA } from '../data/data.ts';
import { withOp } from '../data/format.ts';

/*
 * פס צעדים: "ספר שמתעורר". הקורא עובר מידה אחרי מידה, והמודל והנוסח זזים יחד:
 * המידה מודגשת במודל, והנוסח נגלל לערך שלה ומהבהב (אותו מסלול כמו לחיצה על תווית).
 * בלי מספרים רגולטוריים כאן: כל ערך בא מ־data/takanot.json.
 */

/** זמן לכל צעד בסיור האוטומטי. זמן קריאה, לא מספר רגולטורי. */
const TOUR_MS = 3800;

interface Props {
  keys: string[];
  pinnedKey: string | null;
  onStep: (key: string) => void;
  /** הסצנה הבאה באותו חלק: "הבא" במידה האחרונה, והסיור, ממשיכים אליה. */
  next: { title: string; go: () => void } | null;
  touring: boolean;
  setTouring: (t: boolean | ((t: boolean) => boolean)) => void;
}

export function StepBar({ keys, pinnedKey, onStep, next, touring, setTouring }: Props) {
  const idx = pinnedKey ? keys.indexOf(pinnedKey) : -1;
  const atEnd = idx === keys.length - 1;
  const timer = useRef<number | null>(null);

  const go = (i: number) => {
    if (keys.length === 0) return;
    // אחרי המידה האחרונה: לסצנה הבאה באותו חלק, אם יש
    if (i >= keys.length && next) { next.go(); return; }
    onStep(keys[(i + keys.length) % keys.length]);
  };

  // סיור: צעד בכל TOUR_MS. בסוף הסצנה ממשיך לסצנה הבאה בחלק, ובסוף החלק נעצר
  useEffect(() => {
    if (!touring) return;
    if (atEnd && !next) { timer.current = window.setTimeout(() => setTouring(false), TOUR_MS); }
    else timer.current = window.setTimeout(() => go(idx + 1), idx < 0 ? 0 : TOUR_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touring, idx, keys]);

  if (keys.length === 0) return null;
  const p = idx >= 0 ? DATA.params[keys[idx]] : null;

  return (
    <div
      className="stepbar"
      role="group"
      aria-label="סיור במידות"
      onKeyDown={(e) => {
        // RTL: חץ שמאלה הוא "הבא"
        if (e.key === 'ArrowLeft') { e.preventDefault(); setTouring(false); go(idx + 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); setTouring(false); go(idx - 1); }
      }}
    >
      {/* כותרת גלויה: בלי מילה, הפס נראה כמו עוד שורת כפתורים (ענת, 03.11.2026: "לא מבינה מה עשית, סיור?") */}
      <p className="stepbar-title">
        <b>סיור במידות</b> מעבר על כל מידה במודל, אחת אחרי השנייה, והנוסח מתעדכן איתה
      </p>
      <button type="button" className="btn" onClick={() => { setTouring(false); go(idx - 1); }} disabled={idx <= 0}>
        הקודם
      </button>
      <div className="stepbar-now" aria-live="polite">
        {p ? (
          <>
            <span className="stepbar-count">מידה {idx + 1} מתוך {keys.length}</span>
            <b>{p.label}</b> <span className="stepbar-val">{withOp(p)}</span>
            <span className="stepbar-rule">תקנה <span dir="ltr">{p.rule}</span></span>
            {atEnd ? (
              <span className="stepbar-count">{next ? `הבאה בחלק: ${next.title}` : 'סוף החלק'}</span>
            ) : null}
          </>
        ) : (
          <span className="stepbar-count">
            {keys.length} {keys.length === 1 ? 'מידה' : 'מידות'} בהמחשה. "הבא" עובר {keys.length === 1 ? 'עליה' : 'עליהן'}, ו"סיור" עובר על כל החלק.
          </span>
        )}
      </div>
      <button
        type="button"
        className="btn"
        aria-pressed={touring}
        onClick={() => setTouring((t) => !t)}
        title="מעבר אוטומטי על כל המידות"
      >
        {touring ? 'עצירה' : 'סיור'}
      </button>
      <button
        type="button"
        className="btn"
        disabled={atEnd && !next}
        title={atEnd && next ? `לסצנה הבאה: ${next.title}` : undefined}
        onClick={() => { setTouring(false); go(idx + 1); }}
      >
        {atEnd && next ? 'לסצנה הבאה' : 'הבא'}
      </button>
    </div>
  );
}
