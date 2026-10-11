// שבע הסצנות (SPEC.md, "הסצנות"). כל ערך רגולטורי מ־params, כל מידת רקע מ־fixtures ו־sceneFixtures.
import { DATA } from '../data/data.ts';
import { formatValue, meters, opSign, sqm, withOp } from '../data/format.ts';
import type { Data } from '../data/schema.ts';
import { Builder, inputFor, pathLength, type SceneInput, type SceneModel } from './model.ts';

type Build = (b: Builder, i: SceneInput, data: Data) => void;

const room: Build = (b, { value, fx, sf }) => {
  const H = value('room_height_min');
  const L = fx.roomLength;
  const W = Math.max(value('room_width_min'), value('room_area_min') / L);
  const t = sf.wallThickness;
  b.ground(L + sf.groundMargin, W + sf.groundMargin);
  b.box(L + 2 * t, fx.slab, W + 2 * t, 0, -fx.slab, 0, 'mass', false);
  b.box(t, H, W + 2 * t, -L / 2 - t / 2, 0, 0);
  b.box(L, H, t, 0, 0, -W / 2 - t / 2);
  b.box(L + 2 * t, sf.ceilingThickness, W + 2 * t, 0, H, 0, 'soft');
  b.person(sf.personX, sf.personZ);
  b.dim([-L / 2, 0, W / 2], [-L / 2, H, W / 2], [0, 0, sf.heightDimOffset], 'room_height_min');
  b.dim([L / 2, 0, -W / 2], [L / 2, 0, W / 2], [sf.widthDimOffset, 0, 0], 'room_width_min');
  b.measure([-L / 2, 0, W / 2], [L / 2, 0, W / 2], [0, 0, sf.lengthDimOffset], meters(L));
  b.valueTag([0, 0, 0], 'room_area_min', ' שטח רצפה');
};

const windowScene: Build = (b, { value, fx, sf }) => {
  const A = sf.sampleFloorArea, L = sf.roomLength, W = A / L, Hh = sf.roomHeight, t = sf.wallThickness;
  const need = A * value('window_ratio_min');
  const wh = fx.windowH, ww = need / wh, sill = fx.windowSill;
  const side = (W - ww) / 2;
  b.ground(L + sf.groundMargin, W + sf.groundMargin);
  b.box(t, sill, W, -L / 2, 0, 0);
  b.box(t, Hh - sill - wh, W, -L / 2, sill + wh, 0);
  b.box(t, wh, side, -L / 2, sill, -(ww + side) / 2);
  b.box(t, wh, side, -L / 2, sill, (ww + side) / 2);
  b.box(sf.glassThickness, wh, ww, -L / 2, sill, 0, 'glass');
  b.box(L, Hh, t, 0, 0, -W / 2 - t / 2);
  b.box(L, sf.patchHeight, W, 0, 0, 0, 'patch', false);
  b.tag([sf.floorLabelX, sf.labelLift, 0], 'שטח רצפה לדוגמה ' + A + ' מ״ר');
  b.measure([-L / 2, sill, -ww / 2], [-L / 2, sill, ww / 2], [0, -sf.widthDimDrop, 0], meters(ww));
  b.measure([-L / 2, sill, ww / 2], [-L / 2, sill + wh, ww / 2], [0, 0, sf.heightDimSide], meters(wh));
  b.valueTag([-L / 2 - sf.ratioLabelInset, sill + wh + sf.ratioLabelLift, 0], 'window_ratio_min', ' = ' + sqm(need) + ' חלון');
};

const balcony: Build = (b, { value, fx, sf }, data) => {
  const S = fx.setback, Bw = fx.buildingWidth, Bd = fx.buildingDepth, H = fx.floorH, n = fx.floors;
  const byRatio = value('balcony_ratio_max') * S;
  const proj = Math.min(byRatio, value('balcony_abs_max'));
  const zLine = -S;
  const bw = Bw * sf.widthShare, bx = -Bw * sf.offsetShare;
  b.ground(Bw + sf.groundMargin, Bd + S + sf.groundMargin, 0, -(Bd + S) / 2);
  b.box(Bw, H * n, Bd, 0, 0, zLine - Bd / 2);
  for (let i = 1; i < n; i++) {
    b.box(bw, sf.slabThickness, proj, bx, i * H, zLine + proj / 2);
    b.box(bw, sf.railHeight, sf.glassThickness, bx, i * H + sf.slabThickness, zLine + proj - sf.glassThickness / 2, 'glass');
  }
  const x0 = -Bw / 2 - sf.lineOverhang, x1 = Bw / 2 + sf.lineOverhang;
  b.line([[x0, sf.lineLift, 0], [x1, sf.lineLift, 0]], 'plot', true);
  b.line([[x0, sf.lineLift, zLine], [x1, sf.lineLift, zLine]], 'buildingLine', true);
  b.tag([Bw / 2 + sf.labelX, sf.lineLift, sf.labelZ], 'גבול מגרש');
  b.tag([Bw / 2 + sf.labelX, sf.lineLift, zLine + sf.labelZ], 'קו בניין', null, 'limit');
  b.measure([Bw / 2 + sf.setbackDimX, 0, zLine], [Bw / 2 + sf.setbackDimX, 0, 0], [sf.setbackDimOffset, 0, 0], 'מרווח ' + meters(S));
  const key = byRatio <= value('balcony_abs_max') ? 'balcony_ratio_max' : 'balcony_abs_max';
  const why = key === 'balcony_ratio_max' ? formatValue({ ...data.params[key], value: value(key) }) + ' מהמרווח' : 'לכל היותר';
  const x = -Bw * sf.projDimXShare, y = H * (n - 1);
  b.dim([x, y, zLine], [x, y, zLine + proj], [-sf.projDimSide, sf.projDimLift, 0], key, opSign('<=') + ' ' + meters(proj) + ' (' + why + ')');
  b.person(Bw * sf.personXShare, zLine + sf.personZ);
};

const stairs: Build = (b, { value, fx, sf }, data) => {
  const R = value('riser_max'), T = value('tread_min'), hr = value('headroom_min');
  const n = Math.min(fx.flightSteps, value('steps_per_flight_max'));
  const w = sf.flightWidth, L = n * T, Ht = n * R;
  b.ground(L + sf.groundMargin, w + sf.groundMargin, L / 2, 0);
  for (let i = 0; i < n; i++) b.box(T, R * (i + 1), w, i * T + T / 2, 0, 0);
  b.box(sf.landingLength, Ht, w, L + sf.landingLength / 2, 0, 0);
  // תקרה אופקית: הגובה הפנוי הקטן ביותר הוא מעל המדרגה העליונה
  b.box(L + sf.ceilingOverhang, sf.ceilingThickness, w + sf.ceilingWiden, L / 2 + sf.ceilingShift, Ht + hr, 0, 'soft');
  b.line([[0, R, -w / 2 - sf.nosingInset], [L - T, Ht, -w / 2 - sf.nosingInset]], 'dim');
  b.dim([T, R, w / 2], [T, 2 * R, w / 2], [0, 0, sf.dimSide], 'riser_max');
  b.dim([T, 2 * R, w / 2], [2 * T, 2 * R, w / 2], [0, sf.treadLift, sf.dimSide], 'tread_min');
  b.dim([L - T, Ht, -w / 2], [L - T, Ht + hr, -w / 2], [0, 0, -sf.headroomSide], 'headroom_min');
  const sp = data.params.steps_per_flight_max;
  b.tag([L / 2, Ht + R + sf.stepsLabelLift, w / 2 + sf.stepsLabelSide], n + ' מדרגות במהלך, ' + withOp({ ...sp, value: value('steps_per_flight_max') }), 'steps_per_flight_max', 'limit');
  b.person(L + sf.personX, sf.personZ);
};

const railing: Build = (b, { value, sf }) => {
  const h = value('railing_height_min'), Wd = sf.landingWidth, D = sf.landingDepth, drop = sf.levelDrop;
  const c = sf.columnSize, ci = sf.columnInset;
  b.ground(Wd + sf.groundMargin, D + sf.groundExtraDepth, 0, sf.groundShift);
  b.box(Wd, sf.slabThickness, D, 0, drop - sf.slabThickness, 0);
  b.box(c, drop - sf.slabThickness, c, -Wd / 2 + ci, 0, -D / 2 + ci);
  b.box(c, drop - sf.slabThickness, c, Wd / 2 - ci, 0, -D / 2 + ci);
  b.box(Wd, h, sf.glassThickness, 0, drop, D / 2 - sf.glassThickness / 2, 'glass');
  b.box(Wd, sf.handrailHeight, sf.handrailDepth, 0, drop + h - sf.handrailHeight, D / 2 - sf.handrailDepth / 2, 'accent');
  b.person(sf.personX, sf.personZ, drop);
  b.dim([Wd / 2, drop, D / 2], [Wd / 2, drop + h, D / 2], [sf.dimSide, 0, 0], 'railing_height_min');
  b.measure([Wd / 2, 0, D / 2], [Wd / 2, drop, D / 2], [sf.dimSide, 0, sf.dimSide], 'הפרש מפלסים ' + meters(drop));
};

const door: Build = (b, { value, sf }) => {
  const dw = value('door_width_min'), dh = value('door_height_min'), Hw = sf.wallHeight, Ww = sf.wallWidth, t = sf.wallThickness;
  const side = (Ww - dw) / 2;
  b.ground(Ww + sf.groundMargin, sf.groundDepth);
  b.box(side, Hw, t, -(dw + side) / 2, 0, 0);
  b.box(side, Hw, t, (dw + side) / 2, 0, 0);
  b.box(dw, Hw - dh, t, 0, dh, 0);
  const leaf = dw - sf.leafWidthGap;
  b.box(sf.leafThickness, dh - sf.leafGap, leaf, -dw / 2 + sf.leafInset, 0, t / 2 + leaf / 2, 'accent');
  b.dim([-dw / 2, 0, t / 2], [dw / 2, 0, t / 2], [0, 0, sf.widthDimOffset], 'door_width_min');
  b.dim([dw / 2, 0, t / 2], [dw / 2, dh, t / 2], [sf.heightDimOffset, 0, 0], 'door_height_min');
  b.person(sf.personX, sf.personZ);
};

const walking: Build = (b, { value, fx, sf }, data) => {
  const n = fx.apts, aw = fx.aptW, ad = fx.aptDepth, cw = fx.corridorW, sw = fx.stairW, H = sf.storeyHeight;
  const len = n * aw;
  b.ground(len + sw + sf.groundMargin, 2 * ad + cw + sf.groundMargin, len / 2, 0);
  for (let i = 0; i < n; i++) {
    const x = sw + i * aw + aw / 2;
    b.box(aw - sf.wallGap, H, ad, x, 0, -(cw + ad) / 2, 'soft');
    if (i < n - 1) b.box(aw - sf.wallGap, H, ad, x, 0, (cw + ad) / 2, 'soft');
  }
  b.box(sw - sf.wallGap, H + sf.stairExtraHeight, cw + 2 * ad * sf.stairDepthShare, sw / 2, 0, 0);
  b.tag([sw / 2, H + sf.stairLabelLift, 0], 'חדר מדרגות מוגן');
  const far = sw + (n - 1) * aw + aw / 2;
  const y = sf.pathLift;
  const points: [number, number, number][] = [[far, y, -cw / 2], [far, y, 0], [sw, y, 0]];
  const L = pathLength(points);
  const limit = value('walk_max');
  b.line(points, 'path');
  b.m.walker = { points, length: L, radius: sf.walkerRadius, speed: sf.walkerSpeed, pause: sf.walkerPause };
  const p = data.params.walk_max;
  const verdict = L <= limit ? '' : ', חריגה';
  b.tag([(far + sw) / 2, sf.labelLift, sf.labelZ], 'מסלול במודל ' + meters(L, 1) + ', מותר ' + opSign(p.op) + ' ' + formatValue({ ...p, value: limit }) + verdict, 'walk_max', 'limit');
  b.tag([far, sf.labelLift, -cw / 2 - sf.doorLabelZ], 'דלת הדירה הרחוקה');
  b.person(far - sf.personBack, sf.personZ);
};

const BUILDERS: Record<string, Build> = { room, window: windowScene, balcony, stairs, railing, door, walking };

export const SCENE_IDS = Object.keys(BUILDERS);

/** בונה את מודל הסצנה. override מאפשר לבדוק שינוי ערך (בבדיקות) */
export function buildScene(id: string, override: Record<string, number> = {}, data: Data = DATA): SceneModel {
  const build = BUILDERS[id];
  if (!build) throw new Error(`סצנה לא מוכרת: ${id}`);
  const input = inputFor(id, data, override);
  const b = new Builder(input, data);
  build(b, input, data);
  return b.m;
}
