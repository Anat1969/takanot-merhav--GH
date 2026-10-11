import { TREE } from '../fixtures.ts';
import type { Vec3 } from '../model.ts';
import { TREE_FINISH } from '../materials.ts';

/** עץ: גזע וצמרת של שלושה כדורים בגווני ירוק, כדי שייראה חי ולא גיאומטרי */
export function Tree({ at }: { at: Vec3 }) {
  const [x, y, z] = at;
  const r = TREE.crownRadius;
  const top = TREE.trunkHeight;
  const blobs: Array<[number, number, number, number, string]> = [
    [0, top + r * 0.75, 0, r, TREE_FINISH.crown[0]],
    [r * 0.45, top + r * 0.45, r * 0.25, r * 0.7, TREE_FINISH.crown[1]],
    [-r * 0.4, top + r * 0.55, -r * 0.3, r * 0.65, TREE_FINISH.crown[2]],
  ];
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, top / 2, 0]} castShadow>
        <cylinderGeometry args={[TREE.trunkRadius * 0.8, TREE.trunkRadius, top, 10]} />
        <meshStandardMaterial color={TREE_FINISH.trunk} roughness={0.9} />
      </mesh>
      {blobs.map(([bx, by, bz, br, c], i) => (
        <mesh key={i} position={[bx, by, bz]} castShadow>
          <icosahedronGeometry args={[br, 2]} />
          <meshStandardMaterial color={c} roughness={0.8} flatShading />
        </mesh>
      ))}
    </group>
  );
}
