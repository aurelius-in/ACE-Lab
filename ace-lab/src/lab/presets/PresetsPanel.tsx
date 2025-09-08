import { useEffect, useState } from 'react';
import { useLabStore } from '../../store/useLabStore';

export default function PresetsPanel(){
	const presets = useLabStore(s => s.presets);
	const apply = useLabStore(s => s.applyPreset);
	const setEffectId = useLabStore(s => s.setEffectId);
	const [builtin, setBuiltin] = useState<{ id: string; name: string; params: Record<string, number> }[]>([]);
	useEffect(() => {
		import('./builtin.json').then(m => setBuiltin(m.default as any)).catch(()=>{});
	}, []);
	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-sm text-white/70 mb-2">Built-in</h3>
				<div className="flex flex-wrap gap-2">
					{builtin.map(p => (
						<button key={p.id} onClick={() => { setEffectId(p.id.startsWith('builtin-crosszoom') ? 'crosszoom' : 'halftone'); apply({ id: p.id, name: p.name, params: p.params }); }} className="px-3 py-1 rounded-full border border-white/10 ace-gradient-text">
							{p.name}
						</button>
					))}
				</div>
			</div>
			<div>
				<h3 className="text-sm text-white/70 mb-2">Your Presets</h3>
				{presets.length === 0 ? <div className="text-white/60">None yet</div> : (
					<div className="flex flex-wrap gap-2">
						{presets.map(p => (
							<button key={p.id} onClick={() => apply(p)} className="px-3 py-1 rounded-full border border-white/10 ace-gradient-text">
								{p.name}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}


