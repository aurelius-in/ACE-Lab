import { useLabStore } from '../store/useLabStore';

// Orchestrator: Brief -> Preset -> Transition -> Perf -> Policy
export async function runPipeline() {
	const runAgent = useLabStore.getState().runAgent;
	await runAgent('BriefAgent');
	await runAgent('PresetAgent');
	await runAgent('TransitionAgent');
	await runAgent('PerfAgent');
	await runAgent('PolicyAgent');
}


