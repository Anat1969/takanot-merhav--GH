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
  // הקירות בצדדים הרחוקים מהמצלמה (x חיובי, z שלילי), כדי שלא יסתירו את החדר
  b.box(t, H, W + 2 * t, L / 2 + t / 2, 0, 0);
  b.box(L, H, t, 0, 0, -W / 2 - t / 2);
  b.box(L + 2 * t, sf.ceilingThickness, W + 2 * t, 0, H, 0, 'soft');
  b.person(sf.personX, sf.personZ);
  b.dim([-L / 2, 0, W / 2], [-L / 2, H, W / 2], [0, 0, sf.heightDimOffset], 'room_height_min');
  b.dim([-L / 2, 0, -W / 2], [-L / 2, 0, W / 2], [-sf.widthDimOffset, 0, 0], 'room_width_min');
  b.measure([-L / 2, 0, W / 2], [L / 2, 0, W / 2], [0, 0, sf.lengthDimOffset], meters(L));
  b.valueTag([0, 0, 0], 'room_area_min', ' שטח רצפה');
};

const windowScene: Build = (b, { value, fx, sf }) => {
  const A = sf.sampleFloorArea, L = sf.roomLength, W = A / L, Hh = sf.roomHeight, t = sf.wallThickness;
  const need = A * value('window_ratio_min');
  const wh = fx.windowH, ww = need / wh, sill = fx.windowSill;
  const side = (W - ww) / 2;
  b.ground(L + sf.groundMargin, W + sf.groundMargin);
  const xw = L / 2;
  b.box(t, sill, W, xw, 0, 0);
  b.box(t, Hh - sill - wh, W, xw, sill + wh, 0);
  b.box(t, wh, side, xw, sill, -(ww + side) / 2);
  b.box(t, wh, side, xw, sill, (ww + side) / 2);
  b.box(sf.glassThickness, wh, ww, xw, sill, 0, 'glass');
  b.box(L, Hh, t, 0, 0, -W / 2 - t / 2);
  b.box(L, sf.patchHeight, W, 0, 0, 0, 'patch', false);
  b.tag([sf.floorLabelX, sf.labelLift, 0], 'שטח רצפה לדוגמה ' + A + ' מ״ר');
  b.measure([xw, sill, -ww / 2], [xw, sill, ww / 2], [0, -sf.widthDimDrop, 0], meters(ww));
  b.measure([xw, sill, ww / 2], [xw, sill + wh, ww / 2], [0, 0, sf.heightDimSide], meters(wh));
  b.valueTag([xw - sf.ratioLabelInset, sill + wh + sf.ratioLabelLift, 0], 'window_ratio_min', ' = ' + sqm(need) + ' חלון');
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

const ramp: Build = (b, { value, sf }) => {
  const slope = value('ramp_slope_max'), w = value('ramp_width_min'), rise = sf.rise, run = rise / slope, pl = sf.platformLength;
  b.ground(run + pl + sf.groundMargin, w + sf.groundMargin, (run + pl) / 2, 0);
  b.ramp([0, 0, 0], run, rise, w);
  b.box(pl, rise, w, run + pl / 2, 0, 0);
  const hr = sf.handrailHeight;
  for (const z of [-w / 2, w / 2]) b.line([[0, hr, z], [run, rise + hr, z], [run + pl, rise + hr, z]], 'dim');
  b.dim([0, 0, -w / 2], [0, 0, w / 2], [-sf.dimSide, 0, 0], 'ramp_width_min');
  b.measure([0, 0, w / 2], [run, 0, w / 2], [0, 0, sf.dimSide], 'אורך ' + meters(run));
  b.measure([run + pl, 0, w / 2], [run + pl, rise, w / 2], [sf.dimSide, 0, 0], 'הפרש גובה ' + meters(rise));
  b.valueTag([run / 2, rise / 2 + sf.labelLift, 0], 'ramp_slope_max', ' שיפוע');
  b.person(run + sf.personX, sf.personZ, rise);
};

const stairwell: Build = (b, { value, sf }) => {
  const W = value('stair_width_min'), D = value('landing_depth_min'), R = value('riser_max'), T = value('tread_min');
  const n = sf.stepsPerFlight, g = sf.gap, L = n * T, Hl = n * R;
  const z1 = -(g + W) / 2, z2 = (g + W) / 2;
  b.ground(L + D + sf.groundMargin, 2 * W + g + sf.groundMargin, (L + D) / 2, 0);
  for (let i = 0; i < n; i++) b.box(T, R * (i + 1), W, i * T + T / 2, 0, z1);
  b.box(D, Hl, 2 * W + g, L + D / 2, 0, 0);
  for (let j = 0; j < n; j++) b.box(T, R * (j + 1), W, L - j * T - T / 2, Hl, z2);
  b.box(L + D, sf.wallThickness, sf.wallThickness, (L + D) / 2, 0, -W - g / 2 - sf.wallThickness / 2, 'mass', false);
  b.dim([0, 0, z1 - W / 2], [0, 0, z1 + W / 2], [-sf.dimSide, 0, 0], 'stair_width_min');
  b.dim([L, Hl, -W - g / 2], [L + D, Hl, -W - g / 2], [0, 0, -sf.dimSide], 'landing_depth_min');
  b.person(L + D / 2, sf.personZ, Hl);
};

const deadend: Build = (b, { value, fx, sf }) => {
  const Lde = value('deadend_max'), sw = fx.stairW, cw = fx.corridorW, aw = fx.aptW, ad = fx.aptDepth, H = sf.storeyHeight;
  const total = Lde + sw + sf.mainLength + sw;
  b.ground(total + sf.groundMargin, cw + 2 * ad + sf.groundMargin, total / 2, 0);
  b.box(sf.wallThickness, H, cw, sf.wallThickness / 2, 0, 0);
  const zs = -(cw + sw) / 2;
  b.box(sw, H, sw, Lde + sw / 2, 0, zs);
  b.box(sw, H, sw, total - sw / 2, 0, zs);
  b.tag([Lde + sw / 2, H + sf.stairLabelLift, zs], 'חדר מדרגות');
  b.tag([total - sw / 2, H + sf.stairLabelLift, zs], 'חדר מדרגות');
  const count = Math.floor(total / aw);
  for (let i = 0; i < count; i++) b.box(aw - sf.wallThickness, H, ad, i * aw + aw / 2, 0, (cw + ad) / 2, 'soft');
  b.box(total, sf.patchHeight, cw, total / 2, 0, 0, 'patch', false);
  b.box(Lde, sf.patchHeight * 2, cw, Lde / 2, 0, 0, 'accent', false);
  b.dim([0, 0, -cw / 2], [Lde, 0, -cw / 2], [0, sf.dimLift, 0], 'deadend_max');
  b.tag([Lde / 2, sf.labelLift, 0], 'כיוון מילוט אחד בלבד');
  b.person(Lde + sw + sf.personX, sf.personZ);
};

const mezzanine: Build = (b, { value, sf }) => {
  const L = sf.roomLength, W = sf.roomWidth, t = sf.slabThickness, tw = sf.wallThickness, md = sf.mezzDepth;
  const below = value('mezz_clear_below_min'), above = value('mezz_clear_above_min'), H = below + t + above;
  const edge = L / 2 - md;
  b.ground(L + sf.groundMargin, W + sf.groundMargin);
  b.box(tw, H, W + 2 * tw, L / 2 + tw / 2, 0, 0);
  b.box(L, H, tw, 0, 0, -W / 2 - tw / 2);
  b.box(md, t, W, L / 2 - md / 2, below, 0);
  b.box(sf.glassThickness, sf.railHeight, W, edge, below + t, 0, 'glass');
  b.box(L + 2 * tw, t, W + 2 * tw, 0, H, 0, 'soft');
  b.dim([edge, 0, W / 2], [edge, below, W / 2], [0, 0, sf.dimSide], 'mezz_clear_below_min');
  b.dim([edge, below + t, W / 2], [edge, H, W / 2], [0, 0, sf.dimSide], 'mezz_clear_above_min');
  b.measure([-L / 2, 0, W / 2], [-L / 2, H, W / 2], [-sf.dimSide, 0, 0], 'גובה החלל ' + meters(H));
  b.person(L / 2 - sf.personBelowX, sf.personZ);
  b.person(L / 2 - md / 2, -sf.personZ, below + t);
};

const shop: Build = (b, { value, fx, sf }) => {
  const w = value('shop_width_min'), h = value('shop_height_max'), D = sf.depth, pier = sf.pier, nw = sf.neighborWidth;
  const total = w + 2 * (pier + nw);
  b.ground(total + sf.groundMargin, D + sf.groundMargin, 0, sf.personZ);
  b.box(pier, h, D, -(w + pier) / 2, 0, 0);
  b.box(pier, h, D, (w + pier) / 2, 0, 0);
  b.box(w, h, sf.glassThickness, 0, 0, D / 2, 'glass');
  b.box(nw, h, D, -(w / 2 + pier + nw / 2), 0, 0, 'soft');
  b.box(nw, h, D, w / 2 + pier + nw / 2, 0, 0, 'soft');
  b.box(total, sf.floorsAbove * fx.floorH, D, 0, h, 0, 'soft');
  b.dim([-w / 2, 0, D / 2], [w / 2, 0, D / 2], [0, 0, sf.dimSide], 'shop_width_min');
  b.dim([w / 2 + pier, 0, D / 2], [w / 2 + pier, h, D / 2], [0, 0, sf.dimSide], 'shop_height_max');
  b.person(0, D / 2 + sf.personZ);
};

const court: Build = (b, { value, sf }) => {
  const c = value('inner_court_width_min'), Lw = sf.wingLength, Dw = sf.wingDepth, H = sf.height;
  const zA = -(c + Dw) / 2, zB = (c + Dw) / 2;
  b.ground(Lw + Dw + sf.groundMargin, c + 2 * Dw + sf.groundMargin, Dw / 2, 0);
  b.box(Lw, H, Dw, 0, 0, zA);
  b.box(Lw, H, Dw, 0, 0, zB, 'soft');
  b.box(Dw, H, c + 2 * Dw, Lw / 2 + Dw / 2, 0, 0);
  b.box(sf.windowWidth, sf.windowHeight, sf.glassThickness, 0, sf.windowSill, -c / 2, 'glass');
  b.tag([0, sf.windowSill + sf.windowHeight + sf.labelLift, -c / 2], 'חלון חדר מגורים');
  b.dim([-Lw / 2, sf.dimLift, -c / 2], [-Lw / 2, sf.dimLift, c / 2], [0, 0, 0], 'inner_court_width_min');
  b.measure([-Lw / 2, 0, zB + Dw / 2], [-Lw / 2, H, zB + Dw / 2], [0, 0, sf.labelLift], 'גובה הקירות ' + meters(H));
  b.person(-Lw / 2 + sf.windowWidth, sf.personZ);
};

const street: Build = (b, { value, sf }) => {
  const Bw = sf.buildingWidth, Bd = sf.buildingDepth, H = sf.height, sw = sf.sidewalkWidth;
  const pc = value('street_projection_clearance_min'), pd = value('street_projection_depth_max');
  const cc = value('canopy_clearance_min'), cd = value('canopy_depth_max');
  b.ground(Bw + sf.groundMargin, Bd + sw + sf.roadWidth + sf.groundMargin, 0, (sw + sf.roadWidth - Bd) / 2);
  b.box(Bw, H, Bd, 0, 0, -Bd / 2);
  b.box(Bw + sf.groundMargin, sf.patchHeight, sw, 0, 0, sw / 2, 'patch', false);
  const bw = Bw * sf.balconyWidthShare, bx = Bw * sf.balconyShift;
  b.box(bw, sf.slabThickness, pd, bx, pc, pd / 2);
  const cw = sf.canopyWidth, cx = -Bw * sf.canopyShift;
  b.box(cw, sf.canopyThickness, cd, cx, cc, cd / 2, 'accent');
  b.line([[-Bw / 2 - sf.labelX, sf.lineLift, 0], [Bw / 2 + sf.labelX, sf.lineLift, 0]], 'plot', true);
  b.tag([Bw / 2 + sf.labelX, sf.lineLift, 0], 'קו מגרש');
  b.tag([0, sf.lineLift, sw / 2], 'מדרכה');
  b.dim([bx + bw / 2, 0, pd], [bx + bw / 2, pc, pd], [sf.dimSide, 0, 0], 'street_projection_clearance_min');
  b.dim([bx - bw / 2, pc, 0], [bx - bw / 2, pc, pd], [-sf.dimSide, 0, 0], 'street_projection_depth_max');
  b.dim([cx - cw / 2, 0, cd], [cx - cw / 2, cc, cd], [-sf.dimSide, 0, 0], 'canopy_clearance_min');
  b.dim([cx + cw / 2, cc, 0], [cx + cw / 2, cc, cd], [sf.dimSide, 0, 0], 'canopy_depth_max');
  b.person(cx + sf.personX, cd / 2);
};

const setbackShed: Build = (b, { value, fx, sf }) => {
  const pw = sf.plotWidth, pdp = sf.plotDepth, ss = sf.sideSetback, S = fx.setback;
  const bw = pw - 2 * ss, bd = pdp - 2 * S, h = value('setback_structure_height_max');
  b.ground(pw + sf.groundMargin, pdp + sf.groundMargin);
  b.box(bw, sf.buildingHeight, bd, 0, 0, 0);
  const x0 = -pw / 2, x1 = pw / 2, z0 = -pdp / 2, z1 = pdp / 2, y = sf.lineLift;
  b.line([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [x0, y, z0]], 'plot', true);
  const bx0 = -bw / 2, bx1 = bw / 2, bz0 = -bd / 2, bz1 = bd / 2;
  b.line([[bx0, y, bz0], [bx1, y, bz0], [bx1, y, bz1], [bx0, y, bz1], [bx0, y, bz0]], 'buildingLine', true);
  const sx = x0 + ss / 2, sz = (bz0 + bz1) / 2 * sf.shedShiftShare;
  b.box(sf.shedWidth, h, sf.shedDepth, sx, 0, sz, 'accent');
  b.dim([sx - sf.shedWidth / 2, 0, sz + sf.shedDepth / 2], [sx - sf.shedWidth / 2, h, sz + sf.shedDepth / 2], [0, 0, sf.dimSide], 'setback_structure_height_max');
  b.measure([x0, 0, bz1], [bx0, 0, bz1], [0, 0, sf.dimSide], 'מרווח צדדי ' + meters(ss));
  b.tag([x0, sf.labelLift, z1], 'גבול מגרש');
  b.tag([bx0, sf.labelLift, bz1], 'קו בניין', null, 'limit');
  b.person(sx, sz + sf.shedDepth / 2 + sf.personZ);
};

const doorSwing: Build = (b, { value, sf }) => {
  const dw = value('door_width_min'), Ww = sf.wallWidth, Hw = sf.wallHeight, t = sf.wallThickness;
  const dh = value('door_height_min'), side = (Ww - dw) / 2;
  b.ground(Ww + sf.groundMargin, sf.groundDepth);
  b.box(side, Hw, t, -(dw + side) / 2, 0, 0);
  b.box(side, Hw, t, (dw + side) / 2, 0, 0);
  b.box(dw, Hw - dh, t, 0, dh, 0);
  // כנף פתוחה ב־90 מעלות לכיוון היציאה (z חיובי)
  b.box(sf.leafThickness, dh, dw, -dw / 2, 0, t / 2 + dw / 2, 'accent');
  const arc: [number, number, number][] = [];
  for (let i = 0; i <= sf.arcSegments; i++) {
    const a = (i / sf.arcSegments) * (Math.PI / 2);
    arc.push([-dw / 2 + dw * Math.cos(a), sf.arcLift, t / 2 + dw * Math.sin(a)]);
  }
  b.line(arc, 'dim', true);
  const z0 = sf.arrowStart, z1 = sf.arrowStart + sf.arrowLength, y = sf.arrowLift, hd = sf.arrowHead;
  b.line([[0, y, z0], [0, y, z1]], 'path');
  b.line([[-hd, y, z1 - hd], [0, y, z1], [hd, y, z1 - hd]], 'path');
  b.tag([0, sf.labelLift, z1], 'כיוון היציאה');
  b.tag([0, sf.labelLift, z0], 'החדר');
  b.measure([-dw / 2, 0, -t / 2], [dw / 2, 0, -t / 2], [0, 0, -sf.dimSide], 'פתח ' + meters(dw));
  b.person(sf.personX, sf.personZ);
};

const commonPath: Build = (b, { value, sf }) => {
  const Lr = sf.roomLength, Wr = sf.roomWidth, h = sf.wallHeight, t = sf.wallThickness, ex = sf.exitWidth;
  const cp = value('common_path_max'), y = sf.lift;
  b.ground(Lr + sf.groundMargin, Wr + sf.groundMargin, Lr / 2, 0);
  b.box(t, h, Wr, 0, 0, 0, 'soft');
  b.box(Lr, h, t, Lr / 2, 0, -Wr / 2, 'soft');
  b.box(Lr, h, t, Lr / 2, 0, Wr / 2, 'soft');
  const gapZ = Wr / 2 - ex;
  b.box(t, h, Wr - 2 * ex, Lr, 0, 0, 'soft');
  const E1: [number, number, number] = [Lr, y, -gapZ - ex / 2], E2: [number, number, number] = [Lr, y, gapZ + ex / 2];
  const P: [number, number, number] = [sf.startX, y, 0], Qp: [number, number, number] = [sf.startX + cp, y, 0];
  b.line([P, Qp], 'path');
  b.line([Qp, E1], 'dim', true);
  b.line([Qp, E2], 'dim', true);
  b.m.walker = { points: [P, Qp, E1], length: pathLength([P, Qp, E1]), radius: sf.walkerRadius, speed: sf.walkerSpeed, pause: sf.walkerPause };
  b.dim(P, Qp, [0, sf.dimLift, 0], 'common_path_max');
  b.tag([Qp[0], sf.labelLift, Qp[2]], 'נקודת התפצלות');
  b.tag([E1[0], sf.labelLift, E1[2]], 'יציאה');
  b.tag([E2[0], sf.labelLift, E2[2]], 'יציאה');
  b.tag([P[0], sf.labelLift, P[2]], 'הנקודה הרחוקה');
  b.person(sf.startX + sf.personX, sf.personZ);
};

const parking: Build = (b, { value, sf }) => {
  const aw = value('parking_width_min'), al = value('parking_length_min'), rw = sf.regularWidth, n = sf.regularCount;
  const total = aw + n * rw, y = sf.lineLift;
  b.ground(total + sf.groundMargin, al + sf.groundMargin, total / 2, 0);
  const xs = [0, aw];
  for (let i = 1; i <= n; i++) xs.push(aw + i * rw);
  for (const x of xs) b.line([[x, y, -al / 2], [x, y, al / 2]], 'dim');
  b.line([[0, y, -al / 2], [total, y, -al / 2]], 'dim');
  b.box(aw, sf.patchHeight, al, aw / 2, 0, 0, 'patch', false);
  for (let i = 0; i < n; i++) b.box(sf.carWidth, sf.carHeight, sf.carLength, aw + i * rw + rw / 2, 0, -al / 2 + sf.carBack + sf.carLength / 2, 'soft');
  b.box(sf.carWidth, sf.carHeight, sf.carLength, sf.carWidth / 2 + sf.carBack, 0, -al / 2 + sf.carBack + sf.carLength / 2, 'soft');
  b.dim([0, 0, al / 2], [aw, 0, al / 2], [0, 0, sf.dimSide], 'parking_width_min');
  b.dim([0, 0, -al / 2], [0, 0, al / 2], [-sf.dimSide, 0, 0], 'parking_length_min');
  b.tag([aw * (1 - sf.labelLift), sf.labelLift, 0], 'חניה נגישה');
  b.person(aw - sf.carBack, sf.personZ);
};

const toilet: Build = (b, { value, sf }) => {
  const d = value('toilet_turning_min'), cl = sf.clearance, fd = sf.fixtureDepth, t = sf.wallThickness;
  const W = d + 2 * cl, D = d + fd + 2 * cl, H = sf.wallHeight;
  b.ground(W + sf.groundMargin, D + sf.groundMargin, 0, 0);
  b.box(W + 2 * t, H, t, 0, 0, -D / 2 - t / 2);
  b.box(t, H, D, W / 2 + t / 2, 0, 0);
  b.box(sf.wcWidth, sf.wcHeight, sf.wcDepth, W / 2 - cl - sf.wcWidth, 0, -D / 2 + sf.wcDepth / 2, 'accent');
  b.box(sf.sinkWidth, sf.sinkThickness, sf.sinkDepth, -W / 2 + cl + sf.sinkWidth / 2, sf.sinkHeight, -D / 2 + sf.sinkDepth / 2, 'accent');
  const cz = D / 2 - cl - d / 2, r = d / 2;
  const ring: [number, number, number][] = [];
  for (let i = 0; i <= sf.circleSegments; i++) {
    const a = (i / sf.circleSegments) * Math.PI * 2;
    ring.push([r * Math.cos(a), sf.circleLift, cz + r * Math.sin(a)]);
  }
  b.line(ring, 'path', true);
  b.box(W, sf.patchHeight, D, 0, 0, 0, 'patch', false);
  b.dim([-r, sf.dimLift, cz], [r, sf.dimLift, cz], [0, 0, 0], 'toilet_turning_min');
};

const lift: Build = (b, { value, sf }) => {
  const w = value('lift_cab_width_min'), d = value('lift_cab_depth_min'), H = sf.cabHeight, t = sf.wallThickness, g = sf.shaftGap;
  const door = w * sf.doorShare, jamb = (w - door) / 2;
  b.ground(w + 2 * g + sf.groundMargin, d + 2 * g + sf.lobbyDepth + sf.groundMargin, 0, sf.lobbyDepth / 2);
  b.box(w + 2 * g + 2 * t, sf.shaftHeight, d + 2 * g + 2 * t, 0, 0, 0, 'soft');
  b.box(w + 2 * t, H, t, 0, 0, -d / 2 - t / 2);
  b.box(t, H, d, -w / 2 - t / 2, 0, 0);
  b.box(t, H, d, w / 2 + t / 2, 0, 0);
  b.box(jamb, H, t, -w / 2 + jamb / 2, 0, d / 2 + t / 2);
  b.box(jamb, H, t, w / 2 - jamb / 2, 0, d / 2 + t / 2);
  b.box(w, sf.patchHeight, d, 0, 0, 0, 'patch', false);
  b.dim([-w / 2, 0, d / 2], [w / 2, 0, d / 2], [0, 0, sf.lobbyDepth / 2], 'lift_cab_width_min');
  b.dim([w / 2, 0, -d / 2], [w / 2, 0, d / 2], [g + sf.dimSide, 0, 0], 'lift_cab_depth_min');
  b.measure([-door / 2, 0, d / 2 + t], [door / 2, 0, d / 2 + t], [0, 0, sf.dimSide], 'דלת ' + meters(door));
  b.person(0, 0);
};

const route: Build = (b, { value, sf }) => {
  const w = value('route_width_min'), slope = value('route_slope_max'), rise = sf.rise, run = rise / slope, pl = sf.plazaLength;
  const Bw = sf.buildingWidth, Bd = sf.buildingDepth, x0 = run + pl;
  b.ground(x0 + Bd + sf.groundMargin, Bw + sf.groundMargin, (x0 + Bd) / 2, 0);
  b.ramp([0, 0, 0], run, rise, w);
  b.box(pl, rise, Bw, run + pl / 2, 0, 0);
  b.box(Bd, sf.buildingHeight, Bw, x0 + Bd / 2, rise, 0);
  b.box(sf.patchHeight, sf.doorHeight, sf.doorWidth, x0, rise, 0, 'accent', false);
  b.dim([0, 0, -w / 2], [0, 0, w / 2], [-sf.dimSide, 0, 0], 'route_width_min');
  b.valueTag([run / 2, rise / 2 + sf.labelLift, 0], 'route_slope_max', ' שיפוע');
  b.measure([0, 0, w / 2], [run, 0, w / 2], [0, 0, sf.dimSide], 'אורך ' + meters(run));
  b.tag([x0, rise + sf.doorHeight + sf.labelLift, 0], 'כניסה');
  b.person(run + sf.personX, sf.personZ, rise);
};

const BUILDERS: Record<string, Build> = {
  room, window: windowScene, balcony, stairs, railing, door, walking, ramp, stairwell, deadend,
  mezzanine, shop, court, street, setbackShed, doorSwing, commonPath, parking, toilet, lift, route,
};

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
