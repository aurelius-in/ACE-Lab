import { useEffect, useRef, useState } from 'react';
import { useLabStore } from '../../store/useLabStore';
import { downloadJson } from '../../utils/media';

export default function PresetsPanel(){
	const presets = useLabStore(s => s.presets);
	const apply = useLabStore(s => s.applyPreset);
	const setEffectId = useLabStore(s => s.setEffectId);
	const setTextParam = useLabStore(s => s.setTextParam);
	const toggleText = useLabStore(s => s.toggleText);
	const fileRef = useRef<HTMLInputElement|null>(null);
	const [builtin, setBuiltin] = useState<{ id: string; name: string; params: Record<string, number> }[]>([]);
	useEffect(() => {
		import('./builtin.json').then(m => setBuiltin(m.default as any)).catch(()=>{});
	}, []);
	function onExport(){
		downloadJson('ace-presets.json', presets);
	}
	async function onImport(ev: React.ChangeEvent<HTMLInputElement>){
		const f = ev.target.files?.[0]; if (!f) return;
		try {
			const txt = await f.text();
			const data = JSON.parse(txt);
			if (!Array.isArray(data)) throw new Error('Invalid');
			const cleaned = data.filter((p)=> p && typeof p.id==='string' && typeof p.name==='string' && typeof p.params==='object');
			(useLabStore.setState as any)({ presets: cleaned });
		} catch {}
		finally { if (fileRef.current) fileRef.current.value = ''; }
	}
	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-sm text-white/70 mb-2">Built-in</h3>
				<div className="flex flex-wrap gap-2">
					{builtin.map(p => (
						<button key={p.id} onClick={() => {
							if (p.id.startsWith('builtin-crosszoom')) setEffectId('crosszoom');
							else if (p.id.startsWith('builtin-halftone')) setEffectId('halftone');
							else if (p.id.startsWith('builtin-vhs')) setEffectId('vhs');
							else if (p.id.startsWith('builtin-textwave')) { toggleText(true); Object.entries(p.params).forEach(([k,v]) => setTextParam(k as any, v as number)); return; }
							apply({ id: p.id, name: p.name, params: p.params });
						}} className="px-3 py-1 rounded-full border border-white/10 ace-gradient-text">
							{p.name}
						</button>
					))}
				</div>
			</div>
			<div>
				<div className="flex items-center justify-between mb-2">
					<h3 className="text-sm text-white/70">Your Presets</h3>
					<div className="flex gap-2">
						<button className="btn-primary" onClick={onExport}>Export</button>
						<button className="btn-primary" onClick={()=>fileRef.current?.click()}>Import</button>
						<input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
					</div>
				</div>
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


