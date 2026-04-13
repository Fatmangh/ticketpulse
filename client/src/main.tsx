import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Debug: catch top-level errors
window.addEventListener('error', (e) => {
  document.getElementById('root')!.innerHTML = `
    <div style="padding:40px;font-family:monospace;color:#E8643A">
      <h2>Runtime Error</h2>
      <pre style="white-space:pre-wrap;color:#999">${e.message}</pre>
      <pre style="white-space:pre-wrap;color:#666;font-size:12px">${e.filename}:${e.lineno}</pre>
    </div>`;
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
