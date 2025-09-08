import { useLabStore } from '../../store/useLabStore';

export default function PresetsPanel(){
	const presets = useLabStore(s => s.presets);
	const apply = useLabStore(s => s.applyPreset);
	if (!presets.length) return <div className="text-white/60">No presets yet</div>;
	return (
		<div className="flex flex-wrap gap-2">
			{presets.map(p => (
				<button key={p.id} onClick={() => apply(p)} className="px-3 py-1 rounded-full border border-white/10 ace-gradient-text">
					{p.name}
				</button>
			))}
		</div>
	);
}


