import { useLabStore } from '../store/useLabStore';

export default function ControlsPanel() {
	const effect = useLabStore(s => s.effect);
	const setParam = useLabStore(s => s.setEffectParam);
	const setPrimary = useLabStore(s => s.setPrimary);
	const setSecondary = useLabStore(s => s.setSecondary);
	const setNoiseOpacity = useLabStore(s => s.setNoiseOpacity);

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
				{Object.entries(effect.params).filter(([k])=>!['bloomStrength','lutAmount','samples','zoomStrength'].includes(k) || effect.id==='halftone').map(([k, v]) => (
					<label key={k} className="block text-sm">
						<div className="flex justify-between"><span className="text-white/70">{k}</span><span className="text-white/60">{typeof v === 'number' ? Number(v).toFixed(2) : String(v)}</span></div>
						<input aria-label={k} type="range" min={k==='dotScale'?1:0} max={k==='dotScale'?64: (k==='contrast'?2:1)} step={k==='dotScale'?1:0.01} value={Number(v)} className="w-full" onChange={(e) => setParam(k, Number((e.target as HTMLInputElement).value))} />
					</label>
				))}
				<div className="grid grid-cols-2 gap-3">
					<label className="block text-sm">
						<div className="flex justify-between"><span className="text-white/70">bloomStrength</span><span className="text-white/60">{(effect.params as any).bloomStrength?.toFixed?.(2) ?? '0.25'}</span></div>
						<input type="range" min={0} max={1} step={0.01} value={(effect.params as any).bloomStrength ?? 0.25} onChange={(e)=>setParam('bloomStrength', Number(e.target.value))} className="w-full" />
					</label>
					<label className="block text-sm">
						<div className="flex justify-between"><span className="text-white/70">lutAmount</span><span className="text-white/60">{(effect.params as any).lutAmount?.toFixed?.(2) ?? '0.20'}</span></div>
						<input type="range" min={0} max={1} step={0.01} value={(effect.params as any).lutAmount ?? 0.2} onChange={(e)=>setParam('lutAmount', Number(e.target.value))} className="w-full" />
					</label>
				</div>
				<label className="block text-sm">
					<div className="flex justify-between"><span className="text-white/70">background noise</span></div>
					<input type="range" min={0} max={0.2} step={0.005} defaultValue={0.02} onChange={(e)=>setNoiseOpacity(Number(e.target.value))} className="w-full" />
				</label>
			</div>
		</div>
	);
}


