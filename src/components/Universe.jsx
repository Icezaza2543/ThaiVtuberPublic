import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Idol penlight colours; also used by the dashboard so a colour means the same platform everywhere.
export const PENLIGHT = ['#ff5fa2', '#43e0ff', '#ffe45c', '#b48cff', '#7dffb3', '#ff9f5c'];
const MAX_PLANETS = 24;
const MAX_MOONS = 48;

let dotTexture;
/** Soft round sprite so stars are dots, not squares. */
function roundDot() {
  if (dotTexture || typeof document === 'undefined') return dotTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.9)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  dotTexture = new THREE.CanvasTexture(c);
  return dotTexture;
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function Core({ onClick }) {
  const halo = useRef();
  useFrame(({ clock }) => {
    if (halo.current) halo.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.4) * 0.04);
  });
  return (
    <group>
      <mesh onClick={(e) => { e.stopPropagation(); onClick?.(); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = ''; }}>
        <sphereGeometry args={[2.1, 48, 48]} />
        <meshBasicMaterial color="#fff2f8" toneMapped={false} fog={false} />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[3.1, 48, 48]} />
        <meshBasicMaterial color="#ff5fa2" transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </mesh>
      <pointLight intensity={180} distance={90} color="#ffe6f2" />
    </group>
  );
}

function Planet({ agency, index, motion, onSelect, hovered, setHovered }) {
  const orbit = useRef();
  const spin = useRef();
  const rand = useMemo(() => seeded(index * 97 + agency.count), [index, agency.count]);
  const cfg = useMemo(() => {
    const radius = 6.5 + index * 0.95;
    return {
      radius,
      size: 0.28 + Math.sqrt(agency.count) * 0.13,
      speed: 0.9 / Math.pow(radius, 1.1),
      phase: index * 2.39996 + rand() * 0.4, // golden angle spreads planets around the sun
      tilt: (rand() - 0.5) * 0.35,
      color: PENLIGHT[index % PENLIGHT.length],
    };
  }, [agency.count, index, rand]);
  const moons = useMemo(() => {
    const n = Math.min(agency.count, MAX_MOONS);
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = cfg.size * 1.9 + (i % 3) * 0.12;
      pos.set([Math.cos(a) * r, (rand() - 0.5) * 0.25, Math.sin(a) * r], i * 3);
    }
    return pos;
  }, [agency.count, cfg.size, rand]);

  useFrame((_, dt) => {
    if (!motion) return;
    if (orbit.current) orbit.current.rotation.y += cfg.speed * dt;
    if (spin.current) spin.current.rotation.y += dt * 0.8;
  });

  const isHover = hovered === agency.name;
  return (
    <group rotation={[cfg.tilt, cfg.phase, 0]}>
      <group ref={orbit}>
        <group position={[cfg.radius, 0, 0]}>
          <mesh
            onPointerOver={(e) => { e.stopPropagation(); setHovered(agency.name); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHovered(null); document.body.style.cursor = ''; }}
            onClick={(e) => { e.stopPropagation(); onSelect(agency); }}
            scale={isHover ? 1.35 : 1}
          >
            <sphereGeometry args={[cfg.size, 32, 32]} />
            <meshStandardMaterial color={cfg.color} emissive={cfg.color} emissiveIntensity={isHover ? 0.9 : 0.35} roughness={0.45} />
          </mesh>
          <points ref={spin}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[moons, 3]} />
            </bufferGeometry>
            <pointsMaterial color="#f7f4ff" size={0.09} sizeAttenuation transparent opacity={0.85} />
          </points>
        </group>
      </group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[cfg.radius - 0.015, cfg.radius + 0.015, 128]} />
        <meshBasicMaterial color="#b48cff" transparent opacity={isHover ? 0.5 : 0.12} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Independent creators as a spiral disc. Each point is one creator; colour follows the platform mix. */
function IndependentGalaxy({ count, inner, platforms, total, motion, onPick }) {
  const ref = useRef();
  const { positions, colors } = useMemo(() => {
    const rand = seeded(count + 7);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const weights = platforms.slice(0, PENLIGHT.length).map((p) => p.count / Math.max(total, 1));
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const arm = i % 3;
      const t = Math.pow(rand(), 0.75);
      const r = inner + t * 40;
      const a = arm * ((Math.PI * 2) / 3) + t * 5.2 + (rand() - 0.5) * 0.7;
      pos.set([Math.cos(a) * r, (rand() - 0.5) * 2.4, Math.sin(a) * r], i * 3);
      let pick = rand() * sum;
      let k = 0;
      while (k < weights.length - 1 && pick > weights[k]) { pick -= weights[k]; k++; }
      c.set(PENLIGHT[k]);
      col.set([c.r, c.g, c.b], i * 3);
    }
    return { positions: pos, colors: col };
  }, [count, inner, platforms, total]);

  useFrame((_, dt) => {
    if (motion && ref.current) ref.current.rotation.y += dt * 0.012;
  });

  return (
    <points
      ref={ref}
      onClick={(e) => { e.stopPropagation(); onPick?.(e.index); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial map={roundDot()} alphaTest={0.05} vertexColors size={0.75} sizeAttenuation transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </points>
  );
}

export default function Universe({ stats, onSelectAgency, onHoverAgency, onPickIndie, onSun, showAgencies = true, showIndies = true }) {
  const [hovered, setHoveredName] = useState(null);
  const setHovered = (name) => {
    setHoveredName(name);
    onHoverAgency?.(name ? (stats.agencies || []).find((a) => a.name === name) : null);
  };
  const motion = useMemo(() => typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const agencies = (stats.agencies || []).slice(0, MAX_PLANETS);
  // Independents share the whole plane with the agencies: they are the majority, so they fill the sky.
  const inner = 4;
  return (
    <Canvas camera={{ position: [0, 30, 62], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true }} raycaster={{ params: { Points: { threshold: 0.5 } } }}>
      <color attach="background" args={['#0c0922']} />
      <fog attach="fog" args={['#0c0922', 70, 140]} />
      <ambientLight intensity={0.35} />
      <Stars radius={160} depth={60} count={4000} factor={4} saturation={0.6} fade speed={motion ? 0.6 : 0} />
      <Core onClick={onSun} />
      {showAgencies && agencies.map((a, i) => (
        <Planet key={a.name} agency={a} index={i} motion={motion} hovered={hovered} setHovered={setHovered} onSelect={onSelectAgency} />
      ))}
      {showIndies && stats.independent_count > 0 && (
        <IndependentGalaxy count={stats.independent_count} inner={inner} platforms={stats.platforms || []} total={stats.total_vtubers} motion={motion} onPick={onPickIndie} />
      )}
      <OrbitControls enablePan={false} enableDamping minDistance={14} maxDistance={120} autoRotate={motion && !hovered} autoRotateSpeed={0.35} maxPolarAngle={Math.PI * 0.85} />
    </Canvas>
  );
}
