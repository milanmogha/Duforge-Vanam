// src/pages/ProjectDetail.jsx — single project board with items.
import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getProject, updateProject, removeProjectItem, deleteProject } from '../api/featuresApi';
import '../theme/pages.css';

const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const sell = (p) => Math.floor((p.price * (100 - (p.discount || 0))) / 100);

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await getProject(token, id);
      setProject(data);
      setName(data.name);
    } catch { setProject(null); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const saveName = async () => {
    const token = await getToken();
    await updateProject(token, id, { name });
    load();
  };
  const removeItem = async (itemId) => {
    const token = await getToken();
    await removeProjectItem(token, id, itemId);
    load();
  };
  const removeProject = async () => {
    const token = await getToken();
    await deleteProject(token, id);
    navigate('/account/projects');
  };

  if (loading) return <div className="vn-page"><p className="vn-empty">Loading…</p></div>;
  if (!project) return <div className="vn-page"><div className="vn-empty"><p className="vn-empty__title">Project not found</p><Link className="vn-linkbtn" to="/account/projects">Back to projects</Link></div></div>;

  const total = (project.items || []).reduce((s, it) => s + (it.product ? sell(it.product) * (it.quantity || 1) : 0), 0);

  return (
    <div className="vn-page">
      <div className="vn-page__head">
        <p className="vn-page__eyebrow"><Link className="vn-linkbtn" to="/account/projects">← Projects</Link></p>
        <div className="vn-row" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: '3 1 320px' }}>
            <span className="vn-label">Project name</span>
            <input className="vn-input" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} />
          </div>
          <Link className="vn-btn vn-btn--brass" to="/quote" style={{ flex: '0 0 auto' }}>Request a quote</Link>
        </div>
      </div>

      <div className="vn-page__body">
        {(!project.items || project.items.length === 0) ? (
          <div className="vn-empty"><p className="vn-empty__title">No pieces saved yet</p>
            <p>Open a product and choose “Save to project”.</p>
            <Link className="vn-linkbtn" to="/products">Browse products</Link></div>
        ) : (
          <>
            <div className="vn-grid vn-grid--3">
              {project.items.map((it) => (
                <div className="vn-card" key={it._id}>
                  {it.product?.imageUrl && <img src={it.product.imageUrl} alt={it.product?.name} style={{ width: '100%', borderRadius: 6, marginBottom: 10 }} />}
                  <strong>{it.product?.name || 'Product'}</strong>
                  <p className="vn-note" style={{ margin: '6px 0' }}>
                    {it.room && `${it.room} · `}Qty {it.quantity}{it.finish && ` · ${it.finish}`}
                  </p>
                  {it.product && <p style={{ color: 'var(--vn-brass)', margin: '4px 0' }}>{money(sell(it.product) * (it.quantity || 1))}</p>}
                  <button className="vn-linkbtn" style={{ color: 'var(--vn-mist)' }} onClick={() => removeItem(it._id)}>Remove</button>
                </div>
              ))}
            </div>
            <div className="vn-card" style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="vn-stat__label">Estimated project value</span>
              <span className="vn-stat__value">{money(total)}</span>
            </div>
          </>
        )}
        <div style={{ marginTop: 24 }}>
          <button className="vn-linkbtn" style={{ color: 'var(--vn-mist)' }} onClick={removeProject}>Delete this project</button>
        </div>
      </div>
    </div>
  );
}
