import { useLabStore } from '../store/useLabStore';

// Orchestrator: Brief -> Architect -> Preset -> Transition -> Perf -> Policy
export async function runPipeline() {
	const runAgent = useLabStore.getState().runAgent;
	await runAgent('BriefAgent');
	await runAgent('ArchitectAgent');
	await runAgent('PresetAgent');
	await runAgent('TransitionAgent');
	await runAgent('PerfAgent');
	await runAgent('PolicyAgent');
	// Apply architect suggestions directly to current effect as final touch
	const s = useLabStore.getState();
	const suggested = { bloomThreshold: 0.62, grainAmount: 0.045, lutAmount: 0.23 } as Record<string, number>;
	s.setEffectId(s.effect.id);
	s.applyPreset({ id: 'ai-architect-final', name: 'Architect Final Touch', params: suggested });
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
	st.showToast?.('ACE Look applied');
}


