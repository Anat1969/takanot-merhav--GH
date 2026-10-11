// מבנה data/takanot.json (docs/DATA-MODEL.md). הבדיקה רצה בזמן בנייה ובזמן טעינה.
import { z } from 'zod';

export const OpSchema = z.enum(['>=', '<=', '>', '<', '=']);
export const UnitSchema = z.enum(['m', 'm2', 'ratio', 'count']);

export const SourceSchema = z.object({
  checkedBy: z.string().min(1),
  checkedAt: z.string().min(1),
  citation: z.string().min(1),
});

export const ParamSchema = z.object({
  label: z.string().min(1),
  op: OpSchema,
  value: z.number(),
  unit: UnitSchema,
  rule: z.string().min(1),
  verified: z.boolean(),
  source: SourceSchema.nullable(),
});

export const RuleSchema = z.object({
  title: z.string().min(1),
  kind: z.string().min(1),
  scene: z.string().min(1),
  body: z.array(z.string().min(1)).min(1),
  keywords: z.array(z.string()),
});

export const SceneSchema = z.object({
  title: z.string().min(1),
  rules: z.array(z.string()).min(1),
});

export const SectionSchema = z.object({ ref: z.string().min(1), title: z.string().min(1) });
export const GroupSchema = z.object({ title: z.string().nullable(), sections: z.array(SectionSchema) });
export const PartSchema = z.object({ id: z.string().min(1), title: z.string().min(1), groups: z.array(GroupSchema) });

export const DataSchema = z.object({
  meta: z.object({
    title: z.string(),
    regulation: z.string(),
    source: z.object({ name: z.string(), url: z.string().url() }),
    extractedFrom: z.string(),
    note: z.string(),
  }),
  params: z.record(z.string(), ParamSchema),
  rules: z.record(z.string(), RuleSchema),
  scenes: z.record(z.string(), SceneSchema),
  parts: z.array(PartSchema),
  fixtures: z.record(z.string(), z.number()),
  sceneFixtures: z.record(z.string(), z.record(z.string(), z.number())),
  synonyms: z.array(z.array(z.string().min(1)).min(2)),
});

export type Data = z.infer<typeof DataSchema>;
export type Param = z.infer<typeof ParamSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type Part = z.infer<typeof PartSchema>;

/** בדיקות הצלבה (DATA-MODEL.md, "שלמות"). מחזיר רשימת שגיאות; ריקה = תקין */
export function crossCheck(d: Data): string[] {
  const errors: string[] = [];
  const refs = new Map<string, number>();
  for (const p of d.parts) for (const g of p.groups) for (const s of g.sections) refs.set(s.ref, (refs.get(s.ref) ?? 0) + 1);

  for (const [ref, r] of Object.entries(d.rules)) {
    for (const b of r.body) {
      for (const m of b.matchAll(/\{(\w+)\}/g)) if (!d.params[m[1]]) errors.push(`סעיף ${ref}: הפרמטר ${m[1]} לא קיים`);
    }
    if (!d.scenes[r.scene]) errors.push(`סעיף ${ref}: הסצנה ${r.scene} לא קיימת`);
    if (!refs.has(ref)) errors.push(`סעיף ${ref} לא מופיע בתוכן העניינים`);
  }
  for (const [key, p] of Object.entries(d.params)) {
    if (!d.rules[p.rule]) errors.push(`פרמטר ${key}: הסעיף ${p.rule} לא קיים`);
    if (p.verified && !p.source) errors.push(`פרמטר ${key}: מסומן כמאומת בלי מקור`);
  }
  for (const [id, s] of Object.entries(d.scenes)) {
    for (const ref of s.rules) if (d.rules[ref]?.scene !== id) errors.push(`סצנה ${id}: הסעיף ${ref} לא מצביע חזרה`);
    if (!d.sceneFixtures[id]) errors.push(`סצנה ${id}: חסרות מידות רקע`);
  }
  for (const [ref, n] of refs) if (n > 1) errors.push(`סעיף ${ref} מופיע ${n} פעמים בתוכן העניינים`);
  return errors;
}
