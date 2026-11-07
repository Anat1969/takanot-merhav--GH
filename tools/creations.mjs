// מפיק את public/creations.json מתוך data/takanot.json (תקן "יצירות" וכתבות, AppOfApp-GH/docs/creations-standard.md).
// הרצה: node --experimental-strip-types tools/creations.mjs
// כל מספר נקרא מ-params, וכל משפט הוא התמצית שהמדריך עצמו מציג (גוף הסעיף, עם הערך במקום {key}).
// התמציות אינן הנוסח, וכל ערך "לאימות": זה כתוב בכל כתבה, כמו במדריך.
// בקוד כתובים רק המסגור: שם הכתבה, כותרת התובנה וההייקו (מסומן "הייקו מקורי").
// תמונות: ההמחשה התלת־ממדית של הסצנה מתוך המדריך עצמו, צילום מסך ב-public/creations/img/<scene>.jpg.
import fs from 'node:fs';
import { formatValue } from '../src/data/format.ts';

const D = JSON.parse(fs.readFileSync('data/takanot.json', 'utf8'));
const SOURCE = `${D.meta.regulation}. תמצית לעבודה מתוך "${D.meta.title}", לאימות מול הנוסח ב${D.meta.source.name}`;
const NB = / /g;

const rule = (ref) => { const r = D.rules[ref]; if (!r) throw new Error(`סעיף לא נמצא: ${ref}`); return r; };
const v = (key) => { const p = D.params[key]; if (!p) throw new Error(`פרמטר לא נמצא: ${key}`); return formatValue(p).replace(NB, ' '); };
const fill = (s) => s.replace(/\{(\w+)\}/g, (_, k) => v(k));
const body = (ref) => rule(ref).body.map(fill);
const first = (ref) => body(ref)[0];
const quote = (ref) => ({ style: 'quote', quote: first(ref), who: `תמצית סעיף ${ref}: ${rule(ref).title}`, cite: SOURCE });
const img = (scene) => {
  const file = `public/creations/img/${scene}.jpg`;
  if (!fs.existsSync(file)) throw new Error(`חסרה המחשה: ${file}`);
  return { image: `creations/img/${scene}.jpg`, credit: `המחשה מתוך המדריך: ${D.scenes[scene].title}. ערכים לאימות` };
};
const T = (id, zone, title, sub, creations) => ({
  id, zone, title, sub,
  creations: creations.map((c) => ({ id: c.id || c.style, kicker: c.kicker || `תקנות במרחב · ${zone}`, ...c })),
});
const haiku = (lines, what) => ({ style: 'haiku', lines, text: `הייקו מקורי. ${what}` });

const topics = [];

// 1. ידע: המדרגה
topics.push(T('stairs', 'ידע', 'מדרגה אחת, שלוש מידות', 'רום, שלח ומזקף ראש במהלך מדרגות בדרך מוצא. חלק ג\', בטיחות אש בבניינים.', [
  { style: 'poster', title: D.scenes.stairs.title, text: `רום עד **${v('riser_max')}**, שלח לפחות **${v('tread_min')}**.`, ...img('stairs') },
  quote('3.2.2.5'),
  { style: 'insight', title: `עד ${v('steps_per_flight_max')} מדרגות, ואז משטח`, text: `==${first('3.2.2.6')}==` },
  { style: 'post', title: 'המדרגה במספרים', text: [`רום (גובה): עד ${v('riser_max')}.`, `שלח (עומק): לפחות ${v('tread_min')}.`, `מזקף ראש: לפחות ${v('headroom_min')}.`, `במהלך אחד: עד ${v('steps_per_flight_max')} מדרגות.`, `מעקה: לפחות ${v('railing_height_min')}.`].join('\n'), tags: ['תקנות_במרחב', 'מדרגות'] },
  haiku(['רגל עולה', 'ראש לא נוגע בתקרה', 'עוד משטח, ונח'], 'המדרגה נמדדת **ברום**, **בשלח** ו**בגובה הפנוי** מעליה.'),
]));

// 2. ידע: חדר מגורים
topics.push(T('room', 'ידע', 'חדר מגורים במינימום', 'גובה, שטח, רוחב וחלון: חלק ב\', גדלם, איוורם ותאורתם של חלקי בנין.', [
  { style: 'poster', title: D.scenes.room.title, text: `גובה **${v('room_height_min')}**, שטח **${v('room_area_min')}**.`, ...img('room') },
  quote('2.04'),
  { style: 'insight', title: `חלון של ${v('window_ratio_min')} משטח הרצפה`, text: `==${first('2.21')}==` },
  { style: 'fromto', title: 'מהרצפה אל החלון', fromLabel: 'שטח הרצפה', toLabel: 'שטח החלון', from: `לא פחות מ-${v('room_area_min')}, ורוחב ${v('room_width_min')} בין קירות.`, to: `לא פחות מ-${v('window_ratio_min')} משטח הרצפה.`, text: 'החלון נגזר מהחדר: ככל שהרצפה גדלה, החלון גדל איתה.' },
  { style: 'essay', title: 'מה עוד כתוב בסעיף', text: rule('2.03').title, body: [first('2.03'), body('2.03')[1], body('2.04')[1]] },
]));

// 3. הבנה: מרחקי מילוט
topics.push(T('escape', 'הבנה', `${D.params.walk_max.value} מטר עד דרך מוצא בטוח`, 'שלושה מרחקים בקומה: מרחק הליכה, מהלך משותף ופרוזדור ללא מוצא.', [
  { style: 'poster', title: D.scenes.walking.title, text: `מדלת הדירה הרחוקה: עד **${v('walk_max')}**.`, ...img('walking') },
  quote('3.2.15.9'),
  { style: 'fromto', title: 'מכיוון אחד אל שני כיוונים', fromLabel: 'פרוזדור ללא מוצא', toLabel: 'מהלך משותף', from: `כיוון מילוט אחד בלבד: עד ${v('deadend_max')}.`, to: `עד נקודת ההתפצלות בין שתי דרכי מוצא: עד ${v('common_path_max')}.`, text: body('3.2.15.3')[1] },
  { style: 'insight', title: 'נמדד במסלול, לא בקו אווירי', text: `==${body('3.2.15.9')[1].split('.')[0]}.==` },
  haiku(['דלת אחרונה', 'עשרים מטר של פרוזדור', 'ואז מדרגות'], 'מרחק ההליכה נמדד **בצעדים** לאורך המסלול, לא **בקו ישר**.'),
]));

// 4. הבנה: מה בולט אל הרחוב והמרווח
topics.push(T('projections', 'הבנה', 'מה מותר לבלוט מעבר לקו', 'מרפסת אל המרווח, ובליטה וגגון אל המדרכה: חלק ד\', בניה במרווחים ומעבר לקו רחוב.', [
  { style: 'poster', title: D.scenes.street.title, text: `גגון עד **${v('canopy_depth_max')}**, וגובה פנוי של **${v('canopy_clearance_min')}** לפחות.`, ...img('street') },
  quote('4.03'),
  { style: 'fromto', title: 'מהמרווח אל המדרכה', fromLabel: 'מרפסת במרווח (4.03)', toLabel: 'בליטה מעבר לקו המגרש (4.05)', from: `עד ${v('balcony_ratio_max')} מרוחב המרווח, ולא יותר מ-${v('balcony_abs_max')}.`, to: `עד ${v('street_projection_depth_max')}, וגובה פנוי של ${v('street_projection_clearance_min')} לפחות מתחתיה.`, text: 'שני סעיפים, שני גבולות: המרווח שבתוך המגרש, והמדרכה שמעבר לקו.' },
  { style: 'insight', title: 'מעל המדרכה, הגובה הפנוי קובע', text: `==${first('4.08')}==` },
  haiku(['מרפסת בשמש', 'גגון מעל העוברים', 'הראש עובר חופשי'], 'כל בליטה נמדדת **בעומק** וגם **בגובה הפנוי** מתחתיה.'),
]));

// 5. יישום: נגישות מהרחוב ועד התא
topics.push(T('access', 'יישום', 'מהחניה ועד המעלית: דרך נגישה', 'חלק ח\'1, נגישות בבניין ציבורי חדש: ארבע מידות שבודקים בתכנית.', [
  { style: 'poster', title: D.scenes.route.title, text: `רוחב **${v('route_width_min')}** לפחות, שיפוע עד **${v('route_slope_max')}**.`, ...img('route') },
  quote('8.50'),
  { style: 'post', title: 'רשימת בדיקה לתכנית', text: [`חניה נגישה: ${v('parking_width_min')} × ${v('parking_length_min')} לפחות.`, `דרך נגישה: ${v('route_width_min')} רוחב, שיפוע עד ${v('route_slope_max')}.`, `תא מעלית: ${v('lift_cab_width_min')} × ${v('lift_cab_depth_min')} לפחות.`, `תא שירותים: קוטר סיבוב ${v('toilet_turning_min')}.`, 'כל הערכים לאימות מול הנוסח.'].join('\n'), tags: ['תקנות_במרחב', 'נגישות'] },
  { style: 'fromto', title: 'מדרך נגישה אל כבש', fromLabel: 'דרך נגישה (8.50)', toLabel: 'כבש (3.2.10.2)', from: `שיפוע עד ${v('route_slope_max')}.`, to: `שיפוע עד ${v('ramp_slope_max')}, ורוחב ${v('ramp_width_min')} לפחות.`, text: body('8.50')[1] },
  { style: 'insight', title: 'כיסא גלגלים צריך מקום להסתובב', text: `==${first('8.140')}==` },
]));

// 6. יישום: חנות בקומת הקרקע
topics.push(T('shop', 'יישום', 'חנות מתחת לדירות', 'רוחב וגובה של חנות בקומת קרקע באזור מגורים: חלק ב\', סימן ב\'.', [
  { style: 'poster', title: D.scenes.shop.title, text: `רוחב **${v('shop_width_min')}** לפחות, גובה עד **${v('shop_height_max')}**.`, ...img('shop') },
  quote('2.07'),
  { style: 'insight', title: 'רוחב מינימלי, גובה מקסימלי', text: `==${first('2.06')}==` },
  { style: 'post', title: 'חנות ברחוב מגורים', text: [first('2.06'), first('2.07'), body('2.07')[1]].join('\n'), tags: ['תקנות_במרחב', 'חזית_מסחרית'] },
  haiku(['חלון ראווה', 'ומעליו שלוש קומות', 'של שכנים ישנים'], 'החנות **רחבה** מספיק, אבל **לא גבוהה** מדי מתחת לדירות.'),
]));

// 7. יישום: דלת המילוט
topics.push(T('door', 'יישום', 'דלת המילוט נפתחת החוצה', 'רוחב, גובה וכיוון פתיחה של דלת בדרך מוצא: חלק ג\', סימן א\'.', [
  { style: 'poster', title: D.scenes.doorSwing.title, text: 'הדלת נפתחת **בכיוון המילוט**.', ...img('doorSwing') },
  quote('3.2.1.6'),
  { style: 'insight', title: `${v('door_width_min')} של מעבר פנוי`, text: `==${first('3.2.1.3')}==` },
  { style: 'essay', title: 'מה מודדים בדלת', text: D.scenes.door.title, body: [body('3.2.1.3')[1], first('3.2.1.4'), body('3.2.1.6')[1]] },
  haiku(['יד על הידית', 'הכנף נפתחת החוצה', 'אל המדרגות'], 'בדרך מוצא הדלת נפתחת **החוצה**, אל עבר היציאה.'),
]));

// המאגר: כל סצנה במדריך, עם ההמחשה שלה ותמצית הסעיפים שלה
const partOf = (ref) => D.parts.find((p) => p.groups.some((g) => g.sections.some((s) => s.ref === ref)));
const pool = Object.entries(D.scenes).map(([id, s]) => {
  const refs = s.rules;
  const part = partOf(refs[0]);
  const zone = part.id === "חלק ג'" || part.id === "חלק ח'1" ? 'יישום' : part.id === "חלק ד'" ? 'הבנה' : 'ידע';
  const lines = refs.flatMap((r) => body(r));
  const c = [
    { style: 'poster', title: s.title, text: refs.map((r) => `סעיף ${r}`).join(', '), ...img(id) },
    quote(refs[0]),
    { style: 'post', title: s.title, text: lines.slice(0, 5).join('\n'), tags: ['תקנות_במרחב'] },
    { style: 'gradient', title: `${part.id}: ${part.title}`, text: 'התמציות נכתבו לעבודה ואינן הנוסח. הערכים לאימות מול הנוסח הרשמי.' },
  ];
  return T(`scene-${id}`, zone, s.title, `${part.id}, ${part.title} · ${refs.map((r) => rule(r).title).join(' · ')}`, c);
});

const out = {
  app: {
    id: 'takanot',
    name: D.meta.title,
    url: 'https://anat1969.github.io/takanot-merhav--GH/',
    repo: 'Anat1969/takanot-merhav--GH',
    description: `מדריך תלת־ממדי ל${D.meta.regulation}. כל כתבה בנויה מתמציות המדריך, והערכים בה לאימות מול הנוסח הרשמי.`,
    palette: { a: '#3b3f45', b: '#a32f27', c: '#767b83', s: '#474b51', accent: '#a32f27', marker: '#ecd9d5', paper: '#f3f4f5', paper2: '#e6e7e9', ink: '#1c1e21', bp: '#3b3f45', 'b-wash': '#f1e4e2', 's-wash': '#e9ebed' },
    article: { layout: 'blueprint' },
  },
  topics,
  pool,
};

// יחס כמו 1:20 ושבר כמו 2/3 מתהפכים בשורה עברית. בידוד כיווניות (LRI…PDI) שומר על הסדר בלי לשנות את הטקסט
const isolate = (x) => (typeof x === 'string' ? x.replace(/(?<![\u2066\w/:])(\d+[/:]\d+)(?![\w/:])/g, '\u2066$1\u2069') : Array.isArray(x) ? x.map(isolate) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, y]) => [k, k === 'image' ? y : isolate(y)])) : x);
out.topics = isolate(out.topics);
out.pool = isolate(out.pool);

// בדיקות התקן
const fail = [];
const words = (s) => String(s).replace(/[*=]/g, '').trim().split(/\s+/).length;
if (topics.length < 6) fail.push('פחות מ-6 נושאים');
if (new Set(topics.map((t) => t.zone)).size < 3) fail.push('חסר שלב');
for (const t of [...topics, ...pool]) {
  if (t.creations.length < 4 || t.creations.length > 6) fail.push(`${t.id}: ${t.creations.length} יצירות`);
  const st = t.creations.map((c) => c.style);
  if (new Set(st).size !== st.length) fail.push(`${t.id}: עיצוב חוזר`);
  if (words(t.title) > 8) fail.push(`${t.id}: כותרת ארוכה`);
  for (const c of t.creations) {
    if (c.title && words(c.title) > 8) fail.push(`${t.id}/${c.style}: כותרת ארוכה "${c.title}"`);
    if (/\{\w+\}/.test(JSON.stringify(c))) fail.push(`${t.id}/${c.style}: ערך שלא הוחלף`);
  }
}
if (pool.length < 20) fail.push(`מאגר קטן: ${pool.length}`);
if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/creations.json', JSON.stringify(out, null, 1) + '\n');
console.log(`creations.json: ${topics.length} נושאים, ${topics.reduce((n, t) => n + t.creations.length, 0)} יצירות, ${pool.length} במאגר`);
