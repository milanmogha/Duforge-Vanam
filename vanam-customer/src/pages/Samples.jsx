// src/pages/Samples.jsx — track my sample requests.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { listMySamples } from '../api/featuresApi';
import '../theme/pages.css';

const STATUS_STEPS = ['REQUESTED', 'REVIEWING', 'APPROVED', 'DISPATCHED', 'DELIVERED'];

export default function Samples() {
  const { getToken } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        setRows(await listMySamples(token));
      } catch { setRows([]); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="vn-page">
      <div className="vn-page__head">
        <p className="vn-page__eyebrow">Account</p>
        <h1 className="vn-page__title">Material samples</h1>
        <p className="vn-page__lead">Request a physical sample from any product page, then track it here.</p>
      </div>

      <div className="vn-page__body">
        {loading ? <p className="vn-empty">Loading…</p> : rows.length === 0 ? (
          <div className="vn-empty">
            <p className="vn-empty__title">No sample requests yet</p>
            <p>Open a product and choose “Request a sample”.</p>
            <Link className="vn-linkbtn" to="/products">Browse products</Link>
          </div>
        ) : (
          <div className="vn-grid vn-grid--2">
            {rows.map((r) => {
              const rejected = r.status === 'REJECTED';
              const stepIdx = STATUS_STEPS.indexOf(r.status);
              return (
                <div className="vn-card" key={r._id}>
                  <div className="vn-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ flex: 1 }}>{r.product?.name || 'Product'}</strong>
                    <span className={`vn-badge ${rejected ? '' : 'vn-badge--brass'}`} style={{ flex: '0 0 auto' }}>{r.status}</span>
                  </div>
                  <p className="vn-note" style={{ margin: '8px 0' }}>
                    {r.finish ? `Finish: ${r.finish} · ` : ''}Qty {r.quantity} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  {!rejected && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                      {STATUS_STEPS.map((s, i) => (
                        <div key={s} title={s} style={{
                          flex: 1, height: 4, borderRadius: 2,
                          background: i <= stepIdx ? 'var(--vn-brass)' : 'var(--vn-line)',
                        }} />
                      ))}
                    </div>
                  )}
                  {r.adminNote && <p className="vn-note" style={{ marginTop: 10 }}>Note: {r.adminNote}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
