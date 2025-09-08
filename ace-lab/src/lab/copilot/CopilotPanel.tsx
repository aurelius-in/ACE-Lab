import { useLabStore } from '../../store/useLabStore';

export default function CopilotPanel(){
	const runAgent = useLabStore(s => s.runAgent);
	return (
		<div className="space-y-2">
			<button className="btn-primary w-full" onClick={()=>runAgent('BriefAgent')}>Apply Look Profile</button>
			<button className="btn-primary w-full" onClick={()=>runAgent('PerfAgent')}>Apply Mobile Safe</button>
			<button className="btn-primary w-full" onClick={()=>runAgent('TransitionAgent')}>Insert Keyframes</button>
			<button className="btn-primary w-full" onClick={()=>runAgent('PolicyAgent')}>Fix Violations</button>
		</div>
	);
}


