// src/three/ProductViewer.jsx
// Interactive PDP 3D viewer: orbit / zoom, reset, fullscreen, and finish
// switching. Procedural geometry stands in for a product-specific GLB until real
// per-product models are uploaded via the admin 3D-asset manager (see
// docs/3D_STRATEGY.md). Falls back to the product photo when WebGL is absent.

import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import useDeviceTier, { tierSettings } from './useDeviceTier';
import { FINISHES, getWoodTexture, disposeWoodTextures } from './woodTexture';
import './productviewer.css';

const Canvas = lazy(() => import('@react-three/fiber').then((m) => ({ default: m.Canvas })));
const Drei = {
  OrbitControls: lazy(() => import('@react-three/drei').then((m) => ({ default: m.OrbitControls }))),
};

// Inner scene must import three at module load, so keep it in its own lazy chunk.
const ViewerScene = lazy(() => import('./ViewerScene'));

export default function ProductViewer({ posterSrc, productName = 'Product', defaultFinish = 'walnut', modelType = 'table' }) {
  const { supported, tier, reducedMotion, ready } = useDeviceTier();
  const settings = tierSettings(tier, reducedMotion);
  const [finish, setFinish] = useState(defaultFinish in FINISHES ? defaultFinish : 'walnut');
  const [resetKey, setResetKey] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => () => disposeWoodTextures(), []);

  const enterFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  };

  // Poster fallback (no WebGL / reduced-motion+save-data).
  if (ready && !supported) {
    return (
      <div className="vn-viewer vn-viewer--fallback">
        {posterSrc ? (
          <img src={posterSrc} alt={productName} />
        ) : (
          <div className="vn-viewer__noimg" role="img" aria-label={productName} />
        )}
        <p className="vn-viewer__note">3D preview needs WebGL. Showing the product image instead.</p>
      </div>
    );
  }

  return (
    <div className="vn-viewer" ref={wrapRef}>
      <div className="vn-viewer__stage" role="img" aria-label={`Interactive 3D preview of ${productName}`}>
        {ready && (
          <Suspense fallback={<div className="vn-viewer__loading">Loading 3D…</div>}>
            <Canvas
              key={resetKey}
              dpr={settings.dpr}
              camera={{ position: [2.4, 1.4, 2.8], fov: 40 }}
              gl={{ antialias: tier === 'HIGH' }}
            >
              <Suspense fallback={null}>
                <ViewerScene finishKey={finish} modelType={modelType} envResolution={settings.envResolution} />
                <Drei.OrbitControls
                  enablePan
                  enableDamping
                  minDistance={1.8}
                  maxDistance={6}
                  autoRotate={settings.autoRotate}
                  autoRotateSpeed={0.6}
                />
              </Suspense>
            </Canvas>
          </Suspense>
        )}
      </div>

      <div className="vn-viewer__controls">
        <div className="vn-viewer__finishes" role="group" aria-label="Choose finish">
          {Object.entries(FINISHES).map(([key, f]) => (
            <button
              key={key}
              type="button"
              className={`vn-swatch ${finish === key ? 'is-active' : ''}`}
              style={{ background: f.base }}
              aria-pressed={finish === key}
              aria-label={f.label}
              title={f.label}
              onClick={() => setFinish(key)}
            />
          ))}
        </div>
        <div className="vn-viewer__actions">
          <span className="vn-viewer__finishname">{FINISHES[finish].label}</span>
          <button type="button" onClick={() => setResetKey((k) => k + 1)}>Reset</button>
          <button type="button" onClick={enterFullscreen}>Fullscreen</button>
        </div>
      </div>
      <p className="vn-viewer__hint">Drag to rotate · scroll to zoom · finish swatches above</p>
    </div>
  );
}
