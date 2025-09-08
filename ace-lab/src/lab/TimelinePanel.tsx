import { useLabStore } from '../store/useLabStore';

export default function TimelinePanel() {
	const keyframes = useLabStore(s => s.timeline.keyframes);
	return (
		<div className="mt-4">
			<h2 className="text-lg font-semibold ace-gradient-text">Timeline</h2>
			<div className="relative h-16 card-dark p-2 overflow-hidden">
				<div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
				{keyframes.map((k, i) => (
					<div key={i} className="absolute -translate-x-1/2" style={{ left: `${k.t*100}%` }}>
						<div className="w-3 h-3 rotate-45 bg-white/80" />
					</div>
				))}
			</div>
		</div>
	);
}


