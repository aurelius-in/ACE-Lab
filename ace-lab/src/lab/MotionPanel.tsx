import { useState } from 'react';
import { useLabStore } from '../store/useLabStore';

export default function MotionPanel(){
	const [prompt, setPrompt] = useState('looping neon waveform');
	const [seconds, setSeconds] = useState<2|4>(2);
	const [fps, setFps] = useState<12|24>(12);
	const [loading, setLoading] = useState(false);
	const [videoUrl, setVideoUrl] = useState<string | null>(null);
	const setPrimaryVideo = useLabStore(s=>s.setPrimaryVideo)!;

	async function animate(){
		setLoading(true);
		try {
			const r = await fetch('http://localhost:8101/animate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, seconds, fps, width: 512, height: 512 }) });
			const j = await r.json();
			setVideoUrl(j.video_url || null);
		} finally { setLoading(false); }
	}

	async function interpolate(factor: 2|3){
		if (!videoUrl) return;
		setLoading(true);
		try {
			const r = await fetch('http://localhost:8102/interpolate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ video_url: videoUrl, factor }) });
			const j = await r.json();
			setVideoUrl(j.video_url || videoUrl);
		} finally { setLoading(false); }
	}

	function sendToCanvas(){ if (videoUrl) setPrimaryVideo(videoUrl); }

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
					</div>
				</div>
			)}
		</div>
	);
}


