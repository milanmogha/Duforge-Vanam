// src/three/HeroScene.jsx
// "Furniture in its element": a furniture vignette on a carbon stage —
// an accent chair as the hero piece, a low table and a bookshelf giving the
// composition depth. Pieces settle into place on entrance (no continuous
// rotation), then respond to the pointer with a slow, weighted parallax.
// Pure procedural geometry + generated wood textures.

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Chair, Table, Shelf, FLOOR } from './Furniture';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function Vignette({ finishKey = 'walnut', reducedMotion = false }) {
  const group = useRef();
  const chairRef = useRef();
  const tableRef = useRef();
  const shelfRef = useRef();
  const startTime = useRef(null);
  const pointer = useThree((s) => s.pointer);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    if (startTime.current === null) startTime.current = t;
    const elapsed = t - startTime.current;

    // ── Entrance: pieces rise and settle, staggered. ──
    const settle = (ref, delay, fromY, fromRot) => {
      if (!ref.current) return;
      const D = 1.5;
      const p = reducedMotion ? 1 : Math.min(Math.max(elapsed - delay, 0) / D, 1);
      const e = easeOutCubic(p);
      ref.current.position.y = THREE.MathUtils.lerp(fromY, 0, e);
      ref.current.rotation.y = THREE.MathUtils.lerp(fromRot, 0, e);
    };
    settle(chairRef, 0.0, -0.5, -0.5);
    settle(tableRef, 0.25, -0.7, 0.4);
    settle(shelfRef, 0.45, -0.9, -0.25);

    // ── Idle: weighted pointer parallax. No spin. ──
    if (!reducedMotion) {
      const rx = pointer.y * 0.06;
      const ry = -pointer.x * 0.22 + 0.42; // rests slightly turned toward copy
      group.current.rotation.x += (rx - group.current.rotation.x) * 0.04;
      group.current.rotation.y += (ry - group.current.rotation.y) * 0.04;
    } else {
      group.current.rotation.y = 0.42;
    }
  });

  return (
    <group ref={group} position={[0.85, 0.15, 0]}>
      {/* Hero piece: accent chair, turned toward the viewer */}
      <group ref={chairRef}>
        <group position={[0.15, 0, 0.55]} scale={[1.28, 1.28, 1.28]}>
          <Chair finishKey={finishKey} angle={-0.55} />
        </group>
      </group>
      {/* Low table beside it */}
      <group ref={tableRef}>
        <group position={[-0.95, 0, -0.15]} scale={[0.92, 0.92, 0.92]}>
          <Table finishKey={finishKey} low />
        </group>
      </group>
      {/* Bookshelf giving background depth */}
      <group ref={shelfRef}>
        <group position={[-0.15, 0.05, -1.55]} scale={[1.05, 1.05, 1.05]} rotation={[0, 0.12, 0]}>
          <Shelf finishKey={finishKey} />
        </group>
      </group>
    </group>
  );
}

export default function HeroScene({ settings, finishKey = 'walnut', reducedMotion = false }) {
  return (
    <>
      {/* Carbon stage with depth fog */}
      <color attach="background" args={['#17130d']} />
      <fog attach="fog" args={['#17130d', 7.5, 14]} />

      <ambientLight intensity={0.26} />
      {/* Warm key light — high right, like late-afternoon workshop light */}
      <directionalLight
        position={[4.5, 6, 3]}
        intensity={2.3}
        color={'#ffdfae'}
        castShadow={settings.shadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* Cool rim from behind for silhouette separation */}
      <directionalLight position={[-6, 3, -5]} intensity={0.85} color={'#7f8ea3'} />
      {/* Low warm bounce */}
      <pointLight position={[0, -1.5, 3]} intensity={0.4} color={'#b08046'} />

      <Vignette finishKey={finishKey} reducedMotion={reducedMotion} />

      {settings.envResolution > 0 && <Environment preset="apartment" resolution={settings.envResolution} />}
      {settings.shadows && (
        <ContactShadows position={[0.85, FLOOR + 0.14, 0]} opacity={0.5} scale={11} blur={2.6} far={5} />
      )}
    </>
  );
}
