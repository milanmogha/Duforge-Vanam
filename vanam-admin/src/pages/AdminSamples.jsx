// src/pages/AdminSamples.jsx — manage sample requests.
import React, { useEffect, useState } from 'react';
import { fetchSampleRequests, updateSampleRequest, SAMPLE_STATUSES } from '../api/featuresApi';
import AdminNavbar from './Navbar';
import '../css/AdminFeatures.css';

export default function AdminSamples() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try { setRows(await fetchSampleRequests()); setError(''); }
    catch (e) { setError('Failed to load sample requests'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    await updateSampleRequest(id, { status });
    load();
  };
  const setNote = async (id, adminNote) => {
    await updateSampleRequest(id, { adminNote });
  };

  return (
    <>
      <AdminNavbar />
      <div className="admin-feature container py-4">
      <h2 className="mb-3">Sample Requests</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <p>Loading…</p> : rows.length === 0 ? <p className="text-muted">No sample requests yet.</p> : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr><th>Date</th><th>Customer</th><th>Product</th><th>Finish</th><th>Qty</th><th>Status</th><th>Admin note</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>{r.user?.name || '—'}<br /><small className="text-muted">{r.user?.phone}</small></td>
                  <td>{r.product?.name || '—'}</td>
                  <td>{r.finish || '—'}</td>
                  <td>{r.quantity}</td>
                  <td>
                    <select className="form-select form-select-sm" value={r.status}
                      onChange={(e) => setStatus(r._id, e.target.value)}>
                      {SAMPLE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <input className="form-control form-control-sm" defaultValue={r.adminNote || ''}
                      onBlur={(e) => setNote(r._id, e.target.value)} placeholder="Internal note" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </>
  );
}
