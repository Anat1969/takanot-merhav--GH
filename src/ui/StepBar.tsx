import { useEffect, useRef, useState } from 'react';
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
}

export function StepBar({ keys, pinnedKey, onStep }: Props) {
  const [touring, setTouring] = useState(false);
  const idx = pinnedKey ? keys.indexOf(pinnedKey) : -1;
  const timer = useRef<number | null>(null);

  const go = (i: number) => {
    if (keys.length === 0) return;
    onStep(keys[(i + keys.length) % keys.length]);
  };

  // סיור: צעד בכל TOUR_MS, ועצירה אחרי המידה האחרונה
  useEffect(() => {
    if (!touring) return;
    if (idx === keys.length - 1) { setTouring(false); return; }
    timer.current = window.setTimeout(() => go(idx + 1), idx < 0 ? 0 : TOUR_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touring, idx, keys]);

  // סצנה חדשה עוצרת את הסיור
  useEffect(() => { setTouring(false); }, [keys]);

  if (keys.length < 2) return null;
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
      <button type="button" className="btn" onClick={() => { setTouring(false); go(idx - 1); }} disabled={idx <= 0}>
        הקודם
      </button>
      <div className="stepbar-now" aria-live="polite">
        {p ? (
          <>
            <span className="stepbar-count">מידה {idx + 1} מתוך {keys.length}</span>
            <b>{p.label}</b> <span className="stepbar-val">{withOp(p)}</span>
            <span className="stepbar-rule">תקנה <span dir="ltr">{p.rule}</span></span>
          </>
        ) : (
          <span className="stepbar-count">{keys.length} מידות בהמחשה. "הבא" עובר עליהן אחת אחת.</span>
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
      <button type="button" className="btn" onClick={() => { setTouring(false); go(idx + 1); }}>
        הבא
      </button>
    </div>
  );
}
