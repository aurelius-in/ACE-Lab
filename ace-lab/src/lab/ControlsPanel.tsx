import { useLabStore } from '../store/useLabStore';
import { cubeTextToDataURL } from '../utils/lut';

export default function ControlsPanel() {
	const effect = useLabStore(s => s.effect);
	const setParam = useLabStore(s => s.setEffectParam);
	const setPrimary = useLabStore(s => s.setPrimary);
	const setSecondary = useLabStore(s => s.setSecondary);
	const setPrimaryVideo = useLabStore(s => s.setPrimaryVideo);
	const setSecondaryVideo = useLabStore(s => s.setSecondaryVideo);
	const setNoiseOpacity = useLabStore(s => s.setNoiseOpacity);
	const setLutSrc = useLabStore(s => s.setLutSrc!);
	const lutSrc = useLabStore(s => s.assets?.lutSrc);

	function onFile(e: React.ChangeEvent<HTMLInputElement>, which: 'primary'|'secondary'|'lut') {
		const f = e.target.files?.[0]; if (!f) return;
		const url = URL.createObjectURL(f);
		if (which==='primary') {
			if (f.type.startsWith('video/')) setPrimaryVideo?.(url); else setPrimary(url);
		} else if (which==='secondary') {
			if (f.type.startsWith('video/')) setSecondaryVideo?.(url); else setSecondary(url);
		} else {
			if (f.name.toLowerCase().endsWith('.cube')) {
				f.text().then(cubeTextToDataURL).then(setLutSrc);
			} else {
				setLutSrc(url);
			}
		}
	}

	return (
		<div className="space-y-4 bg-white text-black rounded-lg p-3">
			<h2 className="text-lg font-semibold">Effects</h2>
			<div className="space-y-3">
				<label className="block text-sm">
					<span className="text-black/70">Image/Video A</span>
					<input type="file" accept="image/*,video/*" onChange={(e)=>onFile(e,'primary')} className="block mt-1 text-sm" />
				</label>
				<label className="block text-sm">
					<span className="text-black/70">Image/Video B</span>
					<input type="file" accept="image/*,video/*" onChange={(e)=>onFile(e,'secondary')} className="block mt-1 text-sm" />
				</label>
				<label className="block text-sm">
					<span className="text-black/70">LUT (PNG or .cube)</span>
					<input type="file" accept="image/png,.cube" onChange={(e)=>onFile(e,'lut')} className="block mt-1 text-sm" />
					{lutSrc && (
						<div className="mt-2 flex items-center gap-2">
							<img src={lutSrc} alt="LUT" className="w-24 h-6 object-cover rounded border border-black/10" />
							<button className="btn-compact" onClick={()=>setLutSrc(undefined)}>Clear LUT</button>
						</div>
					)}
				</label>
				{Object.entries(effect.params).filter(([k])=>!['bloomStrength','lutAmount','samples','zoomStrength','bloomThreshold','grainAmount','vignette01'].includes(k) || effect.id==='halftone').map(([k, v]) => (
					<label key={k} className="block text-sm">
						<div className="flex justify-between"><span className="text-black/70">{k}</span><span className="text-black/60">{typeof v === 'number' ? Number(v).toFixed(2) : String(v)}</span></div>
						<input aria-label={k} type="range" min={k==='dotScale'?1:0} max={k==='dotScale'?64: (k==='contrast'?2:1)} step={k==='dotScale'?1:0.01} value={Number(v)} className="w-full" onChange={(e) => setParam(k, Number((e.target as HTMLInputElement).value))} />
					</label>
				))}
				<div className="grid grid-cols-2 gap-3">
					<label className="block text-sm">
						<div className="flex justify-between"><span className="text-black/70">bloomStrength</span><span className="text-black/60">{(effect.params as any).bloomStrength?.toFixed?.(2) ?? '0.25'}</span></div>
						<input type="range" min={0} max={1} step={0.01} value={(effect.params as any).bloomStrength ?? 0.25} onChange={(e)=>setParam('bloomStrength', Number(e.target.value))} className="w-full" />
					</label>
					<label className="block text-sm">
						<div className="flex justify-between"><span className="text-black/70">bloomThreshold</span><span className="text-black/60">{(effect.params as any).bloomThreshold?.toFixed?.(2) ?? '0.70'}</span></div>
						<input type="range" min={0} max={1} step={0.01} value={(effect.params as any).bloomThreshold ?? 0.7} onChange={(e)=>setParam('bloomThreshold', Number(e.target.value))} className="w-full" />
					</label>
					<label className="block text-sm">
						<div className="flex justify-between"><span className="text-black/70">lutAmount</span><span className="text-black/60">{(effect.params as any).lutAmount?.toFixed?.(2) ?? '0.20'}</span></div>
						<input type="range" min={0} max={1} step={0.01} value={(effect.params as any).lutAmount ?? 0.2} onChange={(e)=>setParam('lutAmount', Number(e.target.value))} className="w-full" />
					</label>
					<label className="block text-sm">
						<div className="flex justify-between"><span className="text-black/70">grainAmount</span><span className="text-black/60">{(effect.params as any).grainAmount?.toFixed?.(2) ?? '0.05'}</span></div>
						<input type="range" min={0} max={0.3} step={0.005} value={(effect.params as any).grainAmount ?? 0.05} onChange={(e)=>setParam('grainAmount', Number(e.target.value))} className="w-full" />
					</label>
					<label className="block text-sm">
						<div className="flex justify-between"><span className="text-black/70">vignette</span><span className="text-black/60">{(effect.params as any).vignette01?.toFixed?.(2) ?? '1.00'}</span></div>
						<input type="range" min={0} max={1} step={0.05} value={(effect.params as any).vignette01 ?? 1} onChange={(e)=>setParam('vignette01', Number(e.target.value))} className="w-full" />
					</label>
				</div>
				<label className="block text-sm">
					<div className="flex justify-between"><span className="text-black/70">background noise</span></div>
					<input type="range" min={0} max={0.2} step={0.005} defaultValue={0.02} onChange={(e)=>setNoiseOpacity(Number(e.target.value))} className="w-full" />
				</label>
			</div>
		</div>
	);
}


