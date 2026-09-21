// --- Android Native Fetch Patch ---
const isAndroidNative = window.location.origin.includes('localhost') && !window.location.port;
const NATIVE_BACKEND_URL = 'http://192.168.1.247:3000'; // Your PC IP and backend port

if (isAndroidNative) {
  const originalFetch = window.fetch;
  window.fetch = function (resource, init) {
    if (typeof resource === 'string' && resource.startsWith('api/')) {
      resource = `${NATIVE_BACKEND_URL}/${resource}`;
    } else if (typeof resource === 'string' && resource.startsWith('/api')) {
      resource = `${NATIVE_BACKEND_URL}${resource}`;
    }
    return originalFetch(resource, init);
  };
}


import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
