import { useLabStore } from '../../store/useLabStore';

export default function AgentsPanel(){
	const runAgent = useLabStore(s => s.runAgent);
	const logs = useLabStore(s => s.agentLog) || [];
	return (
		<div className="p-4 space-y-4">
			<div className="grid grid-cols-2 gap-2">
				<button className="btn-primary" onClick={()=>runAgent('BriefAgent')}>BriefAgent</button>
				<button className="btn-primary" onClick={()=>runAgent('ArchitectAgent')}>ArchitectAgent</button>
				<button className="btn-primary" onClick={()=>runAgent('PerfAgent')}>PerfAgent</button>
				<button className="btn-primary" onClick={()=>runAgent('TransitionAgent')}>TransitionAgent</button>
				<button className="btn-primary" onClick={()=>runAgent('PresetAgent')}>PresetAgent</button>
				<button className="btn-primary" onClick={()=>runAgent('PolicyAgent')}>PolicyAgent</button>
				<button className="btn-primary" onClick={()=>runAgent('QAAgent')}>QAAgent</button>
			</div>
			<div className="h-48 overflow-auto card-dark p-2 space-y-1" aria-label="agent logs">
				{logs.length===0 ? <div className="text-white/60">No logs yet</div> : logs.slice().reverse().map((l,i)=> (
					<div key={i} className="text-xs text-white/80"><span className="text-white/50">{new Date(l.t).toLocaleTimeString()}</span> — <span className="ace-gradient-text">{l.name}</span>: {l.message}</div>
				))}
			</div>
		</div>
	);
}
