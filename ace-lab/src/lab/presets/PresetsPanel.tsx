import { useEffect, useRef, useState } from 'react';
import { useLabStore } from '../../store/useLabStore';
import { downloadJson } from '../../utils/media';

type Builtin = { id: string; name: string; params: Record<string, number> };
function categoryOf(p: Builtin){
	const id = p.id.toLowerCase();
	if (id.includes('print')) return 'Print';
	if (id.includes('mobile')) return 'Mobile';
	if (id.includes('cinematic')) return 'Cinematic';
	if (id.includes('mono')) return 'Monochrome';
	if (id.includes('vhs')) return 'VHS';
	if (id.includes('textwave')) return 'Text';
	return 'General';
}

export default function PresetsPanel(){
	const presets = useLabStore(s => s.presets);
	const apply = useLabStore(s => s.applyPreset);
	const setEffectId = useLabStore(s => s.setEffectId);
	const setTextParam = useLabStore(s => s.setTextParam);
	const toggleText = useLabStore(s => s.toggleText);
	const effect = useLabStore(s => s.effect);
	const setState = useLabStore.setState as (p: any) => void;
	const showToast = useLabStore(s => s.showToast);
	const [newName, setNewName] = useState('My ACE Preset');
	const [useServer, setUseServer] = useState(false);
	const fileRef = useRef<HTMLInputElement|null>(null);
	const [builtin, setBuiltin] = useState<Builtin[]>([]);
	useEffect(() => {
		import('./builtin.json').then(m => setBuiltin(m.default as any)).catch(()=>{});
	}, []);

	const grouped = builtin.reduce((acc, b) => { const c = categoryOf(b); (acc[c] ||= []).push(b); return acc; }, {} as Record<string, Builtin[]>);

	async function refreshFromServer(){
		try { const r = await fetch('http://localhost:4000/presets'); const j = await r.json(); setState({ presets: j }); showToast?.('Loaded presets from server'); } catch {}
	}
	async function pushToServer(preset: { id: string; name: string; params: Record<string, number>; thumb?: string }){
		try {
			const t = localStorage.getItem('ace-token');
			await fetch('http://localhost:4000/presets', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: JSON.stringify(preset) });
			showToast?.('Synced to server');
		} catch {}
	}

	function onExport(){
		downloadJson('ace-presets.json', presets);
	}
	async function onImport(ev: React.ChangeEvent<HTMLInputElement>){
		const f = ev.target.files?.[0]; if (!f) return;
		try {
			const txt = await f.text();
			const data = JSON.parse(txt);
			if (!Array.isArray(data)) throw new Error('Invalid');
			const cleaned = data.filter((p: any)=> p && typeof p.id==='string' && typeof p.name==='string' && typeof p.params==='object');
			setState({ presets: cleaned });
		} catch {}
		finally { if (fileRef.current) fileRef.current.value = ''; }
	}
	async function saveCurrent(){
		const id = `user-${Date.now()}`;
		// capture tiny preview of current canvas
		let thumb: string | undefined;
		const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
		if (canvas) {
			const off = document.createElement('canvas'); off.width = 128; off.height = Math.round(128 * canvas.height / canvas.width);
			off.getContext('2d')!.drawImage(canvas, 0, 0, off.width, off.height);
			thumb = off.toDataURL('image/png');
		}
		const preset = { id, name: newName.trim() || 'My ACE Preset', params: { ...effect.params }, thumb };
		setState({ presets: [...presets, preset] });
		if (useServer) pushToServer(preset);
		showToast?.('Preset saved');
	}
	function applyMobileSafe(){
		const p = { ...(effect.params as any) };
		if ('samples' in p) p.samples = Math.max(8, Math.floor((p.samples ?? 16) * 0.7));
		setState({ effect: { ...effect, params: p } });
		showToast?.('Mobile-safe applied');
	}
	return (
		<div className="space-y-4 bg-white text-black rounded-lg p-3">
			<div>
				<h3 className="text-sm text-black/70 mb-2">Built-in</h3>
				{Object.entries(grouped).map(([cat, items]) => (
					<div key={cat} className="mb-2">
						<div className="text-xs text-black/60 mb-1">{cat}</div>
						<div className="flex flex-wrap gap-2">
							{items.map(p => (
								<button key={p.id} onClick={() => {
									if (p.id.startsWith('builtin-crosszoom') || p.id.includes('mobile')) setEffectId('crosszoom');
									else if (p.id.startsWith('builtin-halftone') || p.id.includes('print') || p.id.includes('mono')) setEffectId('halftone');
									else if (p.id.startsWith('builtin-vhs')) setEffectId('vhs');
									else if (p.id.startsWith('builtin-textwave')) { toggleText(true); Object.entries(p.params).forEach(([k,v]) => setTextParam(k as any, v as number)); return; }
									apply({ id: p.id, name: p.name, params: p.params });
								}} className="btn-compact">
								{p.name}
								</button>
							))}
						</div>
					</div>
				))}
				{Object.keys(grouped).length===0 && (
					<div className="text-black/60 text-sm">Loading built-in presets…</div>
				)}
			</div>
			<div>
				<div className="flex items-center justify-between mb-2">
					<h3 className="text-sm text-black/70">Your Presets</h3>
					<div className="flex gap-2 items-center">
						<label className="text-xs text-black/70 flex items-center gap-1"><input type="checkbox" checked={useServer} onChange={(e)=>{ setUseServer(e.target.checked); if (e.target.checked) refreshFromServer(); }} /> server</label>
						<button className="btn-compact" onClick={applyMobileSafe}>Apply Mobile-safe</button>
						<button className="btn-compact" onClick={onExport}>Export</button>
						<button className="btn-compact" onClick={()=>fileRef.current?.click()}>Import</button>
						<input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
					</div>
				</div>
				<div className="flex gap-2 items-center mb-3">
					<input value={newName} onChange={(e)=>setNewName(e.target.value)} placeholder="Preset name" className="rounded-xl bg-white border border-black/10 p-2 text-sm text-black" />
					<button className="btn-compact" onClick={saveCurrent}>Save as preset</button>
				</div>
				{presets.length === 0 ? (
					<div className="text-black/60 text-sm animate-fade-in">No presets yet. Tweak controls and click “Save as preset”.</div>
				) : (
					<div className="flex flex-wrap gap-2">
						{presets.map(p => (
							<button key={p.id} onClick={() => apply(p)} className="btn-compact flex items-center gap-2">
								{p.thumb ? <img src={p.thumb} alt="thumb" className="w-8 h-8 object-cover rounded" /> : <span className="w-8 h-8 rounded bg-black/5" />}
								<span className="text-white">{p.name}</span>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}


