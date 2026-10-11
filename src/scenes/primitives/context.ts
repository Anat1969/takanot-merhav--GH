import { createContext, useContext } from 'react';
import type * as THREE from 'three';
import type { Palette } from '../palette.ts';

/** מה שהפרימיטיבים צריכים לדעת על התצוגה: צבעים, זום (פיקסלים למטר) וכיוון המבט */
export interface ViewState {
  palette: Palette;
  zoom: number;
  viewDir: THREE.Vector3;
}

export const ViewContext = createContext<ViewState | null>(null);

export function useView(): ViewState {
  const v = useContext(ViewContext);
  if (!v) throw new Error('ViewContext חסר');
  return v;
}
