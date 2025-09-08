import { useState } from 'react';
import ControlsPanel from './ControlsPanel';
import PresetsPanel from './presets/PresetsPanel';
import CopilotPanel from './copilot/CopilotPanel';
import TextControls from './TextControls';

const tabs = ['Effects','Text','Presets','Co-pilot'] as const;
type Tab = typeof tabs[number];

export default function RightPanelTabs(){
	const [tab, setTab] = useState<Tab>('Effects');
	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				{tabs.map(t => (
					<button key={t} className={`px-3 py-1.5 rounded-2xl border border-white/10 text-sm ${tab===t? 'ace-gradient-text':'text-white/70 hover:text-white'}`} onClick={()=>setTab(t)}>{t}</button>
				))}
			</div>
			{tab==='Effects' && <ControlsPanel/>}
			{tab==='Text' && <TextControls/>}
			{tab==='Presets' && <PresetsPanel/>}
			{tab==='Co-pilot' && <CopilotPanel/>}
		</div>
	);
}


