// src/three/RoomScene.jsx — a small interactive room: floor, walls, a sofa and a
// table, with switchable wood finish for the furniture and lighting presets.
// Procedural geometry only.
import { useMemo } from 'react';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { getWoodTexture, FINISHES } from './woodTexture';

export const ROOM_LIGHTING = {
  daylight: { label: 'Daylight', color: '#eaf0ff', intensity: 2.4, ambient: 0.55 },
  warm: { label: 'Warm interior', color: '#f4d9a8', intensity: 2.0, ambient: 0.4 },
  studio: { label: 'Neutral studio', color: '#ffffff', intensity: 1.7, ambient: 0.7 },
};

export default function RoomScene({ finishKey = 'walnut', lighting = 'warm', envResolution = 128, onHover }) {
  const map = useMemo(() => getWoodTexture(finishKey, 512), [finishKey]);
  const finish = FINISHES[finishKey] || FINISHES.walnut;
  const wood = useMemo(
    () => new THREE.MeshStandardMaterial({ map, roughness: finish.roughness, metalness: 0.05 }),
    [map, finish.roughness]
  );
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ map, roughness: 0.8 }), [map]);
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ded6c6', roughness: 0.95 }), []);
  const fabricMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8c8577', roughness: 0.9 }), []);
  const light = ROOM_LIGHTING[lighting] || ROOM_LIGHTING.warm;

  const hover = (key) => (e) => { e.stopPropagation(); onHover?.(key); };
  const out = () => onHover?.(null);

  return (
    <>
      <color attach="background" args={['#e9e3d6']} />
      <ambientLight intensity={light.ambient} />
      <directionalLight position={[5, 7, 4]} intensity={light.intensity} color={light.color} castShadow />
      <directionalLight position={[-5, 3, -4]} intensity={0.4} color={'#8fa0b8'} />

      {/* Floor */}
      <mesh material={floorMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
      </mesh>
      {/* Back + side wall */}
      <mesh material={wallMat} position={[0, 1, -3]}><boxGeometry args={[10, 4, 0.2]} /></mesh>
      <mesh material={wallMat} position={[-3.4, 1, 0]}><boxGeometry args={[0.2, 4, 6]} /></mesh>

      {/* Sofa (fabric seat + wood base) */}
      <group position={[-0.6, -0.55, 0.4]} onPointerOver={hover('sofa')} onPointerOut={out}>
        <mesh material={fabricMat} position={[0, 0.25, 0]}><boxGeometry args={[2.2, 0.5, 0.9]} /></mesh>
        <mesh material={fabricMat} position={[0, 0.6, -0.35]}><boxGeometry args={[2.2, 0.5, 0.2]} /></mesh>
        <mesh material={wood} position={[0, -0.05, 0]}><boxGeometry args={[2.3, 0.16, 1.0]} /></mesh>
      </group>

      {/* Coffee table (wood) */}
      <group position={[0.9, -0.7, 1.1]} onPointerOver={hover('table')} onPointerOut={out}>
        <mesh material={wood} position={[0, 0.34, 0]}><boxGeometry args={[1.1, 0.1, 0.7]} /></mesh>
        {[[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]].map(([x, z], i) => (
          <mesh key={i} material={wood} position={[x, 0.05, z]}><boxGeometry args={[0.08, 0.5, 0.08]} /></mesh>
        ))}
      </group>

      {envResolution > 0 && <Environment preset="apartment" resolution={envResolution} />}
      <ContactShadows position={[0, -0.99, 0]} opacity={0.5} scale={10} blur={2.5} far={4} />
    </>
  );
}
