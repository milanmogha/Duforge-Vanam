// src/components/InView.jsx
// Defers mounting of heavy children (3D canvases) until the wrapper scrolls
// near the viewport, and adds the .in class for reveal transitions.

import React, { useEffect, useRef, useState } from 'react';

export default function InView({ children, placeholder = null, margin = '200px', className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || visible) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: margin }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [visible, margin]);

  return (
    <div ref={ref} className={`${className} reveal ${visible ? 'in' : ''}`.trim()}>
      {visible ? children : placeholder}
    </div>
  );
}
