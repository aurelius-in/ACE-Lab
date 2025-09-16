import { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import ControlsPanel from '../lab/ControlsPanel';
import TextControls from '../lab/TextControls';
import PresetsPanel from '../lab/presets/PresetsPanel';
import CopilotPanel from '../lab/copilot/CopilotPanel';
import AgentsPanel from '../lab/copilot/AgentsPanel';
import PolicyPanel from '../lab/policy/PolicyPanel';
import GenerativeFillPanel from '../lab/GenerativeFillPanel';
import SettingsPanel from '../lab/SettingsPanel';
import LibraryPanel from '../lab/LibraryPanel';
import { useLabStore } from '../store/useLabStore';
import GeneratePanel from '../lab/GeneratePanel';
import MotionPanel from '../lab/MotionPanel';
import StyleTransferPanel from '../lab/StyleTransferPanel';

const tabs = ['Agents', 'Library'] as const;
export type TabKey = typeof tabs[number];

export function AppShell({ children, rightSlot, onExport, onRecord3, onRecord6, activeTab, onTabChange, device, onDeviceChange, onEnhance }: PropsWithChildren & { rightSlot?: React.ReactNode, onExport?: () => void, onRecord3?: () => void, onRecord6?: () => void, activeTab: TabKey, onTabChange: (t: TabKey) => void, device: 'mobile'|'desktop', onDeviceChange: (d: 'mobile'|'desktop') => void, onEnhance?: () => void }) {
	const [openPanel, setOpenPanel] = useState<null | 'Effects' | 'Text' | 'Presets' | 'Co-pilot' | 'Agents' | 'Policy' | 'Settings' | 'Library' | 'Generate (WebGPU)' | 'Motion' | 'Style Transfer' | 'Generative Fill'>(null);
	const popRef = useRef<HTMLDivElement | null>(null);
    const runAgent = useLabStore(s => s.runAgent);
	useEffect(()=>{
		function onDown(e: MouseEvent){
			if (!popRef.current) return;
			if (!popRef.current.contains(e.target as Node)) setOpenPanel(null);
		}
		if (openPanel) { document.addEventListener('mousedown', onDown); }
		return ()=> document.removeEventListener('mousedown', onDown);
	}, [openPanel]);
	useEffect(()=>{
		function onKey(e: KeyboardEvent){
			const tag = (e.target as HTMLElement | null)?.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA') return;
			switch(e.key){
				case 'g': case 'G': setOpenPanel(p=> p==='Generate (WebGPU)' ? null : 'Generate (WebGPU)'); break;
				case 'm': case 'M': setOpenPanel(p=> p==='Motion' ? null : 'Motion'); break;
				case 't': case 'T': setOpenPanel(p=> p==='Style Transfer' ? null : 'Style Transfer'); break;
			}
		}
		window.addEventListener('keydown', onKey);
		return ()=> window.removeEventListener('keydown', onKey);
	}, []);
	return (
		<div className="min-h-screen text-[var(--ink-900)] bg-white">
			<header className="sticky top-0 z-10 backdrop-blur-sm">
				<div className="container mx-auto flex items-center justify-between" style={{ paddingTop: 12, paddingBottom: 12 }}>
					<div className="relative flex items-center gap-3" style={{ height: 80 }}>
						<img src="/ace-lab-min.png" alt="ACE Lab" style={{ height: '100%', width: 'auto', maxHeight: '100%', display: 'block' }} className="select-none" draggable={false} />
						<div className="strip-vertical ml-16" aria-label="Device">
							<button className={clsx(device==='desktop' ? 'btn-strip-sm' : 'btn-strip-sm-inverse')} onClick={()=>onDeviceChange('desktop')}>Desktop</button>
							<button className={clsx(device==='mobile' ? 'btn-strip-sm' : 'btn-strip-sm-inverse')} onClick={()=>onDeviceChange('mobile')}>Mobile</button>
						</div>
					</div>
					<nav className="strip-group" role="tablist" aria-label="Main sections">
						<button className="btn-strip" onClick={()=>{ if (onEnhance) onEnhance(); else runAgent('ArchitectAgent'); }}>Enhance</button>
						{tabs.map(t => (
							<button key={t} role="tab" aria-selected={activeTab===t} className={clsx('btn-strip', activeTab===t ? '' : '')} onClick={() => {
								if (t === 'Agents') { setOpenPanel(p=> p==='Agents'? null : 'Agents'); return; }
								if (t === 'Library') { setOpenPanel(p=> p==='Library'? null : 'Library'); return; }
								onTabChange(t);
							}}>
								{t}
							</button>
						))}
						{(['Generate (WebGPU)','Motion','Style Transfer','Generative Fill','Effects','Text','Presets','Co-pilot','Agents','Policy','Settings'] as const).map(name => (
							<button key={name} className="btn-strip" onClick={()=> setOpenPanel(name)}>{name}</button>
						))}
					</nav>
					<div className="strip-group">
						<button className="btn-strip" aria-label="Export video" onClick={onExport}>Export</button>
						<RecordControls onRecord3={onRecord3} onRecord6={onRecord6} strip />
					</div>
				</div>
				<div style={{height:1, background: 'linear-gradient(90deg, var(--ace-g1), var(--ace-g3))'}} />
			</header>
			{openPanel && (
				<div ref={popRef} className="fixed z-50 left-1/2 -translate-x-1/2 mt-2" style={{ top: 96 }}>
					<div className="popout-panel" style={{ width: 520 }}>
						<div className="popout-inner space-y-4">
							{openPanel === 'Generate (WebGPU)' && <GeneratePanel />}
							{openPanel === 'Motion' && <MotionPanel />}
							{openPanel === 'Style Transfer' && <StyleTransferPanel />}
							{openPanel === 'Effects' && <ControlsPanel />}
							{openPanel === 'Generative Fill' && <GenerativeFillPanel />}
							{openPanel === 'Text' && <TextControls />}
							{openPanel === 'Presets' && <PresetsPanel />}
							{openPanel === 'Co-pilot' && <CopilotPanel />}
							{openPanel === 'Agents' && <AgentsPanel />}
							{openPanel === 'Policy' && <PolicyPanel />}
							{openPanel === 'Settings' && <SettingsPanel />}
							{openPanel === 'Library' && <LibraryPanel />}
						</div>
					</div>
				</div>
			)}
			<main className="container mx-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
				<section className="lg:col-span-8 relative card-dark p-2 animate-fade-in animate-slide-up max-h-[70vh] overflow-hidden">
					{children}
				</section>
				<aside className="lg:col-span-4 card-dark p-4 animate-fade-in animate-slide-up max-h-[70vh] overflow-auto">{rightSlot}</aside>
			</main>
		</div>
	);
}

function RecordControls({ onRecord3, strip }: { onRecord3?: () => void, onRecord6?: () => void, strip?: boolean }) {
	const [isRecording, setIsRecording] = useState(false);
	function handleRecord(){
		setIsRecording(true);
		if (onRecord3) onRecord3();
		setTimeout(()=> setIsRecording(false), 3100);
	}
	return (
		<div className={strip ? undefined : "flex items-center gap-2"}>
			<button aria-label="Record" title="Record 3s" onClick={handleRecord} className={strip ? 'btn-strip' : 'rounded-full w-8 h-8 grid place-items-center border border-white/10 ace-gradient-fill'}>
				<span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: isRecording ? '2px' : '9999px', background: isRecording ? '#000' : 'red' }} />
			</button>
			<button aria-label={isRecording ? 'Pause' : 'Stop'} title={isRecording ? 'Pause' : 'Stop'} className={strip ? 'btn-strip-inverse' : 'rounded-md w-8 h-8 grid place-items-center border border-white/10 ace-gradient-fill'}>
				<span style={{ display: 'inline-block', width: 10, height: 10, background: isRecording ? 'white' : '#000' }} />
			</button>
		</div>
	);
}

function BeakerIcon() {
	return (
		<svg viewBox="0 0 24 24" className="w-6 h-6">
			<defs>
				<linearGradient id="ace-g" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="var(--ace-g1)" />
					<stop offset="50%" stopColor="var(--ace-g2)" />
					<stop offset="100%" stopColor="var(--ace-g3)" />
				</linearGradient>
			</defs>
			<path d="M8 2h8v2l-1 2v6.5l3.47 5.78A2 2 0 0 1 16.72 22H7.28a2 2 0 0 1-1.75-3.72L9 12.5V6L8 4z" fill="none" stroke="url(#ace-g)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export default AppShell;


