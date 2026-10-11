// מודל סצנה טהור: רשימות של נפחים, קווים, מידות ותוויות. הרינדור ב־src/render.
// בקבצים בתיקייה הזו אין מספרי מידה: הכול מ־data/takanot.json (scripts/validate.ts בודק).
import { DATA } from '../data/data.ts';
import { isLimit, withOp } from '../data/format.ts';
import type { Data } from '../data/schema.ts';

export type P3 = [number, number, number];
export type Finish = 'mass' | 'soft' | 'glass' | 'accent' | 'patch';

export interface Volume { size: P3; base: P3; finish: Finish; grow: boolean }
export interface Polyline { points: P3[]; tone: 'plot' | 'buildingLine' | 'dim' | 'path'; dashed: boolean }
export interface Dim { from: P3; to: P3; offset: P3; label: string; paramKey: string | null; limit: boolean }
export interface Tag { at: P3; label: string; paramKey: string | null; tone: 'limit' | 'ink' | 'pencil' }
export interface Person { at: P3; height: number }
export interface Walker { points: P3[]; length: number; radius: number; speed: number; pause: number }

export interface SceneModel {
  ground: { size: [number, number]; center: [number, number] };
  volumes: Volume[];
  lines: Polyline[];
  dims: Dim[];
  tags: Tag[];
  people: Person[];
  walker: Walker | null;
}

export interface SceneInput {
  value: (key: string) => number;
  fx: Data['fixtures'];
  sf: Record<string, number>;
}

export function inputFor(sceneId: string, data: Data = DATA, override: Record<string, number> = {}): SceneInput {
  return {
    value: (key) => {
      if (key in override) return override[key];
      const p = data.params[key];
      if (!p) throw new Error(`פרמטר חסר: ${key}`);
      return p.value;
    },
    fx: data.fixtures,
    sf: data.sceneFixtures[sceneId] ?? {},
  };
}

/** בונה מצטבר, כדי שקוד הסצנות יהיה קצר וקריא */
export class Builder {
  m: SceneModel = { ground: { size: [0, 0], center: [0, 0] }, volumes: [], lines: [], dims: [], tags: [], people: [], walker: null };
  private input: SceneInput;
  private data: Data;
  constructor(input: SceneInput, data: Data = DATA) {
    this.input = input;
    this.data = data;
  }

  ground(w: number, d: number, cx = 0, cz = 0) { this.m.ground = { size: [w, d], center: [cx, cz] }; }
  box(w: number, h: number, d: number, x: number, y: number, z: number, finish: Finish = 'mass', grow = true) {
    this.m.volumes.push({ size: [w, h, d], base: [x, y, z], finish, grow });
  }
  line(points: P3[], tone: Polyline['tone'], dashed = false) { this.m.lines.push({ points, tone, dashed }); }
  person(x: number, z: number, y = 0) { this.m.people.push({ at: [x, y, z], height: this.input.fx.personH }); }

  /** מידה רגולטורית: התווית והצבע נגזרים מהפרמטר */
  dim(from: P3, to: P3, offset: P3, paramKey: string, label?: string) {
    const p = this.data.params[paramKey];
    const v = this.input.value(paramKey);
    this.m.dims.push({ from, to, offset, paramKey, limit: isLimit(p.op), label: label ?? withOp({ ...p, value: v }) });
  }
  /** מידה תיאורית (רקע) */
  measure(from: P3, to: P3, offset: P3, label: string) {
    this.m.dims.push({ from, to, offset, paramKey: null, limit: false, label });
  }
  tag(at: P3, label: string, paramKey: string | null = null, tone: Tag['tone'] = 'pencil') {
    this.m.tags.push({ at, label, paramKey, tone });
  }
  valueTag(at: P3, paramKey: string, suffix = '') {
    const p = this.data.params[paramKey];
    this.tag(at, withOp({ ...p, value: this.input.value(paramKey) }) + suffix, paramKey, isLimit(p.op) ? 'limit' : 'ink');
  }
}

export function pathLength(points: P3[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    len += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  }
  return len;
}

/** תיבת התחום של כל מה שבסצנה, להתאמת המצלמה */
export function extent(m: SceneModel): { min: P3; max: P3 } {
  const min: P3 = [Infinity, Infinity, Infinity];
  const max: P3 = [-Infinity, -Infinity, -Infinity];
  const add = (p: P3) => { for (let i = 0; i < p.length; i++) { min[i] = Math.min(min[i], p[i]); max[i] = Math.max(max[i], p[i]); } };
  for (const v of m.volumes) {
    add([v.base[0] - v.size[0] / 2, v.base[1], v.base[2] - v.size[2] / 2]);
    add([v.base[0] + v.size[0] / 2, v.base[1] + v.size[1], v.base[2] + v.size[2] / 2]);
  }
  for (const d of m.dims) { add([d.from[0] + d.offset[0], d.from[1] + d.offset[1], d.from[2] + d.offset[2]]); add([d.to[0] + d.offset[0], d.to[1] + d.offset[1], d.to[2] + d.offset[2]]); }
  for (const t of m.tags) add(t.at);
  if (!isFinite(min[0])) return { min: [-1, 0, -1], max: [1, 1, 1] };
  return { min, max };
}
