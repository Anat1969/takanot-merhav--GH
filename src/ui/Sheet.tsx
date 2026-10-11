import { Component, lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { DATA, SECTIONS, paramsOfScene } from '../data/data.ts';
import { withOp } from '../data/format.ts';
import type { View } from '../render/SceneCanvas.tsx';
import { buildScene } from '../scenes/scenes.ts';

const SceneCanvas = lazy(() => import('../render/SceneCanvas.tsx').then((m) => ({ default: m.SceneCanvas })));

const VIEWS: { id: View; label: string }[] = [
  { id: 'plan', label: 'תכנית' },
  { id: 'section', label: 'חתך' },
  { id: 'axon', label: 'אקסונומטריה' },
];

interface Props {
  current: string;
  sceneId: string | null;
  view: View;
  onView: (v: View) => void;
  themeKey: string;
  activeKey: string | null;
  onHover: (k: string | null) => void;
  onPick: (k: string) => void;
  onGo: (ref: string) => void;
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

class GLBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function Sheet({ current, sceneId, view, onView, themeKey, activeKey, onHover, onPick, onGo }: Props) {
  const [resetToken, setReset] = useState(0);
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = useMemo(webglAvailable, []);
  const model = useMemo(() => (sceneId ? buildScene(sceneId) : null), [sceneId]);
  const s = SECTIONS[current];
  const keys = sceneId ? paramsOfScene(sceneId) : [];
  const unverified = keys.filter((k) => !DATA.params[k].verified).length;
  const glFail = (
    <div className="empty-stage">
      <strong>המודל לא נטען.</strong>
      <span>רעננו את הדף. הנוסח והערכים זמינים בעמודה הסמוכה.</span>
    </div>
  );

  return (
    <section className="sheet" aria-label="גיליון המחשה">
      <div className="sheet-head">
        <h3>{sceneId ? DATA.scenes[sceneId].title : 'אין המחשה לסעיף זה'}</h3>
        <div className="seg" role="group" aria-label="תצוגה">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" aria-pressed={view === v.id} disabled={!sceneId} onClick={() => onView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stage">
        {model && sceneId ? (
          gl ? (
            <GLBoundary fallback={glFail}>
              <Suspense fallback={<div className="loading" aria-hidden="true" />}>
                <SceneCanvas
                  model={model}
                  sceneKey={sceneId + ':' + themeKey}
                  view={view}
                  resetToken={resetToken}
                  reduced={reduced}
                  activeKey={activeKey}
                  onHover={onHover}
                  onPick={onPick}
                />
              </Suspense>
              <div className="nav3d">
                <button className="btn" type="button" onClick={() => setReset((n) => n + 1)}>חזרה לתצוגת המוצא</button>
              </div>
            </GLBoundary>
          ) : glFail
        ) : (
          <div className="empty-stage">
            <strong>הסעיף עדיין לא מומחש.</strong>
            <span>ההמחשות הקיימות בגרסה זו:</span>
            <div className="links">
              {Object.entries(DATA.scenes).map(([id, sc]) => (
                <button key={id} className="btn" type="button" onClick={() => onGo(sc.rules[0])}>{sc.title}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="titleblock">
        <div><span>תקנה</span><b>{s?.ref}</b></div>
        <div><span>נושא</span><b title={s?.title}>{s?.title}</b></div>
        <div><span>תצוגה</span><b>{sceneId ? VIEWS.find((v) => v.id === view)!.label : 'אין'}</b></div>
        <div><span>מצב הערכים</span><b>{sceneId ? (unverified ? `${unverified} לאימות` : 'נבדקו') : 'טרם הוזנו'}</b></div>
      </div>

      <table className="sr-only">
        <caption>מידות בהמחשה</caption>
        <thead><tr><th>פרמטר</th><th>ערך</th><th>סעיף</th></tr></thead>
        <tbody>
          {keys.map((k) => {
            const p = DATA.params[k];
            return <tr key={k}><td>{p.label}</td><td>{withOp(p)}</td><td>תקנה {p.rule}</td></tr>;
          })}
        </tbody>
      </table>
    </section>
  );
}
