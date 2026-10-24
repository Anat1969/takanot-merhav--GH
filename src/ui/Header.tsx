import { useEffect, useRef, useState } from 'react';
import { DATA } from '../data/data.ts';
import type { Hit, Searcher } from '../search/index.ts';
import { Highlight } from './Highlight.tsx';
import type { Theme } from './theme.ts';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'ai-menu': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { chat?: string; research?: string };
    }
  }
}

const SNIPPET = 110;

export function Header({ searcher, onPick, theme }: {
  searcher: Searcher;
  onPick: (ref: string, terms: string[]) => void;
  theme: Theme;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const hits: Hit[] = q.trim() ? searcher.search(q) : [];
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const pick = (h: Hit | undefined) => {
    if (!h) return;
    setOpen(false);
    onPick(h.doc.ref, h.terms);
  };

  const showList = open && q.trim().length > 0;

  return (
    <header className="top">
      <div className="brand">
        <h1>{DATA.meta.title}</h1>
        <p>{DATA.meta.regulation}</p>
      </div>
      <div className="search" role="search" ref={box}>
        <div className="search-box">
          <input
            id="q"
            type="search"
            autoComplete="off"
            placeholder="חיפוש לפי מילה או מספר סעיף, למשל: מעקה, 3.2.2.5"
            aria-label="חיפוש בתקנות"
            aria-controls="results"
            aria-expanded={showList}
            aria-activedescendant={showList && hits[sel] ? 'hit-' + hits[sel].doc.ref : undefined}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                if (!hits.length) return;
                e.preventDefault();
                setOpen(true);
                setSel((s) => (s + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                pick(hits[sel]);
              } else if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
          />
          <span className="count" aria-live="polite">{q.trim() && hits.length ? `${hits.length} סעיפים` : ''}</span>
        </div>
        {showList && (
          <ul className="results" id="results" role="listbox" ref={list}>
            {hits.length === 0 ? (
              <li className="empty" role="option" aria-selected="false" aria-disabled="true">
                לא נמצא סעיף עבור ״{q}״. נסו: מעקה, מדרגות, מרפסת, חלון, מרחק הליכה.
              </li>
            ) : (
              hits.map((h, i) => {
                const snip = h.doc.body ? h.doc.body.slice(0, SNIPPET) + (h.doc.body.length > SNIPPET ? '…' : '') : h.doc.partId;
                return (
                  <li
                    key={h.doc.ref}
                    id={'hit-' + h.doc.ref}
                    role="option"
                    aria-selected={i === sel}
                    onMouseDown={(e) => { e.preventDefault(); pick(h); }}
                    onMouseEnter={() => setSel(i)}
                  >
                    <span className="r-ref">{h.doc.ref}</span>
                    <span className="r-title"><Highlight text={h.doc.title} terms={h.terms} searcher={searcher} /></span>
                    <span className="r-snip"><Highlight text={snip} terms={h.terms} searcher={searcher} /></span>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
      <div className="tools">
        <button className="btn" type="button" onClick={theme.toggle}>
          {theme.resolved === 'dark' ? 'תצוגה בהירה' : 'תצוגה כהה'}
        </button>
        <ai-menu />
      </div>
      <p className="notice">
        <strong>גרסת MVP.</strong> מבנה הסעיפים וכותרותיהם לפי נבו. התמציות נכתבו לעבודה ואינן הנוסח, והערכים המסומנים ״לאימות״ טעונים בדיקה מול הנוסח הרשמי לפני כל שימוש.
      </p>
    </header>
  );
}
