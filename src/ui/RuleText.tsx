import { Fragment, useEffect, useRef } from 'react';
import { DATA, SECTIONS } from '../data/data.ts';
import { formatValue, isLimit } from '../data/format.ts';
import type { Searcher } from '../search/index.ts';
import type { FocusRequest } from './App.tsx';
import { Highlight } from './Highlight.tsx';

interface Props {
  current: string;
  terms: string[];
  searcher: Searcher;
  activeKey: string | null;
  focus: FocusRequest | null;
  onHover: (key: string | null) => void;
  onPick: (key: string) => void;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const idOf = (ref: string) => 'rule-' + ref.replace(/\./g, '-');

export function RuleText({ current, terms, searcher, activeKey, focus, onHover, onPick }: Props) {
  const root = useRef<HTMLElement>(null);
  const s = SECTIONS[current];
  const rule = DATA.rules[current];
  const scene = rule ? DATA.scenes[rule.scene] : null;

  // הסעיף הנוכחי נגלל לתצוגה כשאינו הראשון בסצנה (לא בטעינה הראשונה, כדי לא להזיז את העמוד)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!scene || scene.rules[0] === current) return;
    document.getElementById(idOf(current))?.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  }, [current, scene]);

  // לחיצה על מידה במודל: גלילה לערך והבהוב הסעיף
  useEffect(() => {
    if (!focus || !root.current) return;
    const v = root.current.querySelector<HTMLElement>(`.val[data-key="${focus.key}"]`);
    if (!v) return;
    v.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    const sec = v.closest('.rule');
    if (sec) { sec.classList.remove('flash'); void (sec as HTMLElement).offsetWidth; sec.classList.add('flash'); }
  }, [focus]);

  if (!s) return null;

  const body = (text: string) =>
    text.split(/(\{\w+\})/).map((part, i) => {
      const m = part.match(/^\{(\w+)\}$/);
      if (!m) return <Highlight key={i} text={part} terms={terms} searcher={searcher} />;
      const k = m[1];
      const p = DATA.params[k];
      return (
        <Fragment key={i}>
          <span
            className="val"
            data-key={k}
            data-limit={isLimit(p.op) || undefined}
            data-on={activeKey === k || undefined}
            tabIndex={0}
            role="button"
            title={p.label + ': סימון במודל'}
            onMouseEnter={() => onHover(k)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(k)}
            onBlur={() => onHover(null)}
            onClick={() => onPick(k)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(k); } }}
          >
            {formatValue(p)}
          </span>
          {!p.verified && <span className="verify" title="הערך טרם נבדק מול הנוסח הרשמי">לאימות</span>}
        </Fragment>
      );
    });

  const source = (ref: string) => (
    <div className="src">
      הנוסח המחייב: <a href={DATA.meta.source.url} target="_blank" rel="noopener noreferrer">תקנה {ref} ב{DATA.meta.source.name}</a>
    </div>
  );

  return (
    <article className="text" aria-live="polite" ref={root}>
      <div className="crumb">{s.partId}, {s.partTitle}</div>
      {rule && scene ? (
        <>
          <h2>{scene.title}</h2>
          {scene.rules.map((ref) => {
            const r = DATA.rules[ref];
            return (
              <section key={ref} className="rule" data-active={ref === current || undefined} id={idOf(ref)}>
                <div className="num">{ref}</div>
                <div>
                  <h3><Highlight text={SECTIONS[ref].title} terms={terms} searcher={searcher} /></h3>
                  <div className="kind">{r.kind}, תמצית לעבודה</div>
                  {r.body.map((b, i) => <p key={i}>{body(b)}</p>)}
                  {source(ref)}
                </div>
              </section>
            );
          })}
        </>
      ) : (
        <>
          <h2><Highlight text={s.title} terms={terms} searcher={searcher} /></h2>
          <section className="rule" data-active>
            <div className="num">{s.ref}</div>
            <div>
              <p className="pending">התמצית והערכים של סעיף זה טרם הוזנו.</p>
              {source(s.ref)}
            </div>
          </section>
        </>
      )}
    </article>
  );
}
