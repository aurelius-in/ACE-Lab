import { useLabStore } from '../store/useLabStore';

export default function ControlsPanel() {
	const effect = useLabStore(s => s.effect);
	const setParam = useLabStore(s => s.setEffectParam);
	const setPrimary = useLabStore(s => s.setPrimary);
	const setSecondary = useLabStore(s => s.setSecondary);

	function onFile(e: React.ChangeEvent<HTMLInputElement>, which: 'primary'|'secondary') {
		const f = e.target.files?.[0]; if (!f) return;
		const url = URL.createObjectURL(f); which==='primary' ? setPrimary(url) : setSecondary(url);
	}

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold ace-gradient-text">Effects</h2>
			<div className="space-y-3">
				<label className="block text-sm">
					<span className="text-white/70">Image A</span>
					<input type="file" accept="image/*" onChange={(e)=>onFile(e,'primary')} className="block mt-1 text-sm" />
				</label>
				<label className="block text-sm">
					<span className="text-white/70">Image B</span>
					<input type="file" accept="image/*" onChange={(e)=>onFile(e,'secondary')} className="block mt-1 text-sm" />
				</label>
				{Object.entries(effect.params).map(([k, v]) => (
					<label key={k} className="block text-sm">
						<div className="flex justify-between"><span className="text-white/70">{k}</span><span className="text-white/60">{typeof v === 'number' ? v.toFixed(2) : String(v)}</span></div>
						<input aria-label={k} type="range" min={k==='dotScale'?1:0} max={k==='dotScale'?64: (k==='contrast'?2:1)} step={k==='dotScale'?1:0.01} value={Number(v)}
							className="w-full"
							onChange={(e) => setParam(k, Number((e.target as HTMLInputElement).value))} />
					</label>
				))}
			</div>
		</div>
	);
}


