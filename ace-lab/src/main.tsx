import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useLabStore } from './store/useLabStore'

function Persistor(){
	useEffect(()=>{
		// Hydrate once on mount
		const raw = localStorage.getItem('ace-lab-state');
		if (raw) { try { const obj = JSON.parse(raw); useLabStore.getState().hydrateFrom(obj); } catch {} }

		// Persist on store changes without causing render feedback loops
		const unsubscribe = useLabStore.subscribe((s) => ({
			effect: s.effect,
			timeline: s.timeline,
			text: s.text,
			device: s.device,
			exportSettings: s.exportSettings,
			play: s.play,
		}), (snapshot) => {
			try { localStorage.setItem('ace-lab-state', JSON.stringify(snapshot)); } catch {}
		});

		// Auto-login to backend and cache token for 1h (best-effort)
		const hasToken = localStorage.getItem('ace-token');
		if (!hasToken) {
			fetch('http://localhost:4000/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'ace-user' }) })
				.then(r=>r.ok?r.json():null)
				.then(j=>{ if (j?.token) localStorage.setItem('ace-token', j.token); })
				.catch(()=>{});
		}

		return () => { unsubscribe(); };
	}, [])
	return null
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <Persistor />
    <App />
  </StrictMode>
);

// remove splash after 4.9s
const hideSplash = () => {
  const s = document.getElementById('splash');
  if (!s) return;
  s.style.transition = 'opacity 300ms ease';
  s.style.opacity = '0';
  setTimeout(() => { s?.parentElement?.removeChild(s); window.dispatchEvent(new Event('ace:splash-hidden')); }, 320);
};

function scheduleSplashHide(){ setTimeout(hideSplash, 4900); }
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  scheduleSplashHide();
} else {
  window.addEventListener('DOMContentLoaded', scheduleSplashHide, { once: true });
}
