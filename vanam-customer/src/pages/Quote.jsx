// src/pages/Quote.jsx — submit and track quote requests (bulk / custom / trade).
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { requestQuote, listMyQuotes } from '../api/featuresApi';
import '../theme/pages.css';

const BLANK_ITEM = { name: '', quantity: 1, dimensions: '' };

export default function Quote() {
  const { getToken, user } = useAuth();
  const [form, setForm] = useState({
    company: '', projectType: 'Residential', contactEmail: user?.email || '', contactPhone: user?.phoneNumber || '', details: '',
  });
  const [items, setItems] = useState([{ ...BLANK_ITEM }]);
  const [mine, setMine] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const token = await getToken();
      setMine(await listMyQuotes(token));
    } catch { setMine([]); }
  };
  useEffect(() => { load(); }, []);

  const setItem = (i, key, val) => {
    const next = items.slice(); next[i] = { ...next[i], [key]: val }; setItems(next);
  };
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      const token = await getToken();
      const payload = { ...form, items: items.filter((it) => it.name.trim()) };
      await requestQuote(token, payload);
      setMsg('Quote request submitted. Our team will respond with pricing.');
      setItems([{ ...BLANK_ITEM }]);
      setForm((f) => ({ ...f, details: '' }));
      await load();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Could not submit. Add at least one item or details.');
    } finally { setBusy(false); }
  };

  return (
    <div className="vn-page">
      <div className="vn-page__head">
        <p className="vn-page__eyebrow">Trade & projects</p>
        <h1 className="vn-page__title">Request a quote</h1>
        <p className="vn-page__lead">
          For bulk quantities, custom dimensions, or professional projects. We respond with pricing —
          nothing is auto-quoted, so figures are always confirmed by our team.
        </p>
      </div>

      <div className="vn-page__body vn-grid vn-grid--2" style={{ alignItems: 'start' }}>
        <form className="vn-card" onSubmit={submit}>
          <div className="vn-row">
            <div><span className="vn-label">Company (optional)</span>
              <input className="vn-input" value={form.company} onChange={(e) => set('company', e.target.value)} /></div>
            <div><span className="vn-label">Project type</span>
              <select className="vn-select" value={form.projectType} onChange={(e) => set('projectType', e.target.value)}>
                {['Residential', 'Commercial', 'Hospitality', 'Retail', 'Other'].map((o) => <option key={o}>{o}</option>)}
              </select></div>
          </div>
          <div className="vn-row">
            <div><span className="vn-label">Contact email</span>
              <input className="vn-input" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></div>
            <div><span className="vn-label">Contact phone</span>
              <input className="vn-input" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} /></div>
          </div>

          <span className="vn-label" style={{ marginTop: 8 }}>Items</span>
          {items.map((it, i) => (
            <div className="vn-row" key={i} style={{ marginBottom: 8 }}>
              <input className="vn-input" placeholder="Product / description" value={it.name}
                onChange={(e) => setItem(i, 'name', e.target.value)} style={{ flex: '3 1 160px' }} />
              <input className="vn-input" type="number" min="1" placeholder="Qty" value={it.quantity}
                onChange={(e) => setItem(i, 'quantity', e.target.value)} style={{ flex: '1 1 70px' }} />
              <input className="vn-input" placeholder="Dimensions" value={it.dimensions}
                onChange={(e) => setItem(i, 'dimensions', e.target.value)} style={{ flex: '2 1 120px' }} />
            </div>
          ))}
          <button type="button" className="vn-linkbtn" onClick={() => setItems([...items, { ...BLANK_ITEM }])}>+ Add item</button>

          <div className="vn-field" style={{ marginTop: 14 }}>
            <span className="vn-label">Project details</span>
            <textarea className="vn-textarea" rows={4} value={form.details}
              onChange={(e) => set('details', e.target.value)} placeholder="Timeline, site, finishes, anything else…" />
          </div>

          <button className="vn-btn vn-btn--brass" disabled={busy}>{busy ? 'Submitting…' : 'Submit quote request'}</button>
          {msg && <p className="vn-note" style={{ marginTop: 10 }}>{msg}</p>}
        </form>

        <div>
          <h2 style={{ fontFamily: 'var(--vn-font-display)', fontWeight: 400 }}>Your requests</h2>
          {mine.length === 0 ? (
            <p className="vn-note">No quote requests yet.</p>
          ) : mine.map((q) => (
            <div className="vn-card" key={q._id} style={{ marginBottom: 12 }}>
              <div className="vn-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ flex: 1 }}>{q.company || q.projectType || 'Quote'}</strong>
                <span className="vn-badge vn-badge--brass" style={{ flex: '0 0 auto' }}>{q.status}</span>
              </div>
              <p className="vn-note" style={{ margin: '8px 0 0' }}>
                {q.items?.length || 0} item(s) · {new Date(q.createdAt).toLocaleDateString()}
              </p>
              {q.quotedAmount != null && (
                <p style={{ color: 'var(--vn-brass)', margin: '6px 0 0' }}>
                  Quoted: ₹{q.quotedAmount.toLocaleString('en-IN')}
                </p>
              )}
              {q.adminNote && <p className="vn-note" style={{ marginTop: 6 }}>{q.adminNote}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
