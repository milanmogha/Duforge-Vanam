// src/three/ExplodedScene.jsx — an illustrative engineered-panel cross-section.
// Layers separate/reassemble with animation. DEMO/illustrative construction —
// not a claim about any specific product's real build.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { getWoodTexture } from './woodTexture';
import { LAYERS } from './materialData';

// Layer construction data lives in materialData (three-free); re-exported
// so existing importers keep working.
export { LAYERS };

function Layer({ layer, exploded, finishKey, onHover }) {
  const ref = useRef();
  const map = useMemo(() => (layer.color ? null : getWoodTexture(finishKey, 256)), [layer.color, finishKey]);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial(layer.color ? { color: layer.color, roughness: 0.7 } : { map, roughness: 0.5 }),
    [layer.color, map]
  );
  const targetY = layer.y + (exploded ? layer.gap : 0);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.y += (targetY - ref.current.position.y) * 0.12;
  });

  return (
    <mesh
      ref={ref}
      position={[0, layer.y, 0]}
      material={material}
      onPointerOver={(e) => { e.stopPropagation(); onHover?.(layer.key); }}
      onPointerOut={() => onHover?.(null)}
    >
      <boxGeometry args={[2.6, layer.thickness, 1.6]} />
    </mesh>
  );
}

export default function ExplodedScene({ exploded, finishKey = 'walnut', envResolution = 128, onHover }) {
  return (
    <>
      <color attach="background" args={['#efeadf']} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 4]} intensity={1.9} color={'#f4d9a8'} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color={'#8fa0b8'} />
      <group rotation={[0.1, 0.5, 0]}>
        {LAYERS.map((l) => (
          <Layer key={l.key} layer={l} exploded={exploded} finishKey={finishKey} onHover={onHover} />
        ))}
      </group>
      {envResolution > 0 && <Environment preset="apartment" resolution={envResolution} />}
    </>
  );
}
