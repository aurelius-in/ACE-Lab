import { useLabStore } from '../store/useLabStore';

// Minimal orchestrator: Brief -> Perf -> Policy
export async function runPipeline() {
	const runAgent = useLabStore.getState().runAgent;
	await runAgent('BriefAgent');
	await runAgent('PerfAgent');
	await runAgent('PolicyAgent');
}


