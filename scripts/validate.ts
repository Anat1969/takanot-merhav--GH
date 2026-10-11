// בדיקת data/takanot.json (zod והצלבות) וסריקת src/scenes לליטרלים מספריים. רץ לפני tsc ו־vite build.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { crossCheck, DataSchema } from '../src/data/schema.ts';

let failed = false;
const fail = (msg: string) => { console.error('✗ ' + msg); failed = true; };

const raw = JSON.parse(readFileSync('data/takanot.json', 'utf8'));
const parsed = DataSchema.safeParse(raw);
if (!parsed.success) {
  fail('הסכמה נכשלה:\n' + parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n'));
} else {
  for (const e of crossCheck(parsed.data)) fail(e);
}

// אף מספר מידה בקוד הסצנות: מותר רק 0, 1, 2 ו־0.5 (DATA-MODEL.md, בדיקה 7)
const ALLOWED = new Set(['0', '1', '2', '0.5', '.5']);
const dir = 'src/scenes';
for (const f of readdirSync(dir)) {
  if (!/\.tsx?$/.test(f) || /\.test\.tsx?$/.test(f)) continue;
  const code = readFileSync(join(dir, f), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, "''");
  for (const m of code.matchAll(/(?<![\w.$])(\d+(?:\.\d+)?|\.\d+)(?![\w.])/g)) {
    if (!ALLOWED.has(m[1])) {
      const line = code.slice(0, m.index).split('\n').length;
      fail(`${f}:${line}: מספר ${m[1]} בקוד הסצנה. יש להעביר ל־sceneFixtures`);
    }
  }
}

if (failed) process.exit(1);
const d = parsed.data!;
const unverified = Object.values(d.params).filter((p) => !p.verified).length;
console.log(`✓ data/takanot.json תקין: ${Object.keys(d.params).length} פרמטרים (${unverified} לאימות), ${Object.keys(d.rules).length} סעיפים עם תמצית, ${Object.keys(d.scenes).length} סצנות`);
