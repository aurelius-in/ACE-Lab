import { useLabStore } from '../store/useLabStore';

export default function TimelinePanel() {
	const keyframes = useLabStore(s => s.timeline.keyframes);
	const play = useLabStore(s => s.play);
	const setPlayhead = useLabStore(s => s.setPlayhead);
	const togglePlay = useLabStore(s => s.togglePlay);
	return (
		<div className="mt-4">
			<div className="flex items-center justify-between mb-2">
				<h2 className="text-lg font-semibold ace-gradient-text">Timeline</h2>
				<div className="flex items-center gap-2">
					<button className="btn-primary" onClick={togglePlay}>{play.playing ? 'Pause' : 'Play'}</button>
					<input type="range" min={0} max={1} step={0.001} value={play.t} onChange={(e)=>setPlayhead(Number(e.target.value))} className="w-48" />
				</div>
			</div>
			<div className="relative h-16 card-dark p-2 overflow-hidden">
				<div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
				{keyframes.map((k, i) => (
					<div key={i} className="absolute -translate-x-1/2" style={{ left: `${k.t*100}%` }}>
						<div className="w-3 h-3 rotate-45 bg-white/80" />
					</div>
				))}
				<div className="absolute top-2 -translate-x-1/2" style={{ left: `${play.t*100}%` }}>
					<div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-white/80" />
				</div>
			</div>
		</div>
	);
}


