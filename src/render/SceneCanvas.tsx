// רינדור מודל סצנה ב־React Three Fiber. הקובץ לא מחליט על מידות: הכול מגיע מ־SceneModel.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Edges, Html, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { extent, type Dim, type Finish, type P3, type SceneModel, type Tag } from '../scenes/model.ts';

export type View = 'plan' | 'section' | 'axon';

export interface LinkProps {
  activeKey: string | null;
  onHover: (key: string | null) => void;
  onPick: (key: string) => void;
}

interface Props extends LinkProps {
  model: SceneModel;
  sceneKey: string;
  view: View;
  resetToken: number;
  reduced: boolean;
}

// מאפייני מראה בלבד (לא מידות)
const GROW_MS = 650;
const FIT_MARGIN = 0.82;
const AXON_DIR = new THREE.Vector3(-0.62, 0.52, 0.62).normalize();
const CAMERA_DISTANCE = 80;
const SHADOW_MAP = 2048;
const PERSON = { bodyR: 0.17, legR: 0.14, headR: 0.12 };

interface Palette {
  mass: string; ground: string; edge: string; accent: string; glass: string;
  ink: string; ink3: string; limit: string; dark: boolean;
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark' ||
    (!document.documentElement.hasAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
  return {
    mass: v('--model-mass', '#eef0f1'), ground: v('--model-ground', '#dadde0'), edge: v('--model-edge', '#3b3f45'),
    accent: v('--model-accent', '#8c9198'), glass: v('--ink-4', '#a3a7ad'), ink: v('--ink', '#1c1e21'),
    ink3: v('--ink-3', '#767b83'), limit: v('--limit', '#a32f27'), dark,
  };
}

export function SceneCanvas(props: Props) {
  return (
    <Canvas
      shadows
      orthographic
      dpr={[1, 2.5]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
      camera={{ position: [0, 0, CAMERA_DISTANCE], zoom: 40, near: -500, far: 1000 }}
      aria-hidden="true"
    >
      <Content key={props.sceneKey} {...props} />
    </Canvas>
  );
}

function Content({ model, view, resetToken, reduced, activeKey, onHover, onPick }: Props) {
  const pal = useMemo(readPalette, []);
  const box = useMemo(() => extent(model), [model]);
  const grow = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  const [labelsOn, setLabelsOn] = useState(reduced);

  // התוויות מופיעות כשהנפחים סיימו לצמוח
  useEffect(() => {
    if (reduced) return;
    const id = window.setTimeout(() => setLabelsOn(true), GROW_MS);
    return () => window.clearTimeout(id);
  }, [reduced]);

  useFrame(() => {
    const g = grow.current;
    if (reduced || !g || g.scale.y >= 1) return;
    const now = performance.now();
    if (start.current === null) start.current = now;
    const t = Math.min(1, (now - start.current) / GROW_MS);
    g.scale.y = t >= 1 ? 1 : Math.max(0.001, 1 - (1 - t) ** 3);
  });

  const size = new THREE.Vector3(box.max[0] - box.min[0], box.max[1] - box.min[1], box.max[2] - box.min[2]);
  const center = new THREE.Vector3((box.max[0] + box.min[0]) / 2, (box.max[1] + box.min[1]) / 2, (box.max[2] + box.min[2]) / 2);
  const shadowSpan = size.length();

  return (
    <>
      <Rig box={box} view={view} resetToken={resetToken} reduced={reduced} />
      <hemisphereLight args={['#ffffff', pal.ground, pal.dark ? 0.55 : 0.8]} />
      <directionalLight
        position={[center.x - shadowSpan * 0.6, center.y + shadowSpan, center.z + shadowSpan * 0.5]}
        intensity={pal.dark ? 1.1 : 1.35}
        castShadow
        shadow-mapSize={[SHADOW_MAP, SHADOW_MAP]}
        shadow-bias={-0.0005}
        shadow-camera-left={-shadowSpan}
        shadow-camera-right={shadowSpan}
        shadow-camera-top={shadowSpan}
        shadow-camera-bottom={-shadowSpan}
        shadow-camera-far={shadowSpan * 4}
      >
        <object3D attach="target" position={center.toArray()} />
      </directionalLight>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[model.ground.center[0], 0, model.ground.center[1]]} receiveShadow>
        <planeGeometry args={model.ground.size} />
        <meshStandardMaterial color={pal.ground} roughness={1} />
      </mesh>

      <group ref={grow} scale={[1, reduced ? 1 : 0.001, 1]}>
        {model.volumes.map((v, i) => (
          <Box key={i} size={v.size} base={v.base} finish={v.finish} pal={pal} />
        ))}
        {model.people.map((p, i) => <Person key={i} at={p.at} H={p.height} pal={pal} />)}
      </group>

      {model.lines.map((l, i) => (
        <Line
          key={i}
          points={l.points}
          color={l.tone === 'buildingLine' ? pal.limit : l.tone === 'path' ? pal.ink : l.tone === 'plot' ? pal.ink : pal.ink3}
          lineWidth={l.tone === 'path' ? 2.5 : 1.2}
          dashed={l.dashed}
          dashSize={0.4}
          gapSize={0.22}
        />
      ))}

      {model.walker && !reduced && <Walker w={model.walker} color={pal.ink} />}

      {model.dims.map((d, i) => (
        <Dimension key={i} d={d} pal={pal} on={!!d.paramKey && d.paramKey === activeKey} show={labelsOn} onHover={onHover} onPick={onPick} />
      ))}
      {model.tags.map((t, i) => (
        <Label key={i} t={t} on={!!t.paramKey && t.paramKey === activeKey} show={labelsOn} onHover={onHover} onPick={onPick} />
      ))}

      <Controls view={view} />
    </>
  );
}

function Controls({ view }: { view: View }) {
  return <OrbitControls makeDefault enableDamping dampingFactor={0.12} screenSpacePanning enableRotate={view === 'axon'} />;
}

/** מציב את המצלמה לפי התצוגה ומתאים את הזום כך שכל הסצנה נכנסת */
function Rig({ box, view, resetToken, reduced }: { box: { min: P3; max: P3 }; view: View; resetToken: number; reduced: boolean }) {
  const { camera, size, controls } = useThree();
  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; z0: number; z1: number; t: number; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    const c = new THREE.Vector3((box.min[0] + box.max[0]) / 2, (box.min[1] + box.max[1]) / 2, (box.min[2] + box.max[2]) / 2);
    // OrbitControls מקבע את כיוון ה־up בזמן היצירה, ולכן הוא תמיד Y. בתכנית המצלמה מוטה מעט דרומה, כך שהצפון למעלה
    const dir = view === 'plan' ? new THREE.Vector3(0, 1, 0.001).normalize() : view === 'section' ? new THREE.Vector3(0, 0, 1) : AXON_DIR.clone();
    const up = new THREE.Vector3(0, 1, 0);
    const pos = c.clone().add(dir.clone().multiplyScalar(CAMERA_DISTANCE));

    // הטלה של פינות התחום על מישור המסך לחישוב הזום
    const probe = new THREE.OrthographicCamera();
    probe.position.copy(pos); probe.up.copy(up); probe.lookAt(c); probe.updateMatrixWorld();
    const right = new THREE.Vector3().setFromMatrixColumn(probe.matrixWorld, 0);
    const upv = new THREE.Vector3().setFromMatrixColumn(probe.matrixWorld, 1);
    let mx = 0, my = 0;
    for (const x of [box.min[0], box.max[0]]) for (const y of [box.min[1], box.max[1]]) for (const z of [box.min[2], box.max[2]]) {
      const p = new THREE.Vector3(x, y, z).sub(c);
      mx = Math.max(mx, Math.abs(p.dot(right)));
      my = Math.max(my, Math.abs(p.dot(upv)));
    }
    const zoom = FIT_MARGIN * Math.min(size.width / (2 * Math.max(mx, 0.5)), size.height / (2 * Math.max(my, 0.5)));

    const ctl = controls as unknown as OrbitControlsImpl | null;
    if (reduced || !ctl) {
      camera.position.copy(pos);
      camera.zoom = zoom;
      camera.lookAt(c);
      camera.updateProjectionMatrix();
      if (ctl) { ctl.target.copy(c); ctl.update(); }
      anim.current = null;
    } else {
      anim.current = { from: camera.position.clone(), to: pos, z0: camera.zoom, z1: zoom, t: 0, target: c };
      ctl.target.copy(c);
    }
    // הזום מחושב מחדש בשינוי גודל; המיקום רק בשינוי תצוגה או איפוס
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box, view, resetToken, size.width, size.height, controls]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (!a) return;
    a.t = Math.min(1, a.t + dt / 0.3);
    const e = 1 - (1 - a.t) ** 3;
    camera.position.lerpVectors(a.from, a.to, e);
    camera.zoom = a.z0 + (a.z1 - a.z0) * e;
    camera.lookAt(a.target);
    camera.updateProjectionMatrix();
    const ctl = controls as unknown as OrbitControlsImpl | null;
    if (ctl) ctl.update();
    if (a.t >= 1) anim.current = null;
  });
  return null;
}

function finishProps(f: Finish, pal: Palette) {
  switch (f) {
    case 'glass': return { color: pal.glass, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.36, depthWrite: false };
    case 'soft': return { color: pal.mass, roughness: 0.95, transparent: true, opacity: 0.38, depthWrite: false };
    case 'accent': return { color: pal.accent, roughness: 0.6, metalness: 0.15 };
    case 'patch': return { color: pal.accent, roughness: 1, transparent: true, opacity: 0.25, depthWrite: false };
    default: return { color: pal.mass, roughness: 0.9, metalness: 0 };
  }
}

function Box({ size, base, finish, pal }: { size: P3; base: P3; finish: Finish; pal: Palette }) {
  const solid = finish === 'mass' || finish === 'accent';
  return (
    <mesh position={[base[0], base[1] + size[1] / 2, base[2]]} castShadow={solid} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial {...finishProps(finish, pal)} />
      {finish !== 'patch' && (
        <Edges threshold={30} color={pal.edge} transparent opacity={solid ? 0.7 : 0.22} />
      )}
    </mesh>
  );
}

/** גובה הדמות מ־fixtures.personH; הפרופורציות כאן הן מראה בלבד */
function Person({ at, H, pal }: { at: P3; H: number; pal: Palette }) {
  return (
    <group position={at}>
      <mesh position={[0, H * 0.22, 0]} castShadow><cylinderGeometry args={[PERSON.legR, PERSON.legR * 0.85, H * 0.44, 14]} /><meshStandardMaterial color={pal.accent} roughness={0.7} /></mesh>
      <mesh position={[0, H * 0.56, 0]} castShadow><cylinderGeometry args={[PERSON.bodyR, PERSON.bodyR * 1.15, H * 0.52 - H * 0.2, 14]} /><meshStandardMaterial color={pal.accent} roughness={0.7} /></mesh>
      <mesh position={[0, H - PERSON.headR, 0]} castShadow><sphereGeometry args={[PERSON.headR, 16, 12]} /><meshStandardMaterial color={pal.accent} roughness={0.7} /></mesh>
    </group>
  );
}

function Walker({ w, color }: { w: NonNullable<SceneModel['walker']>; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const pts = useMemo(() => w.points.map((p) => new THREE.Vector3(...p)), [w]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    let rem = Math.min((clock.getElapsedTime() * w.speed) % (w.length + w.pause), w.length);
    for (let i = 1; i < pts.length; i++) {
      const seg = pts[i - 1].distanceTo(pts[i]);
      if (rem <= seg) { ref.current.position.lerpVectors(pts[i - 1], pts[i], seg ? rem / seg : 0); break; }
      rem -= seg;
    }
    ref.current.position.y = w.radius;
  });
  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[w.radius, 18, 14]} />
      <meshStandardMaterial color={color} roughness={0.4} />
    </mesh>
  );
}

interface LabelEvents { on: boolean; show: boolean; onHover: (k: string | null) => void; onPick: (k: string) => void }

function LabelEl({ text, tone, paramKey, at, on, show, onHover, onPick }: LabelEvents & { text: string; tone: string; paramKey: string | null; at: P3 }) {
  const linked = !!paramKey;
  return (
    <Html position={at} center zIndexRange={[20, 0]} wrapperClass="label-wrap" style={{ pointerEvents: linked ? 'auto' : 'none', direction: 'ltr' }}>
      {linked ? (
        <button
          type="button"
          className="dim-label"
          data-tone={tone}
          data-on={on || undefined}
          data-hidden={!show || undefined}
          onMouseEnter={() => onHover(paramKey)}
          onMouseLeave={() => onHover(null)}
          onFocus={() => onHover(paramKey)}
          onBlur={() => onHover(null)}
          onClick={() => onPick(paramKey)}
        >
          {text}
        </button>
      ) : (
        <span className="dim-label" data-tone={tone} data-hidden={!show || undefined}>{text}</span>
      )}
    </Html>
  );
}

function Dimension({ d, pal, ...ev }: { d: Dim; pal: Palette } & LabelEvents) {
  const parts = useMemo(() => {
    const A = new THREE.Vector3(...d.from), B = new THREE.Vector3(...d.to), O = new THREE.Vector3(...d.offset);
    const A2 = A.clone().add(O), B2 = B.clone().add(O);
    const segs: P3[][] = [[A2.toArray() as P3, B2.toArray() as P3]];
    if (O.lengthSq() > 0) {
      const n = O.clone().normalize().multiplyScalar(0.12);
      segs.push([A.clone().add(n).toArray() as P3, A2.clone().add(n).toArray() as P3]);
      segs.push([B.clone().add(n).toArray() as P3, B2.clone().add(n).toArray() as P3]);
    }
    const dir = B2.clone().sub(A2).normalize();
    const perp = O.lengthSq() > 0 ? O.clone().normalize() : new THREE.Vector3(0, 1, 0);
    const t = dir.clone().add(perp).normalize().multiplyScalar(0.14);
    for (const P of [A2, B2]) segs.push([P.clone().sub(t).toArray() as P3, P.clone().add(t).toArray() as P3]);
    return { segs, mid: A2.clone().add(B2).multiplyScalar(0.5).toArray() as P3 };
  }, [d]);
  const color = ev.on ? pal.ink : d.paramKey ? (d.limit ? pal.limit : pal.ink3) : pal.ink3;
  const tone = d.paramKey ? (d.limit ? 'limit' : 'ink') : 'pencil';
  return (
    <group>
      {parts.segs.map((s, i) => <Line key={i} points={s} color={color} lineWidth={ev.on ? 2.2 : 1.2} />)}
      <LabelEl text={d.label} tone={tone} paramKey={d.paramKey} at={parts.mid} {...ev} />
    </group>
  );
}

function Label({ t, ...ev }: { t: Tag } & LabelEvents) {
  return <LabelEl text={t.label} tone={t.tone} paramKey={t.paramKey} at={t.at} {...ev} />;
}
