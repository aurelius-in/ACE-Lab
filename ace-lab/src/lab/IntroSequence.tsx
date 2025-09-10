import { useEffect, useMemo, useState } from 'react';

export default function IntroSequence({ enhanced = false }: { enhanced?: boolean }){
	const images = useMemo(() => ['/white.webp', '/head_loop.webp', '/head_loop_vhs.webp'], []);
	const [started, setStarted] = useState(false);
	const [index, setIndex] = useState(0);

	useEffect(() => {
		function handleSplashHidden(){ setStarted(true); }
		// Start immediately if splash is already gone
		if (!document.getElementById('splash')) { setStarted(true); }
		else { window.addEventListener('ace:splash-hidden', handleSplashHidden, { once: true } as any); }
		return () => { window.removeEventListener('ace:splash-hidden', handleSplashHidden as any); };
	}, []);

	useEffect(() => {
		if (!started) return;
		const id = setInterval(() => { setIndex((i) => (i + 1) % images.length); }, 5000);
		return () => clearInterval(id);
	}, [started, images.length]);

	const src = images[index];
	return (
		<div className="w-full h-full bg-black" style={{ boxSizing: 'border-box', paddingLeft: '0.25in', paddingRight: '0.25in', filter: enhanced ? 'contrast(1.15) saturate(1.25) brightness(1.06) drop-shadow(0 0 12px rgba(0,0,0,0.25))' : undefined }}>
			<img src={src} alt="intro" className="w-full h-full object-cover" style={{ display: 'block' }} />
		</div>
	);
}


