import { useLabStore } from '../../store/useLabStore';
import AgentTraces from './AgentTraces';

export default function AgentsPanel(){
	const runAgent = useLabStore(s => s.runAgent);
	const logs = useLabStore(s => s.agentLog) || [];
	const clear = useLabStore(s => s.clearAgentLog!);
	return (
		<div className="p-4 space-y-4 bg-white text-black rounded-lg">
			<div className="flex items-center justify-between">
				<div className="grid grid-cols-2 gap-2">
					<button className="btn-compact" onClick={()=>runAgent('BriefAgent')}>BriefAgent</button>
					<button className="btn-compact" onClick={()=>runAgent('ArchitectAgent')}>ArchitectAgent</button>
					<button className="btn-compact" onClick={()=>runAgent('PerfAgent')}>PerfAgent</button>
					<button className="btn-compact" onClick={()=>runAgent('TransitionAgent')}>TransitionAgent</button>
					<button className="btn-compact" onClick={()=>runAgent('PresetAgent')}>PresetAgent</button>
					<button className="btn-compact" onClick={()=>runAgent('PolicyAgent')}>PolicyAgent</button>
					<button className="btn-compact" onClick={()=>runAgent('QAAgent')}>QAAgent</button>
				</div>
				<button className="btn-compact" onClick={clear}>Clear Logs</button>
			</div>
			<div className="bg-white border border-black/10 p-3 rounded-xl">
				<h4 className="text-sm mb-2">Architect proposals</h4>
				<div className="flex flex-wrap gap-2">
					<button className="btn-compact" onClick={()=>runAgent('ArchitectAgent')}>Propose VHS + Halftone</button>
					<button className="btn-compact" onClick={()=>runAgent('ArchitectAgent')}>Tune Bloom/LUT</button>
				</div>
			</div>
			<div className="h-48 overflow-auto bg-white border border-black/10 p-2 space-y-1" aria-label="agent logs">
				{logs.length===0 ? <div className="text-black/60 text-sm">No logs yet. Try running Brief or Architect.</div> : logs.slice().reverse().map((l,i)=> (
					<div key={i} className="text-xs text-black/80"><span className="text-black/50">{new Date(l.t).toLocaleTimeString()}</span> — <span className="">{l.name}</span>: {l.message}</div>
				))}
			</div>
			<AgentTraces/>
		</div>
	);
}
