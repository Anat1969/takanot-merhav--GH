import { useCallback, useEffect, useState } from 'react';

type Choice = 'light' | 'dark' | null;
const KEY = 'takanot-merhav:theme';

function read(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

function systemDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}

export interface Theme {
  resolved: 'light' | 'dark';
  toggle: () => void;
}

/** ערכת צבעים: לפי המערכת, או לפי בחירה שנשמרת בדפדפן */
export function useTheme(): Theme {
  const [choice, setChoice] = useState<Choice>(read);
  const [sys, setSys] = useState(systemDark);

  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSys(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (choice) root.setAttribute('data-theme', choice);
    else root.removeAttribute('data-theme');
  }, [choice]);

  const resolved = choice ?? (sys ? 'dark' : 'light');
  const toggle = useCallback(() => {
    const next = resolved === 'dark' ? 'light' : 'dark';
    setChoice(next);
    try { localStorage.setItem(KEY, next); } catch { /* אחסון חסום */ }
  }, [resolved]);

  return { resolved, toggle };
}
