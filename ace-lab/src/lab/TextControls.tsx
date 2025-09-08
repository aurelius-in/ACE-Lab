import { useLabStore } from '../store/useLabStore';

export default function TextControls(){
	const text = useLabStore(s=>s.text);
	const setValue = useLabStore(s=>s.setTextValue);
	const setParam = useLabStore(s=>s.setTextParam);
	const toggle = useLabStore(s=>s.toggleText);
	return (
		<div className="space-y-3">
			<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={text.enabled} onChange={e=>toggle(e.target.checked)} /> Enable Text</label>
			<input type="text" value={text.value} onChange={e=>setValue(e.target.value)} placeholder="Overlay text" className="w-full rounded-lg bg-black/30 border border-white/10 px-2 py-1" />
			{(['amp','freq','speed','outlinePx'] as const).map(k=> (
				<label key={k} className="block text-sm">
					<div className="flex justify-between"><span className="text-white/70">{k}</span><span className="text-white/60">{(text.params as any)[k]}</span></div>
					<input type="range" min={k==='outlinePx'?0:0} max={k==='outlinePx'?8: (k==='amp'?40:(k==='freq'?40:10))} step={1} value={(text.params as any)[k]} onChange={e=>setParam(k, Number(e.target.value))} className="w-full" />
				</label>
			))}
		</div>
	);
}


