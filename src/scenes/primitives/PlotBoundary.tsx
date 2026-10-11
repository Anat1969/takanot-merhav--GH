import { Html, Line } from '@react-three/drei';
import type { Line as L } from '../model.ts';
import { useView } from './context.ts';

/** גבול מגרש בקו כחול מקווקו. קו בניין באדום מקווקו, עם שם. */
export function PlotBoundary({ line }: { line: L }) {
  const { palette, zoom } = useView();
  const color = line.kind === 'plot' ? palette.blueLine : line.kind === 'buildingLine' ? palette.limit : palette.pencil;
  const dash = 6 / zoom;
  return (
    <group>
      <Line points={line.points} color={color} lineWidth={1} dashed dashSize={dash} gapSize={dash * 0.6} />
      {line.label && (
        <Html position={line.points[line.points.length - 1]} center zIndexRange={[10, 0]} wrapperClass="scene-html">
          <span className="scene-label" data-tone="limit">{line.label}</span>
        </Html>
      )}
    </group>
  );
}
