import { useLabStore } from '../../store/useLabStore';

export default function CopilotPanel(){
	const runAgent = useLabStore(s => s.runAgent);
	const brief = useLabStore(s => s.briefPrompt);
	const setBrief = useLabStore(s => s.setBriefPrompt);
	return (
		<div className="space-y-3">
			<div>
				<label className="block text-sm text-white/70">Brief prompt</label>
				<textarea value={brief} onChange={(e)=>setBrief(e.target.value)} className="w-full rounded-xl bg-black/30 border border-white/10 p-2" rows={3} />
				<div className="flex justify-end mt-2"><button className="btn-primary" onClick={()=>runAgent('BriefAgent')}>Apply Look Profile</button></div>
			</div>
			<div className="space-y-2">
				<button className="btn-primary w-full" onClick={()=>runAgent('PerfAgent')}>Apply Mobile Safe</button>
				<button className="btn-primary w-full" onClick={()=>runAgent('TransitionAgent')}>Insert Keyframes</button>
				<button className="btn-primary w-full" onClick={()=>runAgent('PolicyAgent')}>Fix Violations</button>
			</div>
		</div>
	);
}


