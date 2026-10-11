import { useMemo } from 'react';
import * as THREE from 'three';
import type { Surface as S } from '../model.ts';
import { groundOf, groundTexture } from '../materials.ts';
import { useView } from './context.ts';

/** קרקע במרקם לפי הייעוד: דשא, ריצוף, אספלט, רחבה. צל מחושב: דיו שקוף. */
export function Surface({ s }: { s: S }) {
  const { palette } = useView();
  const shape = useMemo(() => {
    const sh = new THREE.Shape();
    s.polygon.forEach(([x, z], i) => (i === 0 ? sh.moveTo(x, -z) : sh.lineTo(x, -z)));
    sh.closePath();
    return sh;
  }, [s.polygon]);
  const ground = groundOf(s);
  const map = useMemo(() => (ground ? groundTexture(ground) : undefined), [ground]);

  if (s.use === 'shadow') {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, s.y, 0]} renderOrder={1}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial color={palette.ink} transparent opacity={0.26} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    );
  }
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, s.y, 0]} receiveShadow>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial map={map} color="#ffffff" roughness={0.95} metalness={0} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} />
    </mesh>
  );
}
