import { useLabStore } from '../../store/useLabStore';

export default function AgentTraces(){
	const traces = useLabStore(s => s.agentTraces) || [];
	const clear = useLabStore(s => s.clearAgentTraces!);
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<h4 className="text-sm text-white/70">Agent Traces</h4>
				<button className="btn-primary" onClick={clear}>Clear</button>
			</div>
			<div className="text-xs text-white/80 max-h-40 overflow-auto card-dark p-2 rounded">
				{traces.length===0 ? (<div className="text-white/60">No traces yet.</div>) : traces.slice().reverse().map((t,i)=> (
					<div key={i} className="flex items-center justify-between">
						<div><span className="ace-gradient-text">{t.name}</span></div>
						<div className="text-white/60">{t.durationMs} ms</div>
					</div>
				))}
			</div>
		</div>
	);
}
