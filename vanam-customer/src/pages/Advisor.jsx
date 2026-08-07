// src/pages/Advisor.jsx — Guided Material Recommendation.
// A transparent, deterministic scoring engine over the real catalog. NOT AI —
// every point is explainable (see scoreProduct). Architecture leaves room to
// swap in a self-hosted model later behind the same shape.
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllProducts } from '../api/productApi';
import '../theme/pages.css';

const STEPS = [
  { key: 'room', label: 'Which space?', options: ['Living Room', 'Bedroom', 'Dining Room', 'Office', 'Any'] },
  { key: 'use', label: 'Residential or commercial?', options: ['Residential', 'Commercial', 'Either'] },
  { key: 'color', label: 'Preferred tone', options: ['Walnut', 'Oak', 'Teak', 'Ash', 'No preference'] },
  { key: 'budget', label: 'Budget per piece', options: ['Under ₹40k', '₹40k–₹90k', '₹90k+', 'Flexible'] },
  { key: 'maintenance', label: 'Maintenance', options: ['Low upkeep', 'Balanced', "Doesn't matter"] },
];

const sell = (p) => Math.floor((p.price * (100 - (p.discount || 0))) / 100);
const inBudget = (price, b) =>
  b === 'Under ₹40k' ? price < 40000 :
  b === '₹40k–₹90k' ? price >= 40000 && price <= 90000 :
  b === '₹90k+' ? price > 90000 : true;

// Transparent scoring — returns { score, reasons[] }.
function scoreProduct(p, a) {
  let score = 0; const reasons = [];
  const price = sell(p);
  if (a.room && a.room !== 'Any' && p.category === a.room) { score += 3; reasons.push(`Made for the ${a.room.toLowerCase()}`); }
  if (a.color && a.color !== 'No preference') {
    const tone = `${p.color || ''} ${p.primaryMaterial || ''}`.toLowerCase();
    if (tone.includes(a.color.toLowerCase())) { score += 3; reasons.push(`${a.color} tone match`); }
  }
  if (a.budget && inBudget(price, a.budget)) { score += 2; reasons.push('Within your budget'); }
  if (a.maintenance === 'Low upkeep') {
    // Oak/ash finishes tend to be more forgiving in this demo catalog.
    const t = `${p.primaryMaterial || ''}`.toLowerCase();
    if (t.includes('oak') || t.includes('ash')) { score += 1; reasons.push('Lower-upkeep material'); }
  }
  if (p.stock > 0) { score += 1; reasons.push('In stock'); }
  return { score, reasons };
}

export default function Advisor() {
  const [answers, setAnswers] = useState({});
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const stepIndex = STEPS.findIndex((s) => !answers[s.key]);
  const currentStep = done ? -1 : (stepIndex === -1 ? STEPS.length : stepIndex);

  const choose = async (key, value) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (Object.keys(next).length === STEPS.length) {
      setLoading(true);
      try {
        const data = await getAllProducts({});
        setProducts(Array.isArray(data) ? data : []);
      } catch { setProducts([]); }
      finally { setLoading(false); setDone(true); }
    }
  };

  const ranked = useMemo(() => {
    if (!products) return [];
    return products
      .map((p) => ({ p, ...scoreProduct(p, answers) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [products, answers]);

  const reset = () => { setAnswers({}); setProducts(null); setDone(false); };

  return (
    <div className="vn-page">
      <div className="vn-page__head">
        <p className="vn-page__eyebrow">Guided</p>
        <h1 className="vn-page__title">Smart Material Advisor</h1>
        <p className="vn-page__lead">
          Answer a few questions and we’ll rank pieces from our catalogue by how well they fit.
          This is a transparent rule-based recommendation — every match is explained, not generated.
        </p>
      </div>

      <div className="vn-page__body">
        {!done && (
          <div className="vn-card" style={{ maxWidth: 640, margin: '0 auto' }}>
            <p className="vn-badge">Step {Math.min(currentStep + 1, STEPS.length)} of {STEPS.length}</p>
            <h2 style={{ fontFamily: 'var(--vn-font-display)', fontWeight: 400, margin: '14px 0 18px' }}>
              {STEPS[Math.min(currentStep, STEPS.length - 1)].label}
            </h2>
            <div className="vn-row" style={{ flexWrap: 'wrap' }}>
              {STEPS[Math.min(currentStep, STEPS.length - 1)].options.map((opt) => (
                <button key={opt} className="vn-chip" style={{ flex: '0 0 auto' }}
                  onClick={() => choose(STEPS[currentStep].key, opt)}>{opt}</button>
              ))}
            </div>
          </div>
        )}

        {loading && <p className="vn-empty">Scoring the catalogue…</p>}

        {done && !loading && (
          <>
            <div className="vn-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <p className="vn-note" style={{ flex: 1 }}>
                Based on: {Object.values(answers).join(' · ')}
              </p>
              <button className="vn-linkbtn" style={{ flex: '0 0 auto' }} onClick={reset}>Start over</button>
            </div>
            {ranked.length === 0 ? (
              <div className="vn-empty"><p className="vn-empty__title">No catalogue data yet</p><p>Seed products first.</p></div>
            ) : (
              <div className="vn-grid vn-grid--2">
                {ranked.map(({ p, score, reasons }, i) => (
                  <div className="vn-card" key={p._id}>
                    <div className="vn-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="vn-badge vn-badge--brass" style={{ flex: '0 0 auto' }}>
                        {i === 0 ? 'Best match' : `Match score ${score}`}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--vn-font-display)', fontWeight: 400, margin: '12px 0 6px' }}>
                      <Link className="vn-linkbtn" to={`/products/${p._id}`} style={{ fontSize: '1.1rem' }}>{p.name}</Link>
                    </h3>
                    <ul style={{ margin: '10px 0 0', paddingLeft: 18, color: 'var(--vn-mist)', fontSize: '0.86rem' }}>
                      {reasons.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
