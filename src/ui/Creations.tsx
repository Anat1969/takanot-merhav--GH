import { useEffect, useState } from 'react';
import { DATA } from '../data/data.ts';
import './creations.css';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'app-creations': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { src?: string; heading?: string };
    }
  }
}

/** דף הכתבות בכתובת #/creations, כדי שיעבוד גם בקישור הישיר מ-GitHub (app/index.html) */
export const CREATIONS_HASH = '#/creations';
const isCreations = () => location.hash === CREATIONS_HASH;

export function useCreationsPage(): boolean {
  const [on, setOn] = useState(isCreations);
  useEffect(() => {
    const f = () => { setOn(isCreations()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return on;
}

/** הקישור "כתבות" בכלי הכותרת, באותו סגנון כפתור */
export function CreationsLink({ current = false }: { current?: boolean }) {
  return (
    <a className="btn creations-link" href={CREATIONS_HASH} aria-current={current ? 'page' : undefined}>
      כתבות
    </a>
  );
}

/**
 * כתבות: עמוד A4 אחד לכל נושא, מורכב מהתמציות ומההמחשות של המדריך.
 * הרכיב המשותף <app-creations> (AppOfApp-GH/public/creations.js) מציג, מדפיס ומעלה לחדר במוזיאון TAARUCHA.
 * הנתונים: public/creations.json, נגזר מ-data/takanot.json ב-tools/creations.mjs.
 */
export function Creations() {
  return (
    <div className="app creations-page">
      <header className="top">
        <a className="brand creations-home" href="#">
          <h1>{DATA.meta.title}</h1>
          <p>{DATA.meta.regulation}</p>
        </a>
        <span />
        <div className="tools">
          <CreationsLink current />
          <ai-menu />
        </div>
      </header>
      <main className="creations-main">
        <app-creations src="./creations.json" heading="כתבות מתוך התקנות" />
      </main>
    </div>
  );
}
