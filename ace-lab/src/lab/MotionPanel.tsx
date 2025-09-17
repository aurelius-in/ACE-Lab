import { useState } from 'react';
import { useLabStore } from '../store/useLabStore';
import type { AnimateResponse, RifeResponse } from '../types/services';

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
			const r = await fetch('http://localhost:8101/animate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, seconds, fps, width: 512, height: 512 }) });
			if (!r.ok) throw new Error('Animate failed');
			const j: AnimateResponse = await r.json();
			setVideoUrl(j.video_url || null);
		} catch {
			useLabStore.getState().showToast?.('Animate failed');
		} finally { setLoading(false); }
	}

	async function interpolate(factor: 2|3){
		if (!videoUrl) return;
		setLoading(true);
		try {
			const r = await fetch('http://localhost:8102/interpolate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ video_url: videoUrl, factor }) });
			if (!r.ok) throw new Error('RIFE failed');
			const j: RifeResponse = await r.json();
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
				<input className="flex-1 input" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Prompt" />
				<select className="input" value={seconds} onChange={e=>setSeconds(Number(e.target.value) as 2|4)}>
					<option value={2}>2s</option>
					<option value={4}>4s</option>
				</select>
				<select className="input" value={fps} onChange={e=>setFps(Number(e.target.value) as 12|24)}>
					<option value={12}>12 fps</option>
					<option value={24}>24 fps</option>
				</select>
				<button className="btn-compact" onClick={animate} disabled={loading}>{loading ? 'Working…' : 'Animate'}</button>
			</div>
			{videoUrl && (
				<div className="space-y-2">
					<video src={videoUrl} controls className="w-full rounded" />
					<div className="flex gap-2">
						<button className="btn-compact" onClick={()=>interpolate(2)} disabled={loading}>RIFE 2×</button>
						<button className="btn-compact" onClick={()=>interpolate(3)} disabled={loading}>RIFE 3×</button>
						<button className="btn-primary" onClick={sendToCanvas}>Send to Canvas</button>
						<button className="btn-compact" onClick={sendToTimeline}>Send to Timeline</button>
					</div>
				</div>
			)}
		</div>
	);
}


