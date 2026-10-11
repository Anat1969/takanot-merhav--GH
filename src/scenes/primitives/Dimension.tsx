import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { sameTarget, useLink } from '../../ui/links.ts';
import type { Dim, Tag } from '../model.ts';
import { useView } from './context.ts';

type P3 = [number, number, number];
const v3 = (p: readonly number[]) => new THREE.Vector3(p[0], p[1], p[2]);
const arr = (v: THREE.Vector3): P3 => [v.x, v.y, v.z];

function Label({ ruleId, paramKey, text, limit, position }: {
  ruleId: string;
  paramKey: string;
  text: string;
  limit: boolean;
  position: P3;
}) {
  const link = useLink();
  const target = { ruleId, paramKey };
  const active = sameTarget(link.current, target) || sameTarget(link.pinned, target);
  return (
    <Html position={position} center zIndexRange={[20, 10]} wrapperClass="scene-html">
      <button
        type="button"
        className="scene-label"
        data-tone={limit ? 'limit' : 'ink'}
        data-active={active || undefined}
        data-param={paramKey}
        onMouseEnter={() => link.set(target)}
        onMouseLeave={() => link.set(null)}
        onFocus={() => link.set(target)}
        onBlur={() => link.set(null)}
        onClick={() => link.pin(sameTarget(link.pinned, target) ? null : target)}
      >
        {text}
      </button>
    </Html>
  );
}

/**
 * קו מידה של 1px עם סימני חיתוך אלכסוניים של 45°, קווי עזר במרחק 2px מהאובייקט והערך על הקו.
 * מידה מגבילה באדום. מידה שמקבילה לכיוון המבט מוסתרת.
 */
export function Dimension({ d }: { d: Dim }) {
  const { palette, zoom, viewDir } = useView();
  const from = v3(d.from);
  const to = v3(d.to);
  const off = v3(d.offset);
  const along = to.clone().sub(from);
  const len = along.length();
  const projected = along.clone().sub(viewDir.clone().multiplyScalar(along.dot(viewDir))).length();
  if (len === 0 || projected < len * 0.3) return null;

  const px = 1 / zoom;
  const dir = along.clone().normalize();
  const offDir = off.length() > 0 ? off.clone().normalize() : new THREE.Vector3().crossVectors(dir, viewDir).normalize();
  const a = from.clone().add(off);
  const b = to.clone().add(off);
  const color = d.limit ? palette.limit : palette.ink;
  const tick = dir.clone().add(offDir).normalize().multiplyScalar(5 * px);

  const lines: P3[][] = [[arr(a), arr(b)]];
  if (off.length() > 0) {
    const gap = offDir.clone().multiplyScalar(2 * px);
    const over = offDir.clone().multiplyScalar(4 * px);
    lines.push([arr(from.clone().add(gap)), arr(a.clone().add(over))]);
    lines.push([arr(to.clone().add(gap)), arr(b.clone().add(over))]);
  }
  for (const p of [a, b]) lines.push([arr(p.clone().sub(tick)), arr(p.clone().add(tick))]);

  return (
    <group>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color={color} lineWidth={1} />
      ))}
      <Label ruleId={d.ruleId} paramKey={d.paramKey} text={d.label} limit={d.limit} position={arr(a.clone().add(b).multiplyScalar(0.5))} />
    </group>
  );
}

/** ערך שאינו אורך: תווית במקום שאליו הוא מתייחס */
export function TagLabel({ t }: { t: Tag }) {
  return <Label ruleId={t.ruleId} paramKey={t.paramKey} text={t.label} limit={t.limit} position={t.at as P3} />;
}

/** תווית איכותית בעיפרון */
export function PencilLabel({ text, at }: { text: string; at: P3 }) {
  return (
    <Html position={at} center zIndexRange={[15, 5]} wrapperClass="scene-html">
      <span className="scene-label" data-tone="pencil">{text}</span>
    </Html>
  );
}
