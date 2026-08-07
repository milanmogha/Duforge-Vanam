// src/pages/Calculator.jsx — deterministic project coverage/quantity estimator.
import React, { useMemo, useState } from 'react';
import '../theme/pages.css';

const toMeters = (v, unit) => (unit === 'ft' ? v * 0.3048 : v);

export default function Calculator() {
  const [unit, setUnit] = useState('m'); // 'm' | 'ft'
  const [surfaces, setSurfaces] = useState([{ width: 4, height: 3 }]);
  const [panelW, setPanelW] = useState(1.2);
  const [panelH, setPanelH] = useState(2.4);
  const [wastage, setWastage] = useState(10);
  const [pricePerPanel, setPricePerPanel] = useState('');

  const setSurface = (i, key, val) => {
    const next = surfaces.slice();
    next[i] = { ...next[i], [key]: val };
    setSurfaces(next);
  };
  const addSurface = () => setSurfaces([...surfaces, { width: 3, height: 3 }]);
  const removeSurface = (i) => setSurfaces(surfaces.filter((_, idx) => idx !== i));

  const result = useMemo(() => {
    // All maths in metres; convert for display back to the chosen unit's area label.
    const areaM2 = surfaces.reduce((sum, s) => {
      const w = toMeters(Math.max(0, Number(s.width) || 0), unit);
      const h = toMeters(Math.max(0, Number(s.height) || 0), unit);
      return sum + w * h;
    }, 0);
    const panelArea = toMeters(Math.max(0.01, Number(panelW) || 0.01), unit) *
      toMeters(Math.max(0.01, Number(panelH) || 0.01), unit);
    const wastMult = 1 + Math.max(0, Number(wastage) || 0) / 100;
    const rawPanels = panelArea > 0 ? areaM2 / panelArea : 0;
    const panels = Math.ceil(rawPanels * wastMult);
    const wastageArea = panels * panelArea - areaM2;
    const price = Number(pricePerPanel) > 0 ? panels * Number(pricePerPanel) : null;
    return { areaM2, panels, wastageArea: Math.max(0, wastageArea), price };
  }, [surfaces, panelW, panelH, wastage, pricePerPanel, unit]);

  const areaLabel = unit === 'ft' ? 'ft²' : 'm²';
  const areaDisplay = (m2) => (unit === 'ft' ? m2 / 0.092903 : m2);
  const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
  const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="vn-page">
      <div className="vn-page__head">
        <p className="vn-page__eyebrow">Tools</p>
        <h1 className="vn-page__title">Project calculator</h1>
        <p className="vn-page__lead">
          Estimate how much panelling or surface material a space needs. All figures are estimates —
          confirm with our team before ordering.
        </p>
      </div>

      <div className="vn-page__body vn-grid vn-grid--2">
        <div className="vn-card">
          <div className="vn-field">
            <span className="vn-label">Units</span>
            <div className="vn-row" style={{ flexWrap: 'nowrap' }}>
              {['m', 'ft'].map((u) => (
                <button key={u} type="button" className={`vn-chip ${unit === u ? 'is-active' : ''}`}
                  onClick={() => setUnit(u)} style={{ flex: 1, justifyContent: 'center' }}>
                  {u === 'm' ? 'Metric (m)' : 'Imperial (ft)'}
                </button>
              ))}
            </div>
          </div>

          <span className="vn-label">Surfaces ({unit})</span>
          {surfaces.map((s, i) => (
            <div className="vn-row" key={i} style={{ marginBottom: 10, alignItems: 'flex-end' }}>
              <div>
                <span className="vn-label">Width</span>
                <input className="vn-input" type="number" min="0" step="0.1" value={s.width}
                  onChange={(e) => setSurface(i, 'width', e.target.value)} />
              </div>
              <div>
                <span className="vn-label">Height</span>
                <input className="vn-input" type="number" min="0" step="0.1" value={s.height}
                  onChange={(e) => setSurface(i, 'height', e.target.value)} />
              </div>
              {surfaces.length > 1 && (
                <button className="vn-linkbtn" style={{ flex: '0 0 auto' }} onClick={() => removeSurface(i)}>Remove</button>
              )}
            </div>
          ))}
          <button className="vn-linkbtn" onClick={addSurface}>+ Add another surface</button>

          <div className="vn-row" style={{ marginTop: 18 }}>
            <div>
              <span className="vn-label">Panel width ({unit})</span>
              <input className="vn-input" type="number" min="0.01" step="0.1" value={panelW}
                onChange={(e) => setPanelW(e.target.value)} />
            </div>
            <div>
              <span className="vn-label">Panel height ({unit})</span>
              <input className="vn-input" type="number" min="0.01" step="0.1" value={panelH}
                onChange={(e) => setPanelH(e.target.value)} />
            </div>
          </div>
          <div className="vn-row">
            <div>
              <span className="vn-label">Wastage %</span>
              <input className="vn-input" type="number" min="0" max="100" step="1" value={wastage}
                onChange={(e) => setWastage(e.target.value)} />
            </div>
            <div>
              <span className="vn-label">Price / panel (optional)</span>
              <input className="vn-input" type="number" min="0" step="1" value={pricePerPanel}
                placeholder="₹" onChange={(e) => setPricePerPanel(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="vn-card">
          <div className="vn-grid vn-grid--2" style={{ gap: 24 }}>
            <div className="vn-stat">
              <span className="vn-stat__value">{fmt(areaDisplay(result.areaM2))} {areaLabel}</span>
              <span className="vn-stat__label">Total surface area</span>
            </div>
            <div className="vn-stat">
              <span className="vn-stat__value">{result.panels}</span>
              <span className="vn-stat__label">Panels needed (incl. wastage)</span>
            </div>
            <div className="vn-stat">
              <span className="vn-stat__value">{fmt(areaDisplay(result.wastageArea))} {areaLabel}</span>
              <span className="vn-stat__label">Estimated offcut / wastage</span>
            </div>
            <div className="vn-stat">
              <span className="vn-stat__value">{result.price != null ? money(result.price) : '—'}</span>
              <span className="vn-stat__label">Estimated subtotal</span>
            </div>
          </div>
          <p className="vn-note" style={{ marginTop: 20 }}>
            Estimates only. Actual quantities vary with layout, pattern matching and cut planning.
          </p>
        </div>
      </div>
    </div>
  );
}
