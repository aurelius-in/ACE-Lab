import { useState } from 'react';
import { useLabStore } from '../store/useLabStore';
import type { AnimateResponse, RifeResponse } from '../types/services';
import { fetchJsonWithRetry } from '../utils/net';

export default function MotionPanel(){
	const [prompt, setPrompt] = useState('looping neon waveform');
	const [seconds, setSeconds] = useState<2|4>(2);
	const [fps, setFps] = useState<12|24>(12);
	const [loading, setLoading] = useState(false);
	const [videoUrl, setVideoUrl] = useState<string | null>(null);
	const setPrimaryVideo = useLabStore(s=>s.setPrimaryVideo)!;
	const setSecondaryVideo = useLabStore(s=>s.setSecondaryVideo)!;
	const setEffectId = useLabStore(s=>s.setEffectId);
	const addClip = useLabStore(s=>s.addClip!);

    async function animate(){
		setLoading(true);
		try {
            const token = localStorage.getItem('ace-token');
            const j = await fetchJsonWithRetry<AnimateResponse>('http://localhost:8101/animate', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ prompt, seconds, fps, width: 512, height: 512 }) }, { retries: 2, backoffMs: 500 });
			setVideoUrl(j.video_url || null);
		} catch {
			useLabStore.getState().showToast?.('Animate failed');
		} finally { setLoading(false); }
	}

    async function interpolate(factor: 2|3){
		if (!videoUrl) return;
		setLoading(true);
		try {
            const token = localStorage.getItem('ace-token');
            const j = await fetchJsonWithRetry<RifeResponse>('http://localhost:8102/interpolate', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ video_url: videoUrl, factor }) }, { retries: 2, backoffMs: 500 });
			setVideoUrl(j.video_url || videoUrl);
		} catch {
			useLabStore.getState().showToast?.('RIFE failed');
		} finally { setLoading(false); }
	}

	function sendToCanvas(){ if (videoUrl) setPrimaryVideo(videoUrl); }
	function sendToTimeline(){
		if (!videoUrl) return;
		setSecondaryVideo(videoUrl);
		setEffectId('crosszoom');
		const setState = (useLabStore.setState as unknown) as (p: any) => void;
		setState({ timeline: { keyframes: [ { t: 0.0, mix: 0 }, { t: 0.5, mix: 1 }, { t: 1.0, mix: 0 } ] } });
		window.dispatchEvent(new Event('ace:scroll-timeline'));
		// also record in clip list
		addClip({ id: String(Date.now()), kind: 'video', src: videoUrl, durationSec: Number(seconds) || 2, name: 'Motion clip' });
	}

	return (
		<div className="space-y-3">
			<div className="flex gap-2 items-center">
				<input className="flex-1 input" aria-label="Prompt" title="Prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Prompt" />
				<select className="input" aria-label="Seconds" title="Seconds" value={seconds} onChange={e=>setSeconds(Number(e.target.value) as 2|4)}>
					<option value={2}>2s</option>
					<option value={4}>4s</option>
				</select>
				<select className="input" aria-label="FPS" title="FPS" value={fps} onChange={e=>setFps(Number(e.target.value) as 12|24)}>
					<option value={12}>12 fps</option>
					<option value={24}>24 fps</option>
				</select>
				<button className="btn-compact" aria-label="Animate" title="Animate" onClick={animate} disabled={loading}>{loading ? 'Working…' : 'Animate'}</button>
			</div>
			{videoUrl && (
				<div className="space-y-2">
					<video src={videoUrl} controls className="w-full rounded" aria-label="Preview" />
					<div className="flex gap-2">
						<button className="btn-compact" aria-label="RIFE 2x" title="RIFE 2x" onClick={()=>interpolate(2)} disabled={loading}>RIFE 2×</button>
						<button className="btn-compact" aria-label="RIFE 3x" title="RIFE 3x" onClick={()=>interpolate(3)} disabled={loading}>RIFE 3×</button>
						<button className="btn-primary" aria-label="Send to Canvas" title="Send to Canvas" onClick={sendToCanvas}>Send to Canvas</button>
						<button className="btn-compact" aria-label="Send to Timeline" title="Send to Timeline" onClick={sendToTimeline}>Send to Timeline</button>
					</div>
				</div>
			)}
		</div>
	);
}


