// src/three/FinishLabScene.jsx — a showcase panel with switchable finish,
// grain direction and lighting preset. Rendered inside a <Canvas>.
import { useMemo } from 'react';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { getWoodTexture, FINISHES } from './woodTexture';

import { LIGHTING } from './materialData';
export { LIGHTING };

export default function FinishLabScene({ finishKey = 'walnut', grainVertical = false, lighting = 'warm', envResolution = 128 }) {
  const map = useMemo(() => {
    const t = getWoodTexture(finishKey, 512).clone();
    t.needsUpdate = true;
    t.center.set(0.5, 0.5);
    t.rotation = grainVertical ? Math.PI / 2 : 0;
    return t;
  }, [finishKey, grainVertical]);

  const finish = FINISHES[finishKey] || FINISHES.walnut;
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ map, roughness: finish.roughness, metalness: 0.05 }),
    [map, finish.roughness]
  );
  const light = LIGHTING[lighting] || LIGHTING.warm;

  return (
    <>
      <color attach="background" args={['#efeadf']} />
      <ambientLight intensity={light.ambient} />
      <directionalLight position={[4, 6, 3]} intensity={light.intensity} color={light.color} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color={'#8fa0b8'} />

      {/* A thick sample panel */}
      <mesh material={material} rotation={[-0.15, 0.5, 0]}>
        <boxGeometry args={[2.6, 1.7, 0.18]} />
      </mesh>

      {envResolution > 0 && <Environment preset="apartment" resolution={envResolution} />}
      <ContactShadows position={[0, -1.0, 0]} opacity={0.4} scale={7} blur={2.4} far={3} />
    </>
  );
}
