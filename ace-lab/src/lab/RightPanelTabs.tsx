import { useState } from 'react';
import ControlsPanel from './ControlsPanel';
import PresetsPanel from './presets/PresetsPanel';
import CopilotPanel from './copilot/CopilotPanel';
import TextControls from './TextControls';
import { useLabStore } from '../store/useLabStore';
import AgentsPanel from './copilot/AgentsPanel';
import PolicyPanel from './policy/PolicyPanel';

const tabs = ['Effects','Text','Presets','Co-pilot','Agents','Policy'] as const;
type Tab = typeof tabs[number];

export default function RightPanelTabs(){
	const [tab, setTab] = useState<Tab>('Effects');
	const effectId = useLabStore(s=>s.effect.id);
	const setEffectId = useLabStore(s=>s.setEffectId);
	const reset = useLabStore(s=>s.resetDefaults);
	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				{tabs.map(t => (
					<button key={t} className={`px-3 py-1.5 rounded-2xl border border-white/10 text-sm ${tab===t? 'ace-gradient-text':'text-white/70 hover:text-white'}`} onClick={()=>setTab(t)}>{t}</button>
				))}
			</div>
			{tab==='Effects' && (
				<div className="space-y-3">
					<label className="block text-sm">
						<span className="text-white/70">Effect</span>
						<select value={effectId} onChange={(e)=>setEffectId(e.target.value)} className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-2 py-1">
							<option value="halftone">Halftone</option>
							<option value="crosszoom">Cross-zoom</option>
							<option value="vhs">VHS</option>
						</select>
					</label>
					<ControlsPanel/>
					<div className="flex justify-end"><button className="btn-primary" onClick={reset}>Reset</button></div>
				</div>
			)}
			{tab==='Text' && <TextControls/>}
			{tab==='Presets' && <PresetsPanel/>}
			{tab==='Co-pilot' && <CopilotPanel/>}
			{tab==='Agents' && <AgentsPanel/>}
			{tab==='Policy' && <PolicyPanel/>}
		</div>
	);
}


