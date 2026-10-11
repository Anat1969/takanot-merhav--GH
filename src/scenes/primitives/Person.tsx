import { PERSON_HEIGHT } from '../fixtures.ts';
import type { Vec3 } from '../model.ts';
import { PERSON_FINISH } from '../materials.ts';

/** דמות בגובה 1.70 מ' לקנה מידה: רגליים, גוף וראש */
export function Person({ at }: { at: Vec3 }) {
  const h = PERSON_HEIGHT;
  const head = h * 0.065;
  const legs = h * 0.47;
  const torso = h - legs - head * 2;
  return (
    <group position={at}>
      <mesh position={[0, legs / 2, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.11, legs, 12]} />
        <meshStandardMaterial color={PERSON_FINISH.legs} roughness={0.7} />
      </mesh>
      <mesh position={[0, legs + torso / 2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.17, torso, 12]} />
        <meshStandardMaterial color={PERSON_FINISH.shirt} roughness={0.7} />
      </mesh>
      <mesh position={[0, legs + torso + head, 0]} castShadow>
        <sphereGeometry args={[head, 16, 12]} />
        <meshStandardMaterial color={PERSON_FINISH.skin} roughness={0.6} />
      </mesh>
    </group>
  );
}
