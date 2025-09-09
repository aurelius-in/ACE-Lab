import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useLabStore } from './store/useLabStore'

function Persistor(){
	const snapshot = useLabStore(s => ({ effect: s.effect, timeline: s.timeline, text: s.text, device: s.device, exportSettings: s.exportSettings, play: s.play }))
	useEffect(()=>{ localStorage.setItem('ace-lab-state', JSON.stringify(snapshot)); }, [snapshot])
	useEffect(()=>{
		const raw = localStorage.getItem('ace-lab-state');
		if (raw) { try { const obj = JSON.parse(raw); useLabStore.getState().hydrateFrom(obj); } catch {} }
		// Auto-login to backend and cache token for 1h
		const hasToken = localStorage.getItem('ace-token');
		if (!hasToken) {
			fetch('http://localhost:4000/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'ace-user' }) })
				.then(r=>r.ok?r.json():null)
				.then(j=>{ if (j?.token) localStorage.setItem('ace-token', j.token); })
				.catch(()=>{});
		}
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
