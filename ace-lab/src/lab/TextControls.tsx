import { useLabStore } from '../store/useLabStore';

export default function TextControls(){
	const text = useLabStore(s=>s.text);
	const setValue = useLabStore(s=>s.setTextValue);
	const setParam = useLabStore(s=>s.setTextParam);
	const setState = useLabStore.setState as (p: any)=>void;
	return (
		<div className="space-y-3 bg-white text-black rounded-lg p-3">
			<label className="block text-sm">
				<span className="text-black/70">Text</span>
				<input type="text" value={text.value} onChange={e=>setValue(e.target.value)} placeholder="Overlay text" className="w-full rounded-lg bg-white border border-black/10 px-2 py-1 text-black" />
			</label>
			<label className="block text-sm">
				<span className="text-black/70">Font</span>
				<select value={text.font || 'Poppins'} onChange={(e)=>setState({ text: { ...text, font: e.target.value } })} className="mt-1 w-full rounded-lg bg-white border border-black/10 px-2 py-1 text-black">
					<option value="Poppins">Poppins</option>
					<option value="Inter">Inter</option>
					<option value="Roboto">Roboto</option>
				</select>
			</label>
			<div className="grid grid-cols-2 gap-3">
				<label className="block text-sm"><span className="text-black/70">amp</span><input type="range" min={0} max={20} step={0.1} value={text.params.amp} onChange={(e)=>setParam('amp', Number(e.target.value))} className="w-full" /></label>
				<label className="block text-sm"><span className="text-black/70">freq</span><input type="range" min={0} max={20} step={0.1} value={text.params.freq} onChange={(e)=>setParam('freq', Number(e.target.value))} className="w-full" /></label>
				<label className="block text-sm"><span className="text-black/70">speed</span><input type="range" min={0} max={10} step={0.1} value={text.params.speed} onChange={(e)=>setParam('speed', Number(e.target.value))} className="w-full" /></label>
				<label className="block text-sm"><span className="text-black/70">outlinePx</span><input type="range" min={0} max={6} step={0.1} value={text.params.outlinePx} onChange={(e)=>setParam('outlinePx', Number(e.target.value))} className="w-full" /></label>
			</div>
		</div>
	);
}


