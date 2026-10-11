import { useCallback, useEffect, useMemo, useState } from 'react';
import { DATA, DEFAULT_REF, SECTIONS, sceneOf } from '../data/data.ts';
import type { View } from '../render/SceneCanvas.tsx';
import { Header } from './Header.tsx';
import { IndexNav } from './IndexNav.tsx';
import { RuleText } from './RuleText.tsx';
import { Sheet } from './Sheet.tsx';
import { buildSearcher } from './searchDocs.ts';
import { useTheme } from './theme.ts';

export function refFromHash(hash: string): string | null {
  const h = hash.replace(/^#s/, '').replace(/-/g, '.');
  return SECTIONS[h] ? h : null;
}
export function hashFor(ref: string): string {
  return '#s' + ref.replace(/\./g, '-');
}

export interface FocusRequest { key: string; n: number }

export function App() {
  const searcher = useMemo(buildSearcher, []);
  const [current, setCurrent] = useState<string>(() => refFromHash(location.hash) ?? DEFAULT_REF);
  const [terms, setTerms] = useState<string[]>([]);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const [view, setView] = useState<View>('axon');
  const theme = useTheme();

  const go = useCallback((ref: string, keepTerms = false) => {
    if (!SECTIONS[ref]) return;
    setCurrent(ref);
    if (!keepTerms) setTerms([]);
    setPinnedKey(null);
    setHoverKey(null);
    try { history.replaceState(null, '', hashFor(ref)); } catch { /* מסגרת שלא מאפשרת */ }
  }, []);

  useEffect(() => {
    const onHash = () => { const r = refFromHash(location.hash); if (r) go(r); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [go]);

  const pickFromText = useCallback((key: string) => {
    setPinnedKey((k) => (k === key ? null : key));
  }, []);

  // לחיצה על תווית במודל: אם הפרמטר שייך לסעיף אחר באותה סצנה, מחליפים סעיף בלי לבנות את הסצנה מחדש
  const pickFromModel = useCallback((key: string) => {
    const ref = DATA.params[key].rule;
    setCurrent((cur) => {
      if (ref !== cur) { try { history.replaceState(null, '', hashFor(ref)); } catch { /* */ } }
      return ref;
    });
    setPinnedKey(key);
    setFocus((f) => ({ key, n: (f?.n ?? 0) + 1 }));
  }, []);

  const activeKey = hoverKey ?? pinnedKey;
  const sceneId = sceneOf(current);

  return (
    <div className="app">
      <Header
        searcher={searcher}
        onPick={(ref, t) => { setTerms(t); go(ref, true); }}
        theme={theme}
      />
      <main className="main">
        <IndexNav current={current} onGo={(r) => go(r)} />
        <RuleText
          current={current}
          terms={terms}
          searcher={searcher}
          activeKey={activeKey}
          focus={focus}
          onHover={setHoverKey}
          onPick={pickFromText}
        />
        <Sheet
          current={current}
          sceneId={sceneId}
          view={view}
          onView={setView}
          themeKey={theme.resolved}
          activeKey={activeKey}
          onHover={setHoverKey}
          onPick={pickFromModel}
          onGo={(r) => go(r)}
        />
      </main>
    </div>
  );
}
