import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// remove splash after mount
const hideSplash = () => {
  const s = document.getElementById('splash');
  if (s) s.style.opacity = '0';
  setTimeout(() => s?.parentElement?.removeChild(s), 200);
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(hideSplash, 50);
} else {
  window.addEventListener('DOMContentLoaded', () => setTimeout(hideSplash, 50));
}
