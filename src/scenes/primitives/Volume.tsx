import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import type * as THREE from 'three';
import type { Volume as V } from '../model.ts';
import { CONTEXT_OPACITY, FINISH } from '../materials.ts';
import { useView } from './context.ts';

const GROW_MS = 520;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * נפח בחומר שלו, עם קו מתאר. כשהסצנה עולה הנפח "צומח" מהקרקע (delay לפי הסדר).
 * נפח רקע מוצג שקוף ומעומעם, כדי שהעיקר יבלוט.
 */
export function Volume({ v, delay = 0 }: { v: V; delay?: number }) {
  const { palette } = useView();
  const f = FINISH[v.kind];
  const opacity = v.context ? Math.min(f.opacity, CONTEXT_OPACITY) : f.opacity;
  const group = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);

  // delay שלילי: בלי הנפשה
  const still = delay < 0 || reduced();
  useEffect(() => {
    start.current = still ? null : performance.now() + delay;
    if (start.current === null && group.current) group.current.scale.y = 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const g = group.current;
    if (!g || start.current === null) return;
    const t = Math.min(1, Math.max(0, (performance.now() - start.current) / GROW_MS));
    g.scale.y = Math.max(0.001, 1 - (1 - t) ** 3);
    if (t >= 1) start.current = null;
  });

  // הצמיחה מתחילה בבסיס הנפח
  const [cx, cy, cz] = v.center;
  const base = cy - v.size[1] / 2;
  return (
    <group ref={group} position={[cx, base, cz]} scale={[1, still ? 1 : 0.001, 1]}>
      <mesh position={[0, v.size[1] / 2, 0]} rotation={v.rotation ?? [0, 0, 0]} castShadow={!v.context} receiveShadow>
        <boxGeometry args={v.size} />
        <meshStandardMaterial
          color={f.color}
          roughness={f.roughness}
          metalness={f.metalness}
          transparent={opacity < 1}
          opacity={opacity}
          depthWrite={opacity === 1}
          envMapIntensity={v.kind === 'glass' || v.kind === 'water' ? 1.4 : 0.6}
        />
        {v.context ? (
          <Edges threshold={30} color={palette.pencil} transparent opacity={0.45} />
        ) : (
          <Edges threshold={30} color="#3a3a3a" />
        )}
      </mesh>
    </group>
  );
}
