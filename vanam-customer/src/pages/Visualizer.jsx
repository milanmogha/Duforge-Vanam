// src/pages/Visualizer.jsx — interactive 3D room with finish, lighting and
// camera presets, plus hotspot highlighting.
import React, { Suspense, lazy, useEffect, useState } from 'react';
import useDeviceTier, { tierSettings } from '../three/useDeviceTier';
import { ROOM_LIGHTING } from '../three/materialData';
import { FINISHES, disposeWoodTexturesAsync as disposeWoodTextures } from '../three/materialData';
import '../theme/pages.css';
import '../three/productviewer.css';

const Canvas = lazy(() => import('@react-three/fiber').then((m) => ({ default: m.Canvas })));
const OrbitControls = lazy(() => import('@react-three/drei').then((m) => ({ default: m.OrbitControls })));
const RoomScene = lazy(() => import('../three/RoomScene'));

const CAMERAS = {
  overview: { label: 'Overview', pos: [4.5, 3, 5] },
  wall: { label: 'Wall', pos: [0, 1.5, 6] },
  detail: { label: 'Detail', pos: [1.6, 0.6, 2.6] },
  top: { label: 'Top-down', pos: [0.5, 7, 0.6] },
};

export default function Visualizer() {
  const { supported, tier, reducedMotion, ready } = useDeviceTier();
  const settings = tierSettings(tier, reducedMotion);
  const [finishKey, setFinishKey] = useState('walnut');
  const [lighting, setLighting] = useState('warm');
  const [camera, setCamera] = useState('overview');
  const [hovered, setHovered] = useState(null);

  useEffect(() => () => disposeWoodTextures(), []);

  return (
    <div className="vn-page">
      <div className="vn-page__head">
        <p className="vn-page__eyebrow">Visualizer</p>
        <h1 className="vn-page__title">See it in a room</h1>
        <p className="vn-page__lead">
          A real interactive room scene. Switch the furniture finish, change the lighting, and move
          between camera presets. Demo scene with procedural geometry.
        </p>
      </div>

      <div className="vn-page__body vn-grid vn-grid--2" style={{ alignItems: 'start' }}>
        <div className="vn-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="vn-viewer__stage" style={{ aspectRatio: '16 / 10' }}>
            {ready && supported ? (
              <Suspense fallback={<div className="vn-viewer__loading">Loading room…</div>}>
                {/* Remount on camera preset change so the new position takes effect. */}
                <Canvas key={camera} dpr={settings.dpr} shadows={settings.shadows}
                  camera={{ position: CAMERAS[camera].pos, fov: 45 }} gl={{ antialias: tier === 'HIGH' }}>
                  <Suspense fallback={null}>
                    <RoomScene finishKey={finishKey} lighting={lighting}
                      envResolution={settings.envResolution} onHover={setHovered} />
                    <OrbitControls enableDamping minDistance={2} maxDistance={12} maxPolarAngle={Math.PI / 2.05} />
                  </Suspense>
                </Canvas>
              </Suspense>
            ) : (
              <div className="vn-viewer__loading">3D needs WebGL. This scene has no non-visual equivalent beyond the controls.</div>
            )}
          </div>
        </div>

        <div className="vn-card">
          <span className="vn-label">Furniture finish</span>
          <div className="vn-row" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
            {Object.entries(FINISHES).map(([k, f]) => (
              <button key={k} className={`vn-chip ${finishKey === k ? 'is-active' : ''}`} style={{ flex: '0 0 auto' }}
                onClick={() => setFinishKey(k)}>{f.label}</button>
            ))}
          </div>

          <span className="vn-label">Lighting</span>
          <div className="vn-row" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
            {Object.entries(ROOM_LIGHTING).map(([k, l]) => (
              <button key={k} className={`vn-chip ${lighting === k ? 'is-active' : ''}`} style={{ flex: '0 0 auto' }}
                onClick={() => setLighting(k)}>{l.label}</button>
            ))}
          </div>

          <span className="vn-label">Camera</span>
          <div className="vn-row" style={{ flexWrap: 'wrap' }}>
            {Object.entries(CAMERAS).map(([k, c]) => (
              <button key={k} className={`vn-chip ${camera === k ? 'is-active' : ''}`} style={{ flex: '0 0 auto' }}
                onClick={() => setCamera(k)}>{c.label}</button>
            ))}
          </div>

          <p className="vn-note" style={{ marginTop: 16 }}>
            {hovered ? `Focused: ${hovered}` : 'Hover the sofa or table in the scene.'}
          </p>
        </div>
      </div>
    </div>
  );
}
