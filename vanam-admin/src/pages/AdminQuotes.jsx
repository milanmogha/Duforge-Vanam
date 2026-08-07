// src/pages/AdminQuotes.jsx — manage quote requests.
import React, { useEffect, useState } from 'react';
import { fetchQuoteRequests, updateQuoteRequest, QUOTE_STATUSES } from '../api/featuresApi';
import AdminNavbar from './Navbar';
import '../css/AdminFeatures.css';

export default function AdminQuotes() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try { setRows(await fetchQuoteRequests()); setError(''); }
    catch { setError('Failed to load quote requests'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const patch = async (id, payload) => { await updateQuoteRequest(id, payload); load(); };

  return (
    <>
      <AdminNavbar />
      <div className="admin-feature container py-4">
      <h2 className="mb-3">Quote Requests</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <p>Loading…</p> : rows.length === 0 ? <p className="text-muted">No quote requests yet.</p> : (
        <div className="row g-3">
          {rows.map((q) => (
            <div className="col-12 col-lg-6" key={q._id}>
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="card-title mb-0">{q.company || q.projectType || 'Quote'}</h5>
                      <small className="text-muted">{q.user?.name} · {q.user?.phone} · {new Date(q.createdAt).toLocaleDateString()}</small>
                    </div>
                    <select className="form-select form-select-sm w-auto" value={q.status}
                      onChange={(e) => patch(q._id, { status: e.target.value })}>
                      {QUOTE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {q.contactEmail && <p className="mb-1 small">Email: {q.contactEmail}</p>}
                  {q.contactPhone && <p className="mb-1 small">Phone: {q.contactPhone}</p>}

                  {q.items?.length > 0 && (
                    <ul className="small mb-2">
                      {q.items.map((it, i) => (
                        <li key={i}>{it.name || it.product?.name || 'Item'} × {it.quantity}{it.dimensions ? ` (${it.dimensions})` : ''}</li>
                      ))}
                    </ul>
                  )}
                  {q.details && <p className="small text-muted">{q.details}</p>}

                  <div className="row g-2 mt-1">
                    <div className="col-6">
                      <input type="number" className="form-control form-control-sm" placeholder="Quoted amount (₹)"
                        defaultValue={q.quotedAmount ?? ''} onBlur={(e) => patch(q._id, { quotedAmount: e.target.value ? Number(e.target.value) : null })} />
                    </div>
                    <div className="col-6">
                      <input className="form-control form-control-sm" placeholder="Response note"
                        defaultValue={q.adminNote || ''} onBlur={(e) => patch(q._id, { adminNote: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
