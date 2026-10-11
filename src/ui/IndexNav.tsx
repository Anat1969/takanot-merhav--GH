import { useEffect, useRef } from 'react';
import { DATA, SECTIONS } from '../data/data.ts';

export function IndexNav({ current, onGo }: { current: string; onGo: (ref: string) => void }) {
  const nav = useRef<HTMLElement>(null);
  const currentPart = SECTIONS[current]?.partId;

  useEffect(() => {
    const el = nav.current?.querySelector<HTMLElement>('[aria-current="true"]');
    const det = el?.closest('details');
    if (det && !det.open) det.open = true;
    // גלילה בתוך תוכן העניינים בלבד, לא של העמוד כולו
    const navEl = nav.current;
    if (el && navEl && navEl.scrollHeight > navEl.clientHeight + 1) {
      const top = el.getBoundingClientRect().top - navEl.getBoundingClientRect().top + navEl.scrollTop;
      if (top < navEl.scrollTop || top > navEl.scrollTop + navEl.clientHeight - el.offsetHeight) navEl.scrollTop = top - navEl.clientHeight / 2;
    }
  }, [current]);

  return (
    <nav className="index" aria-label="תוכן עניינים" ref={nav}>
      {DATA.parts.map((p) => {
        const hasRule = p.groups.some((g) => g.sections.some((s) => DATA.rules[s.ref]));
        return (
          <details key={p.id} open={hasRule || p.id === currentPart}>
            <summary>
              <span>{p.title}</span>
              <span className="part-n">{p.id}</span>
            </summary>
            <ul>
              {p.groups.map((g, gi) => (
                <li key={gi} className="group">
                  {g.title && <div className="group-label">{g.title}</div>}
                  <ul>
                    {g.sections.map((s) => (
                      <li key={s.ref}>
                        <button type="button" aria-current={s.ref === current ? 'true' : 'false'} onClick={() => onGo(s.ref)}>
                          <span className="ref">{s.ref}</span>
                          <span>{s.title}</span>
                          {DATA.rules[s.ref] ? <span className="has3d" title="יש המחשה">3D</span> : <span />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </nav>
  );
}
