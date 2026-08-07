import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './index.css';
import './theme.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// ─── GLOBAL ERROR HANDLERS ──────────────────────────────────────
window.addEventListener('error', (event) => {
  const errorLog = {
    type: '❌ ADMIN_WINDOW_ERROR',
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  };
  console.error(JSON.stringify(errorLog));
});

window.addEventListener('unhandledrejection', (event) => {
  const errorLog = {
    type: '❌ ADMIN_UNHANDLED_PROMISE_REJECTION',
    reason: event.reason?.message || event.reason,
    stack: event.reason?.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href
  };
  console.error(JSON.stringify(errorLog));
});

// ─── RENDER APP ──────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

