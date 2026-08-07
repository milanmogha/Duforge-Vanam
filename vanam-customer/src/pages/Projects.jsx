// src/pages/Projects.jsx — customer project boards list.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { listProjects, createProject, deleteProject } from '../api/featuresApi';
import '../theme/pages.css';

export default function Projects() {
  const { getToken } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      setProjects(await listProjects(token));
    } catch { setProjects([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const token = await getToken();
      await createProject(token, { name: name.trim() });
      setName('');
      await load();
    } finally { setBusy(false); }
  };

  const remove = async (id) => {
    const token = await getToken();
    await deleteProject(token, id);
    load();
  };

  return (
    <div className="vn-page">
      <div className="vn-page__head">
        <p className="vn-page__eyebrow">Account</p>
        <h1 className="vn-page__title">Project boards</h1>
        <p className="vn-page__lead">Collect pieces and finishes for a room or a whole project, then request a quote.</p>
      </div>

      <div className="vn-page__body">
        <form className="vn-card vn-row" style={{ marginBottom: 24, alignItems: 'flex-end' }} onSubmit={create}>
          <div style={{ flex: '3 1 260px' }}>
            <span className="vn-label">New project name</span>
            <input className="vn-input" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Modern Gurgaon Residence" />
          </div>
          <button className="vn-btn vn-btn--brass" style={{ flex: '0 0 auto' }} disabled={busy}>Create project</button>
        </form>

        {loading ? (
          <p className="vn-empty">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="vn-empty"><p className="vn-empty__title">No projects yet</p><p>Create one above to start saving pieces.</p></div>
        ) : (
          <div className="vn-grid vn-grid--3">
            {projects.map((p) => (
              <div className="vn-card" key={p._id}>
                <h3 style={{ fontFamily: 'var(--vn-font-display)', fontWeight: 400, margin: '0 0 8px' }}>
                  <Link className="vn-linkbtn" to={`/account/projects/${p._id}`} style={{ fontSize: '1.15rem' }}>{p.name}</Link>
                </h3>
                <p className="vn-note" style={{ margin: '0 0 14px' }}>{p.items?.length || 0} item(s)</p>
                <div className="vn-row">
                  <Link className="vn-btn vn-btn--ghost" to={`/account/projects/${p._id}`} style={{ flex: '0 0 auto' }}>Open</Link>
                  <button className="vn-linkbtn" style={{ flex: '0 0 auto', color: 'var(--vn-mist)' }} onClick={() => remove(p._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
