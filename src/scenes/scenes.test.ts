import { describe, expect, it } from 'vitest';
import { DATA, paramsOfScene } from '../data/data.ts';
import { extent, type SceneModel } from './model.ts';
import { buildScene, SCENE_IDS } from './scenes.ts';

const keysIn = (m: SceneModel) => new Set([...m.dims, ...m.tags].map((x) => x.paramKey).filter(Boolean));

describe('סצנות', () => {
  it('לכל סצנה בנתונים יש בונה', () => expect(SCENE_IDS.sort()).toEqual(Object.keys(DATA.scenes).sort()));

  for (const id of Object.keys(DATA.scenes)) {
    it(`${id}: כל פרמטר של הסצנה מוצג במודל`, () => {
      const m = buildScene(id);
      const shown = keysIn(m);
      const expected = paramsOfScene(id).filter((k) => !(id === 'balcony' && k !== 'balcony_ratio_max'));
      for (const k of expected) expect(shown, k).toContain(k);
      const e = extent(m);
      expect(e.max[0]).toBeGreaterThan(e.min[0]);
    });
  }

  it('שינוי גובה חדר משנה את הגיאומטריה ואת התווית', () => {
    const a = buildScene('room');
    const b = buildScene('room', { room_height_min: 3.1 });
    const da = a.dims.find((d) => d.paramKey === 'room_height_min')!;
    const db = b.dims.find((d) => d.paramKey === 'room_height_min')!;
    expect(db.to[1]).toBeCloseTo(3.1);
    expect(db.label).not.toBe(da.label);
  });

  it('מרפסת: המגבלה הקובעת היא הקטנה מבין השתיים', () => {
    const ratio = buildScene('balcony');
    expect(ratio.dims.some((d) => d.paramKey === 'balcony_ratio_max')).toBe(true);
    const abs = buildScene('balcony', { balcony_ratio_max: 0.9 });
    expect(abs.dims.some((d) => d.paramKey === 'balcony_abs_max')).toBe(true);
  });

  it('מרחק הליכה: המסלול נמדד ומושווה למגבלה', () => {
    const m = buildScene('walking');
    expect(m.walker!.length).toBeGreaterThan(0);
    const tag = m.tags.find((t) => t.paramKey === 'walk_max')!;
    expect(tag.label.includes('חריגה')).toBe(m.walker!.length > DATA.params.walk_max.value);
    const ok = buildScene('walking', { walk_max: 40 });
    expect(ok.tags.find((t) => t.paramKey === 'walk_max')!.label).not.toContain('חריגה');
  });

  it('מדרגות: הרום והשלח במודל לפי הנתונים', () => {
    const m = buildScene('stairs', { riser_max: 0.16 });
    const r = m.dims.find((d) => d.paramKey === 'riser_max')!;
    expect(r.to[1] - r.from[1]).toBeCloseTo(0.16);
  });

  it('כבש: שיפוע מתון יותר מאריך את הכבש', () => {
    const a = buildScene('ramp').ramps[0];
    const b = buildScene('ramp', { ramp_slope_max: 1 / 20 }).ramps[0];
    expect(b.length).toBeGreaterThan(a.length);
    expect(a.rise / a.length).toBeCloseTo(DATA.params.ramp_slope_max.value);
  });

  it('חדר מדרגות: רוחב המהלך ועומק המשטח לפי הנתונים', () => {
    const m = buildScene('stairwell', { stair_width_min: 1.4, landing_depth_min: 1.6 });
    const w = m.dims.find((d) => d.paramKey === 'stair_width_min')!;
    const l = m.dims.find((d) => d.paramKey === 'landing_depth_min')!;
    expect(w.to[2] - w.from[2]).toBeCloseTo(1.4);
    expect(l.to[0] - l.from[0]).toBeCloseTo(1.6);
  });

  it('פרוזדור ללא מוצא: אורך הקטע לפי המגבלה', () => {
    const m = buildScene('deadend', { deadend_max: 9 });
    const d = m.dims.find((x) => x.paramKey === 'deadend_max')!;
    expect(d.to[0] - d.from[0]).toBeCloseTo(9);
  });
});
