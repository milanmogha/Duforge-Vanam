// src/pages/ContentPages.jsx — About, Contact, Sustainability, Journal.
// All copy is either factual/brand-derived or CLEARLY marked demo/placeholder.
// No fabricated certifications, awards, partnerships, or metrics.
import React from 'react';
import { Link } from 'react-router-dom';
import BRAND from '../config/brand';
import '../theme/pages.css';

const Shell = ({ eyebrow, title, lead, children }) => (
  <div className="vn-page">
    <div className="vn-page__head">
      <p className="vn-page__eyebrow">{eyebrow}</p>
      <h1 className="vn-page__title">{title}</h1>
      {lead && <p className="vn-page__lead">{lead}</p>}
    </div>
    <div className="vn-page__body">{children}</div>
  </div>
);

export function About() {
  return (
    <Shell eyebrow="About" title={`${BRAND.name} — a digital material atelier`}
      lead={BRAND.descriptor}>
      <div className="vn-card" style={{ maxWidth: 760 }}>
        <p style={{ lineHeight: 1.7, color: 'var(--vn-mist)' }}>
          {BRAND.name} presents furniture and architectural surfaces the way an architecture studio
          presents materials — in considered light, in real space, and in interactive 3D you can turn
          in your hand. What you see on screen is the true finish and grain of what arrives at your door.
        </p>
        <p style={{ lineHeight: 1.7, color: 'var(--vn-mist)' }}>
          Browse by material, by space, or by collection; preview finishes side by side in the
          <Link className="vn-linkbtn" to="/finish-lab"> Finish Lab</Link>; and estimate a project with
          the <Link className="vn-linkbtn" to="/calculator">calculator</Link>.
        </p>
        <p className="vn-note">
          {BRAND.name} is a working brand identity. Company facts (legal entity, history, certifications)
          are intentionally omitted until supplied — nothing here is invented.
        </p>
      </div>
    </Shell>
  );
}

export function Contact() {
  return (
    <Shell eyebrow="Contact" title="Talk to us"
      lead="For orders, trade enquiries, samples and projects.">
      <div className="vn-grid vn-grid--2" style={{ maxWidth: 900 }}>
        <div className="vn-card">
          <h3 style={{ fontFamily: 'var(--vn-font-display)', fontWeight: 400 }}>General</h3>
          <p className="vn-note">Email</p>
          <p><a className="vn-linkbtn" href={`mailto:${BRAND.support.email}`}>{BRAND.support.email}</a></p>
          {BRAND.support.phone
            ? (<><p className="vn-note">Phone</p><p>{BRAND.support.phone}</p></>)
            : <p className="vn-note">A phone line will be listed once available.</p>}
        </div>
        <div className="vn-card">
          <h3 style={{ fontFamily: 'var(--vn-font-display)', fontWeight: 400 }}>Projects & trade</h3>
          <p style={{ color: 'var(--vn-mist)' }}>
            For bulk quantities, custom dimensions or professional projects, submit a
            <Link className="vn-linkbtn" to="/quote"> quote request</Link> — our team responds with pricing.
          </p>
        </div>
      </div>
    </Shell>
  );
}

export function Sustainability() {
  return (
    <Shell eyebrow="Material responsibility" title="On materials and responsibility"
      lead="We only make claims we can substantiate.">
      <div className="vn-card" style={{ maxWidth: 760 }}>
        <p style={{ lineHeight: 1.7, color: 'var(--vn-mist)' }}>
          Wood is a renewable material, and how it is sourced and finished matters. {BRAND.name} will
          publish specific sourcing, certification and end-of-life information here as it is verified.
        </p>
        <p className="vn-note">
          Placeholder page. No certifications, origins, or environmental figures are stated because
          none have been supplied yet — this section is deliberately empty of unverifiable claims.
        </p>
      </div>
    </Shell>
  );
}

// Clearly-marked demo editorial entries.
const JOURNAL = [
  { title: 'Reading grain: how to choose a wood tone', kicker: 'Guide', body: 'A short primer on how light and grain direction change the way a finish reads in a room.' },
  { title: 'Warm minimalism for small spaces', kicker: 'Spaces', body: 'Composing calm interiors with fewer, better pieces and honest materials.' },
  { title: 'From block to panel', kicker: 'Craft', body: 'How a raw material becomes an engineered surface — see it in 3D on our Technology page.' },
];

export function Journal() {
  return (
    <Shell eyebrow="Journal" title="Notes on material & space"
      lead="Editorial content. The entries below are demo samples.">
      <div className="vn-grid vn-grid--3">
        {JOURNAL.map((a) => (
          <article key={a.title} className="vn-card">
            <span className="vn-badge">{a.kicker}</span>
            <h3 style={{ fontFamily: 'var(--vn-font-display)', fontWeight: 400, margin: '12px 0 8px' }}>{a.title}</h3>
            <p style={{ color: 'var(--vn-mist)', lineHeight: 1.6 }}>{a.body}</p>
            <p className="vn-note">Demo article</p>
          </article>
        ))}
      </div>
    </Shell>
  );
}
