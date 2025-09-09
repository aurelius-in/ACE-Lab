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

export async function applyAceLook(){
	await runPipeline();
	const st = useLabStore.getState();
	const list = st.presets;
	if (!list || list.length === 0) return;
	const top = list.find(p => p.id.startsWith('ai-')) ?? list[0];
	const params = top.params || {} as Record<string, number>;
	if ('zoomStrength' in params || 'samples' in params) st.setEffectId('crosszoom');
	else if ('aberration' in params || 'scanline' in params) st.setEffectId('vhs');
	else st.setEffectId('halftone');
	st.applyPreset(top);
}


