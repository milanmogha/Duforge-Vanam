// src/pages/FinishLab.jsx — interactive material/finish laboratory (real WebGL).
import React, { Suspense, lazy, useEffect, useState } from 'react';
import useDeviceTier, { tierSettings } from '../three/useDeviceTier';
import { FINISHES, disposeWoodTexturesAsync as disposeWoodTextures } from '../three/materialData';
import { LIGHTING } from '../three/materialData';
import { useAuth } from '../hooks/useAuth';
import '../theme/pages.css';
import '../three/productviewer.css';

const Canvas = lazy(() => import('@react-three/fiber').then((m) => ({ default: m.Canvas })));
const OrbitControls = lazy(() => import('@react-three/drei').then((m) => ({ default: m.OrbitControls })));
const FinishLabScene = lazy(() => import('../three/FinishLabScene'));

function LabCanvas({ finishKey, grainVertical, lighting, settings, tier, resetKey }) {
  return (
    <Suspense fallback={<div className="vn-viewer__loading">Loading 3D…</div>}>
      <Canvas key={resetKey} dpr={settings.dpr} camera={{ position: [0, 0.4, 4.2], fov: 42 }}
        gl={{ antialias: tier === 'HIGH' }}>
        <Suspense fallback={null}>
          <FinishLabScene finishKey={finishKey} grainVertical={grainVertical} lighting={lighting}
            envResolution={settings.envResolution} />
          <OrbitControls enableDamping minDistance={2.4} maxDistance={7} autoRotate={settings.autoRotate} autoRotateSpeed={0.5} />
        </Suspense>
      </Canvas>
    </Suspense>
  );
}

export default function FinishLab() {
  const { supported, tier, reducedMotion, ready } = useDeviceTier();
  const settings = tierSettings(tier, reducedMotion);
  const { user } = useAuth();

  const [finishKey, setFinishKey] = useState('walnut');
  const [grainVertical, setGrainVertical] = useState(false);
  const [lighting, setLighting] = useState('warm');
  const [compare, setCompare] = useState(false);
  const [compareFinish, setCompareFinish] = useState('oak');
  const [resetKey, setResetKey] = useState(0);
  const [saved, setSaved] = useState(null);

  useEffect(() => () => disposeWoodTextures(), []);

  const saveConfig = () => {
    const cfg = { finishKey, grainVertical, lighting };
    if (user) {
      try { localStorage.setItem('vn_finishlab_saved', JSON.stringify(cfg)); } catch { /* ignore */ }
      setSaved('Saved to this device.');
    } else {
      setSaved('Sign in to save configurations.');
    }
    setTimeout(() => setSaved(null), 2500);
  };

  return (
    <div className="vn-page">
      <div className="vn-page__head">
        <p className="vn-page__eyebrow">Finish Lab</p>
        <h1 className="vn-page__title">Try finishes in real light</h1>
        <p className="vn-page__lead">
          Rotate a sample panel, switch finishes and lighting, and flip the grain. The material
          response updates live in WebGL — not just a label. Finishes shown are demo seed data.
        </p>
      </div>

      <div className="vn-page__body vn-grid vn-grid--2" style={{ alignItems: 'start' }}>
        <div className="vn-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="vn-viewer__stage" style={{ aspectRatio: '4 / 3' }}>
            {ready && supported
              ? <LabCanvas finishKey={finishKey} grainVertical={grainVertical} lighting={lighting}
                  settings={settings} tier={tier} resetKey={resetKey} />
              : <div className="vn-viewer__loading">3D preview needs WebGL. Controls still describe each finish.</div>}
          </div>
          {compare && ready && supported && (
            <div className="vn-viewer__stage" style={{ aspectRatio: '16 / 9', borderTop: '1px solid var(--vn-line)' }}>
              <LabCanvas finishKey={compareFinish} grainVertical={grainVertical} lighting={lighting}
                settings={settings} tier={tier} resetKey={resetKey + 1000} />
            </div>
          )}
        </div>

        <div className="vn-card">
          <span className="vn-label">Base finish</span>
          <div className="vn-row" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
            {Object.entries(FINISHES).map(([k, f]) => (
              <button key={k} className={`vn-chip ${finishKey === k ? 'is-active' : ''}`} style={{ flex: '0 0 auto' }}
                onClick={() => setFinishKey(k)}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: f.base, display: 'inline-block' }} />
                {f.label}
              </button>
            ))}
          </div>

          <span className="vn-label">Lighting</span>
          <div className="vn-row" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
            {Object.values(LIGHTING).map((l) => (
              <button key={l.key} className={`vn-chip ${lighting === l.key ? 'is-active' : ''}`} style={{ flex: '0 0 auto' }}
                onClick={() => setLighting(l.key)}>{l.label}</button>
            ))}
          </div>

          <span className="vn-label">Grain direction</span>
          <div className="vn-row" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
            <button className={`vn-chip ${!grainVertical ? 'is-active' : ''}`} style={{ flex: '0 0 auto' }}
              onClick={() => setGrainVertical(false)}>Horizontal</button>
            <button className={`vn-chip ${grainVertical ? 'is-active' : ''}`} style={{ flex: '0 0 auto' }}
              onClick={() => setGrainVertical(true)}>Vertical</button>
          </div>

          <span className="vn-label">Compare against</span>
          <div className="vn-row" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
            <button className={`vn-chip ${compare ? 'is-active' : ''}`} style={{ flex: '0 0 auto' }}
              onClick={() => setCompare((c) => !c)}>{compare ? 'Comparing' : 'Off'}</button>
            {compare && Object.entries(FINISHES).map(([k, f]) => (
              <button key={k} className={`vn-chip ${compareFinish === k ? 'is-active' : ''}`} style={{ flex: '0 0 auto' }}
                onClick={() => setCompareFinish(k)}>{f.label}</button>
            ))}
          </div>

          <div className="vn-row" style={{ marginTop: 18 }}>
            <button className="vn-btn vn-btn--ghost" onClick={() => setResetKey((k) => k + 1)}>Reset view</button>
            <button className="vn-btn vn-btn--brass" onClick={saveConfig}>Save configuration</button>
          </div>
          {saved && <p className="vn-note" style={{ marginTop: 10 }}>{saved}</p>}
        </div>
      </div>
    </div>
  );
}
