// src/pages/HomePage.jsx — "LIVING MATERIALS" narrative homepage.
// Furniture-first acts: cinematic hero → rooms → new arrivals → materials →
// signature collection → transformation (real 3D) → finish lab (real 3D) →
// visualizer → advisor → calculator → professionals → stories → final CTA.
// Data loading (banners, arrivals, sockets, SEO) preserved.

import React, { useEffect, useState, useMemo, Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPublicBanners } from '../api/bannerApi';
import socket from '../sockets';
import '../css/HomePage.css';
import { getAllProducts } from '../api/productApi';
import ProductCard from './ProductCard';
import InView from '../components/InView';
import { updateMetaTags, addSchemaToHead, generateOrganizationSchema } from '../utils/seoHelper';
import Hero3D from '../three/Hero3D';
import { LAYERS } from '../three/materialData';
import { FINISHES } from '../three/materialData';
import useDeviceTier, { tierSettings } from '../three/useDeviceTier';
import BRAND from '../config/brand';
import { CATEGORIES } from '../config/categories';

const Canvas = lazy(() => import('@react-three/fiber').then((m) => ({ default: m.Canvas })));
const ExplodedScene = lazy(() => import('../three/ExplodedScene'));
const ProductViewer = lazy(() => import('../three/ProductViewer'));

const SPACE_IMAGES = {
  'living-room': '/images/cat-living.jpg',
  bedroom: '/images/chair.jpg',
  'dining-room': '/images/coffee_table.jpg',
  office: '/images/product-fallback.jpg',
  kitchen: '/images/cat-kitchen.jpg',
  tableware: '/images/cat-tableware.jpg',
  decor: '/images/cat-decor.jpg',
  furnishing: '/images/cat-furnishing.jpg',
};

const TRANSFORM_STAGES = [
  { key: 'raw', label: 'Raw', copy: 'Matter arrives as it grew — dense, irregular, alive.' },
  { key: 'cut', label: 'Cut', copy: 'Sawn and seasoned into workable, stable sections.' },
  { key: 'layered', label: 'Layered', copy: 'Engineered plies cross-bond for strength and calm.' },
  { key: 'finished', label: 'Finished', copy: 'Surface, grain and sheen tuned for the hand and the light.' },
];

const ADVISOR_ENTRIES = [
  { label: 'A home', to: '/advisor?project=residential' },
  { label: 'A workspace', to: '/advisor?project=workspace' },
  { label: 'Hospitality', to: '/advisor?project=hospitality' },
  { label: 'Retail', to: '/advisor?project=retail' },
];

const STORIES = [
  { title: 'Reading grain', copy: 'What figure, ray and knot tell you about how a surface will live.', to: '/journal' },
  { title: 'Why engineered wood is calm', copy: 'Cross-bonded plies, movement, and the physics of a stable panel.', to: '/technology' },
  { title: 'Caring for finished wood', copy: 'Light, humidity and touch — a short guide to a long life.', to: '/journal' },
];

const HomePage = ({ openCart }) => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loadingArrivals, setLoadingArrivals] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [stage, setStage] = useState(2); // transformation act
  const [labFinish, setLabFinish] = useState('walnut');
  const [calcW, setCalcW] = useState('');
  const [calcH, setCalcH] = useState('');

  const { tier, reducedMotion } = useDeviceTier();
  const settings = tierSettings(tier, reducedMotion);

  // SEO
  useEffect(() => {
    const frontendBase = (process.env.REACT_APP_FRONTEND_URL || window.location.origin).replace(/\/$/, '');
    updateMetaTags(
      `${BRAND.name} — Solid wood furniture, shown honestly`,
      'Premium wood furniture for every room — preview true grain and finish in real 3D before it enters your home.',
      frontendBase,
      { keywords: 'wood furniture, solid wood furniture, sofas, beds, dining tables, premium furniture, furniture online', image: `${frontendBase}/images/logoMain.png`, type: 'website' }
    );
    addSchemaToHead(generateOrganizationSchema(), 'organization-schema');
    return () => document.getElementById('organization-schema')?.remove();
  }, []);

  useEffect(() => {
    getPublicBanners()
      .then((data) => setBanners(Array.isArray(data) ? data : data?.banners || []))
      .catch(() => setBanners([]));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoadingArrivals(true);
        const data = await getAllProducts({ sort: 'newest' });
        const list = Array.isArray(data) ? data : [];
        setNewArrivals(list.slice(0, 6));
        // Material index from the live catalog.
        const mats = [...new Set(list.map((p) => p.primaryMaterial).filter(Boolean))];
        setMaterials(mats);
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setLoadingArrivals(false);
      }
    })();
  }, []);

  useEffect(() => {
    socket.on('product:added', (p) => setNewArrivals((prev) => [p, ...prev].slice(0, 6)));
    socket.on('product:deleted', (id) => setNewArrivals((prev) => prev.filter((p) => (p._id || p.id) !== id)));
    return () => { socket.off('product:added'); socket.off('product:deleted'); };
  }, []);

  const calcArea = useMemo(() => {
    const w = parseFloat(calcW); const h = parseFloat(calcH);
    if (!(w > 0) || !(h > 0)) return null;
    return (w * h).toFixed(2);
  }, [calcW, calcH]);

  const exploded = stage >= 2;
  const finishEntries = Object.entries(FINISHES);

  return (
    <main className="lm">
      {/* ═══ ACT I — THE MATERIAL AWAKENS ═══ */}
      <section className="lm-hero theater" aria-label={`${BRAND.name} — furniture in its element`}>
        <div className="lm-hero__canvas"><Hero3D finishKey="walnut" /></div>
        <div className="lm-hero__frame">
          <div className="lm-hero__copy">
            <p className="tech-label">{BRAND.descriptor}</p>
            <h1>Furniture,<br /><em>in its element.</em></h1>
            <p className="lm-hero__sub">
              Solid wood furniture you can turn in your hand before it enters your home —
              true grain, honest light, real 3D.
            </p>
            <div className="lm-hero__cta">
              <Link to="/products" className="btn">Shop furniture</Link>
              <Link to="/visualizer" className="btn-outline">Enter the showroom</Link>
            </div>
          </div>
          <div className="lm-hero__meta tech" aria-hidden="true">
            <span>walnut · oak · teak</span>
            <span>01 / raw → spatial</span>
          </div>
        </div>
        <div className="lm-hero__scroll" aria-hidden="true"><span />scroll</div>
      </section>

      {/* Admin banners (kept, restrained) */}
      {banners.length > 0 && (
        <section className="lm-banners" aria-label="Announcements">
          {banners.slice(0, 1).map((b) => {
            const href = b.link && (b.link.startsWith('http') ? b.link : `https://${b.link}`);
            return (
              <a key={b._id} href={href || '#'} target="_blank" rel="noreferrer">
                <img src={b.image} alt={b.text || `${BRAND.name} announcement`} loading="lazy" />
                {b.text && <span>{b.text}</span>}
              </a>
            );
          })}
        </section>
      )}

      {/* ═══ ACT III — SHOP BY SPACE ═══ */}
      <section className="lm-act lm-act--band">
        <div className="container">
          <header className="lm-head">
            <span className="tech-label">Act 02 — Rooms</span>
            <h2>Furniture for every room.</h2>
          </header>
          <div className="lm-spaces">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                to={`/products?category=${c.slug}`}
                className="lm-space"
              >
                <img src={SPACE_IMAGES[c.slug] || '/images/product-fallback.jpg'} alt={`${c.title} furniture`} loading="lazy" />
                <span className="lm-space__veil" aria-hidden="true" />
                <span className="lm-space__label">
                  <strong>{c.title}</strong>
                  <span className="tech">{c.children?.length || 0} categories</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ACT VI — FEATURED PRODUCTS ═══ */}
      <section className="lm-act container">
        <header className="lm-head lm-head--row">
          <div>
            <span className="tech-label">Act 03 — New arrivals</span>
            <h2>Fresh from the workshop.</h2>
          </div>
          <Link to="/products" className="link-line">All products</Link>
        </header>
        {loadingArrivals ? (
          <div className="lm-products">{[...Array(3)].map((_, i) => <div key={i} className="skeleton lm-products__skeleton" />)}</div>
        ) : newArrivals.length === 0 ? (
          <div className="empty-state"><h3>The workshop is quiet.</h3><p>New pieces appear here as they join the catalog.</p></div>
        ) : (
          <div className="lm-products">
            {newArrivals.map((p) => (
              <div key={p._id || p.id} className="lm-products__item">
                <ProductCard product={p} openCart={openCart} isCarouselContext={true} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══ ACT II — MATERIAL INDEX ═══ */}
      <section className="lm-act container">
        <header className="lm-head">
          <span className="tech-label">Act 04 — Materials</span>
          <h2>What your furniture is made of.</h2>
        </header>
        <div className="lm-index" role="list">
          {(materials.length ? materials : ['Walnut', 'Oak', 'Teak']).map((m, i) => (
            <Link
              key={m}
              role="listitem"
              to={`/products?primaryMaterial=${encodeURIComponent(m)}`}
              className="lm-index__card"
              style={{ '--swatch-hue': `${18 + i * 14}` }}
            >
              <span className={`lm-index__swatch lm-index__swatch--${i % 4}`} aria-hidden="true" />
              <span className="lm-index__name">{m}</span>
              <span className="tech">nº {String(i + 1).padStart(2, '0')}</span>
            </Link>
          ))}
          <Link to="/materials" className="lm-index__card lm-index__card--all">
            <span className="lm-index__name">Full index →</span>
          </Link>
        </div>
      </section>

      {/* ═══ ACT IV — SIGNATURE COLLECTION ═══ */}
      <section className="lm-act container">
        <div className="lm-signature">
          <span className="lm-signature__vertical" aria-hidden="true">SIGNATURE</span>
          <div className="lm-signature__media">
            <img src="/images/coffee_table.jpg" alt="Signature collection piece in natural light" loading="lazy" />
          </div>
          <div className="lm-signature__body">
            <span className="tech-label">Act 05 — Collection</span>
            <h2>The first cut.</h2>
            <p>
              A working collection drawn from the live catalog — solid forms, engineered
              cores, finishes chosen to be touched. Demo content, honest presentation.
            </p>
            <div className="lm-signature__swatches" aria-hidden="true">
              {finishEntries.map(([k, f]) => (
                <span key={k} title={f.label} style={{ background: f.base }} />
              ))}
            </div>
            <Link to="/collections" className="link-line">View collections</Link>
          </div>
        </div>
      </section>

      {/* ═══ ACT V — TRANSFORMATION (real 3D) ═══ */}
      <section className="lm-act theater lm-transform">
        <div className="container lm-transform__grid">
          <div className="lm-transform__copy">
            <span className="tech-label">Act 06 — Engineering</span>
            <h2>Raw → cut → layered → finished.</h2>
            <p className="lm-transform__note">
              Pull apart the engineered wood inside our furniture. Illustrative construction —
              the point is the idea: crossed layers make calm, stable pieces.
            </p>
            <div className="lm-transform__stages" role="tablist" aria-label="Transformation stage">
              {TRANSFORM_STAGES.map((s, i) => (
                <button
                  key={s.key}
                  role="tab"
                  aria-selected={stage === i}
                  className={stage === i ? 'is-active' : ''}
                  onClick={() => setStage(i)}
                >
                  <span className="tech">{String(i + 1).padStart(2, '0')}</span>
                  {s.label}
                </button>
              ))}
            </div>
            <p className="lm-transform__stagecopy">{TRANSFORM_STAGES[stage].copy}</p>
            <ul className="lm-transform__layers">
              {LAYERS.map((l) => <li key={l.key} className="tech">{l.label}</li>)}
            </ul>
            <Link to="/technology" className="link-line link-line--light">Full material technology</Link>
          </div>
          <InView className="lm-transform__stage3d" placeholder={<div className="lm-canvas-skeleton" />}>
            <Suspense fallback={<div className="lm-canvas-skeleton" />}>
              <Canvas dpr={settings.dpr} camera={{ position: [3, 1.6, 3.4], fov: 42 }}>
                <Suspense fallback={null}>
                  <ExplodedScene exploded={exploded} finishKey="walnut" envResolution={settings.envResolution} />
                </Suspense>
              </Canvas>
            </Suspense>
          </InView>
        </div>
      </section>

      {/* ═══ ACT VII — FINISH LAB (real 3D) ═══ */}
      <section className="lm-act lm-act--band lm-lab">
        <div className="container lm-lab__grid">
          <InView className="lm-lab__stage" placeholder={<div className="lm-canvas-skeleton" />}>
            <Suspense fallback={<div className="lm-canvas-skeleton" />}>
              <ProductViewer posterSrc="/images/placeholder.jpg" productName="Finish preview" defaultFinish={labFinish} modelType="chair" key={labFinish} />
            </Suspense>
          </InView>
          <div className="lm-lab__copy">
            <span className="tech-label">Act 07 — Finish Lab</span>
            <h2>Same form.<br />Different life.</h2>
            <p>Switch the finish and watch the object change temperament — grain, warmth, sheen.</p>
            <div className="lm-lab__swatches" role="group" aria-label="Choose finish">
              {finishEntries.map(([k, f]) => (
                <button
                  key={k}
                  className={labFinish === k ? 'is-active' : ''}
                  style={{ background: f.base }}
                  title={f.label}
                  aria-label={f.label}
                  onClick={() => setLabFinish(k)}
                />
              ))}
            </div>
            <Link to="/finish-lab" className="btn">Open Finish Lab</Link>
          </div>
        </div>
      </section>

      {/* ═══ ACT VIII — SPACE VISUALIZER ═══ */}
      <section className="lm-act container">
        <Link to="/visualizer" className="lm-visualizer">
          <div className="lm-visualizer__preview" aria-hidden="true">
            <span className="lm-visualizer__wall" />
            <span className="lm-visualizer__floor" />
            <span className="lm-visualizer__object" />
          </div>
          <div className="lm-visualizer__copy">
            <span className="tech-label">Act 08 — Showroom</span>
            <h2>Walk the room before it exists.</h2>
            <p>An interactive WebGL room: swap wall and floor materials, change the light of day, move the camera.</p>
            <span className="btn-outline">Enter visualizer</span>
          </div>
        </Link>
      </section>

      {/* ═══ ACT IX — SMART MATERIAL ADVISOR ═══ */}
      <section className="lm-act lm-act--band">
        <div className="container lm-advisor">
          <span className="tech-label">Act 09 — Guided discovery</span>
          <h2 className="lm-advisor__q">“What are you designing?”</h2>
          <div className="lm-advisor__choices">
            {ADVISOR_ENTRIES.map((a) => (
              <Link key={a.label} to={a.to} className="lm-advisor__choice">{a.label}</Link>
            ))}
          </div>
          <p className="lm-advisor__note">
            The Material Advisor asks a few honest questions and scores the live catalog —
            deterministic guidance, not a chatbot.
          </p>
        </div>
      </section>

      {/* ═══ ACT X — PROJECT CALCULATOR ═══ */}
      <section className="lm-act container">
        <div className="lm-calc">
          <div className="lm-calc__copy">
            <span className="tech-label">Act 10 — Quantities</span>
            <h2>Measure twice.</h2>
            <p>A quick surface estimate now; wastage, panels and pricing in the full calculator.</p>
          </div>
          <div className="lm-calc__tool">
            <div className="lm-calc__inputs">
              <label className="field">
                <span className="tech-label">Width (m)</span>
                <input inputMode="decimal" value={calcW} onChange={(e) => setCalcW(e.target.value)} placeholder="3.6" />
              </label>
              <span className="lm-calc__x tech" aria-hidden="true">×</span>
              <label className="field">
                <span className="tech-label">Height (m)</span>
                <input inputMode="decimal" value={calcH} onChange={(e) => setCalcH(e.target.value)} placeholder="2.4" />
              </label>
            </div>
            <div className="lm-calc__result tech" aria-live="polite">
              {calcArea ? `≈ ${calcArea} m² of surface` : 'enter a wall to estimate'}
            </div>
            <button className="btn-outline btn-outline--sm" onClick={() => navigate(calcArea ? `/calculator?w=${calcW}&h=${calcH}` : '/calculator')}>
              Open project calculator
            </button>
          </div>
        </div>
      </section>

      {/* ═══ ACT XI — FOR PROFESSIONALS ═══ */}
      <section className="lm-act theater lm-pro">
        <div className="container lm-pro__grid">
          <div>
            <span className="tech-label">Act 11 — Professionals</span>
            <h2>Built for the people<br />who specify.</h2>
          </div>
          <div className="lm-pro__items">
            <Link to="/account/samples" className="lm-pro__item"><span className="tech">01</span>Physical samples, tracked</Link>
            <Link to="/quote" className="lm-pro__item"><span className="tech">02</span>Project quotes, no fake pricing</Link>
            <Link to="/account/projects" className="lm-pro__item"><span className="tech">03</span>Project boards per client</Link>
            <Link to="/compare" className="lm-pro__item"><span className="tech">04</span>Side-by-side specification</Link>
          </div>
        </div>
      </section>

      {/* ═══ ACT XII — MATERIAL STORIES ═══ */}
      <section className="lm-act container">
        <header className="lm-head">
          <span className="tech-label">Act 12 — Stories</span>
          <h2>Notes from the material world.</h2>
        </header>
        <div className="lm-stories">
          {STORIES.map((s, i) => (
            <Link key={s.title} to={s.to} className="lm-story">
              <span className="tech">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.copy}</p>
              <span className="link-line">Read</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ ACT XIII — FINAL IMMERSIVE CTA ═══ */}
      <section className="lm-final theater">
        <div className="lm-final__grain" aria-hidden="true" />
        <div className="lm-final__inner">
          <p className="tech-label">The material is waiting</p>
          <h2>Go and touch it —<br /><em>digitally, first.</em></h2>
          <div className="lm-final__cta">
            <Link to="/products" className="btn btn--light">Shop the catalog</Link>
            <Link to="/finish-lab" className="btn-outline btn-outline--light">Open the Finish Lab</Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
