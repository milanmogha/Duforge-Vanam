// src/three/Hero3D.jsx
// Client wrapper that decides between the WebGL hero and an accessible poster
// fallback, and lazy-loads three.js so it never lands in the entry bundle.

import { Suspense, lazy, useEffect } from 'react';
import useDeviceTier, { tierSettings } from './useDeviceTier';
import { disposeWoodTexturesAsync as disposeWoodTextures } from './materialData';
import BRAND from '../config/brand';
import './hero3d.css';

const Canvas = lazy(() => import('@react-three/fiber').then((m) => ({ default: m.Canvas })));
const HeroScene = lazy(() => import('./HeroScene'));

// Static, dependency-free fallback (also the reduced-motion / no-WebGL path).
function HeroFallback() {
  return (
    <div className="vn-hero-fallback" role="img" aria-label={`${BRAND.name} — a material block on a dark stage`}>
      <div className="vn-hero-fallback__block" />
    </div>
  );
}

export default function Hero3D({ finishKey = 'walnut' }) {
  const { supported, tier, reducedMotion, ready } = useDeviceTier();
  const settings = tierSettings(tier, reducedMotion);

  // Free generated GPU textures when the hero leaves the tree.
  useEffect(() => () => disposeWoodTextures(), []);

  if (!ready) return <div className="vn-hero-canvas" aria-hidden="true" />;
  if (!supported) return <HeroFallback />;

  return (
    <div className="vn-hero-canvas">
      <Suspense fallback={<HeroFallback />}>
        <Canvas
          dpr={settings.dpr}
          shadows={settings.shadows}
          camera={{ position: [0.4, 0.85, 5.4], fov: 38 }}
          frameloop={reducedMotion ? 'demand' : 'always'}
          gl={{ antialias: tier === 'HIGH', powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <HeroScene settings={settings} finishKey={finishKey} reducedMotion={reducedMotion} />
          </Suspense>
        </Canvas>
      </Suspense>
    </div>
  );
}
