import { useLabStore } from '../store/useLabStore';
import { useRef, useState } from 'react';

function ease(t: number, mode: 'linear'|'easeIn'|'easeOut'|'easeInOut'){
	if (mode === 'easeIn') return t*t;
	if (mode === 'easeOut') return 1 - (1-t)*(1-t);
	if (mode === 'easeInOut') return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
	return t;
}

export default function TimelinePanel() {
	const keyframes = useLabStore(s => s.timeline.keyframes);
	const setTimeline = useLabStore.setState as (partial: any) => void;
    const clips = useLabStore(s => s.clips || []);
	const addClip = useLabStore(s => s.addClip!);
	const removeClip = useLabStore(s => s.removeClip!);
	const reorderClips = useLabStore(s => s.reorderClips!);
	const setClipDuration = useLabStore(s => s.setClipDuration!);
	const play = useLabStore(s => s.play);
	const setPlayhead = useLabStore(s => s.setPlayhead);
	const togglePlay = useLabStore(s => s.togglePlay);
	const barRef = useRef<HTMLDivElement|null>(null);
	const [dragIdx, setDragIdx] = useState<number|null>(null);
	const baseSnap = Number(localStorage.getItem('ace.snapStep') || '0.05');
	const easingMode = useLabStore(s => s.timelineEasing) || 'linear';
	const setEasing = useLabStore(s => s.setTimelineEasing!);

	function addKeyframeAt(clientX: number){
		const bar = barRef.current; if (!bar) return;
		const rect = bar.getBoundingClientRect();
		let t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		const step = baseSnap; t = Math.round(t/step)*step;
		const next = [...keyframes, { t, mix: 1 }].sort((a,b)=>a.t-b.t);
		setTimeline({ timeline: { keyframes: next } });
	}

	function onDown(_e: React.MouseEvent, idx: number){
		const bar = barRef.current; if (!bar) return;
		const rect = bar.getBoundingClientRect();
		setDragIdx(idx);
		function move(ev: MouseEvent){
			const dx = ev.clientX - rect.left;
			let t = Math.max(0, Math.min(1, dx / rect.width));
			// snapping: default from settings, Shift = finer 0.25x, Alt = coarse 2x
			const step = ev.shiftKey ? baseSnap*0.25 : (ev.altKey ? baseSnap*2 : baseSnap);
			t = Math.round(t / step) * step;
			const next = keyframes.map((k, i) => i===idx ? { ...k, t } : k);
			setTimeline({ timeline: { keyframes: next } });
			setPlayhead(t);
		}
		function up(){ setDragIdx(null); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up);} 
		window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
	}

	function onBarClick(e: React.MouseEvent){
		if ((e.target as HTMLElement).closest('[data-kf]')) return;
		addKeyframeAt(e.clientX);
	}
	function onDiamondDown(e: React.MouseEvent, i: number){
		if (e.altKey) {
			const next = keyframes.filter((_,idx)=>idx!==i);
			setTimeline({ timeline: { keyframes: next } });
			return;
		}
		onDown(e,i);
	}

	// Compute mix based on keyframes and easing
	function mixAt(t: number){
		const keys = keyframes; if(keys.length===0) return 0; let prev = keys[0];
		for (let i=1;i<keys.length;i++){
			const cur = keys[i];
			if (t<=cur.t){ const span = cur.t - prev.t || 1; const local = (t - prev.t)/span; const shaped = ease(Math.max(0, Math.min(1, local)), easingMode), val = prev.mix*(1-shaped)+cur.mix*shaped; return val; }
			prev = cur;
		}
		return keys[keys.length-1].mix;
	}

	return (
		<div className="mt-4">
			<div className="flex items-center justify-between mb-2">
				<h2 className="text-lg font-semibold ace-gradient-text">Timeline</h2>
				<div className="flex items-center gap-2">
					<label className="text-xs text-white/70 flex items-center gap-1">
						<span>Easing</span>
						<select value={easingMode} onChange={(e)=>setEasing(e.target.value as any)} className="px-2 py-1 rounded bg-black/30 border border-white/10">
							<option value="linear">Linear</option>
							<option value="easeIn">Ease In</option>
							<option value="easeOut">Ease Out</option>
							<option value="easeInOut">Ease In Out</option>
						</select>
					</label>
					<button className="btn-primary" onClick={togglePlay}>{play.playing ? 'Pause' : 'Play'}</button>
					<input type="range" min={0} max={1} step={0.001} value={play.t} onChange={(e)=>setPlayhead(Number(e.target.value))} className="w-48" />
				</div>
			</div>
			{/* Clips row */}
			<div className="card-dark p-2 mt-2">
				<div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-white/80">Clips</div>
					<div className="flex items-center gap-2">
						<button className="btn-compact" onClick={()=> addClip({ id: String(Date.now()), kind: 'image', src: '/white.webp', durationSec: 3, name: 'Still' })}>Add still</button>
						<button className="btn-compact" onClick={()=> addClip({ id: String(Date.now()+1), kind: 'video', src: '/head_loop.webp', durationSec: 3, name: 'Clip' })}>Add clip</button>
					</div>
				</div>
				{clips.length === 0 ? (
					<div className="text-white/60 text-sm">No clips yet.</div>
				) : (
					<div className="space-y-2">
                        {clips.map((c, idx) => (
							<div key={c.id} className="flex items-center gap-2 bg-black/30 rounded p-2">
								<div className="w-12 h-8 bg-white/10 rounded" aria-label="thumbnail" />
								<div className="flex-1">
									<div className="text-xs text-white/80">{c.name || c.kind}</div>
									<div className="text-[10px] text-white/50 break-all">{c.src}</div>
								</div>
								<label className="text-[10px] text-white/70 flex items-center gap-1">
									<span>sec</span>
									<input aria-label="clip duration" className="w-16 input" type="number" min={1} max={30} value={c.durationSec} onChange={(e)=> setClipDuration(c.id, Math.max(1, Math.min(30, Number(e.target.value)||1)))} />
								</label>
								<div className="flex items-center gap-1">
									<button aria-label="move up" className="btn-compact" disabled={idx===0} onClick={()=> reorderClips(idx, idx-1)}>↑</button>
									<button aria-label="move down" className="btn-compact" disabled={idx===clips.length-1} onClick={()=> reorderClips(idx, idx+1)}>↓</button>
									<button aria-label="remove clip" className="btn-compact" onClick={()=> removeClip(c.id)}>Remove</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
            <div className="mt-2 flex justify-end">
                <button className="btn-compact" aria-label="Export timeline" title="Export timeline" onClick={()=>{
                    (async () => {
                        const s = useLabStore.getState();
                        const { exportClipsToWebm } = await import('../utils/media');
                        const width = s.exportSettings.width || 1280;
                        const height = s.exportSettings.height || 720;
                        const blob = await exportClipsToWebm(s.clips||[], { width, height, fps: 30, bitrateKbps: s.exportSettings.bitrateKbps || 6000, audioUrl: s.exportSettings.audioUrl, audioVolume: s.exportSettings.audioVolume, onProgress: ()=>{} });
                        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'timeline.webm'; a.click(); URL.revokeObjectURL(url);
                    })();
                }}>Export Timeline</button>
            </div>
			<div ref={barRef} className="relative h-20 card-dark p-2 overflow-hidden" onMouseDown={onBarClick}>
				{/* grid */}
				<div className="absolute inset-0">
					{Array.from({ length: 21 }).map((_,i)=> (
						<div key={i} className="absolute top-2 bottom-2" style={{ left: `${(i*5)}%` }}>
							<div className={`w-px h-full ${i%5===0 ? 'bg-white/20' : 'bg-white/10'}`} />
							{i%5===0 && <div className="absolute -top-2 -translate-x-1/2 text-[10px] text-white/60">{(i*5)/100}</div>}
						</div>
					))}
				</div>
				<div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
				{keyframes.map((k, i) => (
					<div key={i} data-kf className="absolute -translate-x-1/2 cursor-pointer" style={{ left: `${k.t*100}%` }} onMouseDown={(e)=>onDiamondDown(e,i)}>
						<div className="w-3 h-3 rotate-45 bg-white/80" />
						{dragIdx===i && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] bg-black/70 px-1 rounded">{Math.round(k.t*100)}%</div>}
					</div>
				))}
				<div className="absolute top-2 -translate-x-1/2" style={{ left: `${play.t*100}%` }}>
					<div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-white/80" />
				</div>
			</div>
		</div>
	);
}


