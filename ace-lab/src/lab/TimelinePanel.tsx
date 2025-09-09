import { useLabStore } from '../store/useLabStore';
import { useRef, useState } from 'react';

export default function TimelinePanel() {
	const keyframes = useLabStore(s => s.timeline.keyframes);
	const setTimeline = useLabStore.setState as (partial: any) => void;
	const play = useLabStore(s => s.play);
	const setPlayhead = useLabStore(s => s.setPlayhead);
	const togglePlay = useLabStore(s => s.togglePlay);
	const barRef = useRef<HTMLDivElement|null>(null);
	const [dragIdx, setDragIdx] = useState<number|null>(null);

	function onDown(_e: React.MouseEvent, idx: number){
		const bar = barRef.current; if (!bar) return;
		const rect = bar.getBoundingClientRect();
		setDragIdx(idx);
		function move(ev: MouseEvent){
			const dx = ev.clientX - rect.left;
			let t = Math.max(0, Math.min(1, dx / rect.width));
			// snapping: default 0.05, Shift = finer 0.01, Alt = coarse 0.1
			const step = ev.shiftKey ? 0.01 : (ev.altKey ? 0.1 : 0.05);
			t = Math.round(t / step) * step;
			const next = keyframes.map((k, i) => i===idx ? { ...k, t } : k);
			setTimeline({ timeline: { keyframes: next } });
			setPlayhead(t);
		}
		function up(){ setDragIdx(null); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up);} 
		window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
	}

	return (
		<div className="mt-4">
			<div className="flex items-center justify-between mb-2">
				<h2 className="text-lg font-semibold ace-gradient-text">Timeline</h2>
				<div className="flex items-center gap-2">
					<button className="btn-primary" onClick={togglePlay}>{play.playing ? 'Pause' : 'Play'}</button>
					<input type="range" min={0} max={1} step={0.001} value={play.t} onChange={(e)=>setPlayhead(Number(e.target.value))} className="w-48" />
				</div>
			</div>
			<div ref={barRef} className="relative h-20 card-dark p-2 overflow-hidden">
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
					<div key={i} className="absolute -translate-x-1/2 cursor-pointer" style={{ left: `${k.t*100}%` }} onMouseDown={(e)=>onDown(e,i)}>
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


