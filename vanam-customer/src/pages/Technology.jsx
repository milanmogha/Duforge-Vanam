// src/pages/Technology.jsx — hosts the interactive exploded material view.
import React, { Suspense, lazy, useEffect, useState } from 'react';
import useDeviceTier, { tierSettings } from '../three/useDeviceTier';
import { LAYERS } from '../three/materialData';
import { FINISHES, disposeWoodTexturesAsync as disposeWoodTextures } from '../three/materialData';
import '../theme/pages.css';
import '../three/productviewer.css';

const Canvas = lazy(() => import('@react-three/fiber').then((m) => ({ default: m.Canvas })));
const OrbitControls = lazy(() => import('@react-three/drei').then((m) => ({ default: m.OrbitControls })));
const ExplodedScene = lazy(() => import('../three/ExplodedScene'));

export default function Technology() {
  const { supported, tier, reducedMotion, ready } = useDeviceTier();
  const settings = tierSettings(tier, reducedMotion);
  const [exploded, setExploded] = useState(false);
  const [finishKey, setFinishKey] = useState('walnut');
  const [hovered, setHovered] = useState(null);

  useEffect(() => () => disposeWoodTextures(), []);
  // Reduced-motion users get the exploded state statically (no animation lerp visible jump is fine).

  return (
    <div className="vn-page">
      <div className="vn-page__head">
        <p className="vn-page__eyebrow">Technology</p>
        <h1 className="vn-page__title">How an engineered panel is built</h1>
        <p className="vn-page__lead">
          An interactive cross-section. Separate the layers to see how a surface is composed.
          This construction is <strong>illustrative</strong> — a demo, not a spec for any specific product.
        </p>
      </div>

      <div className="vn-page__body vn-grid vn-grid--2" style={{ alignItems: 'start' }}>
        <div className="vn-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="vn-viewer__stage" style={{ aspectRatio: '4 / 3' }}>
            {ready && supported ? (
              <Suspense fallback={<div className="vn-viewer__loading">Loading 3D…</div>}>
                <Canvas dpr={settings.dpr} camera={{ position: [3, 1.6, 3.4], fov: 42 }} gl={{ antialias: tier === 'HIGH' }}>
                  <Suspense fallback={null}>
                    <ExplodedScene exploded={exploded || reducedMotion ? exploded : exploded}
                      finishKey={finishKey} envResolution={settings.envResolution} onHover={setHovered} />
                    <OrbitControls enableDamping minDistance={2.5} maxDistance={8}
                      autoRotate={settings.autoRotate && !exploded} autoRotateSpeed={0.5} />
                  </Suspense>
                </Canvas>
              </Suspense>
            ) : (
              <div className="vn-viewer__loading">3D needs WebGL. The layer list on the right describes the construction.</div>
            )}
          </div>
        </div>

        <div className="vn-card">
          <div className="vn-row" style={{ marginBottom: 18 }}>
            <button className="vn-btn vn-btn--brass" onClick={() => setExploded((e) => !e)}>
              {exploded ? 'Reassemble' : 'Separate layers'}
            </button>
            <button className="vn-btn vn-btn--ghost" onClick={() => setExploded(false)}>Reset</button>
          </div>

          <span className="vn-label">Finish</span>
          <div className="vn-row" style={{ flexWrap: 'wrap', marginBottom: 20 }}>
            {Object.entries(FINISHES).map(([k, f]) => (
              <button key={k} className={`vn-chip ${finishKey === k ? 'is-active' : ''}`} style={{ flex: '0 0 auto' }}
                onClick={() => setFinishKey(k)}>{f.label}</button>
            ))}
          </div>

          {/* Accessible text equivalent of the 3D layers (top → bottom) */}
          <span className="vn-label">Layers (top to bottom)</span>
          <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
            {[...LAYERS].reverse().map((l) => (
              <li key={l.key}
                style={{
                  padding: '10px 12px', marginBottom: 8, borderRadius: 6,
                  border: '1px solid var(--vn-line)',
                  background: hovered === l.key ? 'rgba(185,143,82,0.12)' : 'transparent',
                }}>
                <strong style={{ color: 'var(--vn-ink)' }}>{l.label}</strong>
              </li>
            ))}
          </ul>
          <p className="vn-note" style={{ marginTop: 12 }}>Hover a layer in 3D to highlight it here.</p>
        </div>
      </div>
    </div>
  );
}
