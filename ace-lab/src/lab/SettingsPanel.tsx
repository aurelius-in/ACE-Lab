import { useLabStore } from '../store/useLabStore';
import { useState } from 'react';

export default function SettingsPanel(){
	const exportSettings = useLabStore(s => s.exportSettings);
	const setExportSize = useLabStore(s => s.setExportSize);
const setBitrateKbps = useLabStore(s => s.setExportBitrate);
	const [snap, setSnap] = useState<number>(() => Number(localStorage.getItem('ace.snapStep')||'0.05'));
function setBitrate(kbps: number){ setBitrateKbps?.(kbps); }
	function applySnap(v: number){ const clamped = Math.max(0.005, Math.min(0.5, v)); setSnap(clamped); localStorage.setItem('ace.snapStep', String(clamped)); }
	function preset(size: '1080p'|'square'){
		if (size === '1080p') setExportSize(1920, 1080);
		if (size === 'square') setExportSize(1080, 1080);
	}
	return (
		<div className="space-y-4 bg-white text-black rounded-lg p-3">
			<h3 className="text-sm">Settings</h3>
                <div className="grid grid-cols-2 gap-3">
				<label className="block text-sm">
					<div className="flex justify-between"><span className="text-black/70">Bitrate (kbps)</span><span className="text-black/60">{exportSettings.bitrateKbps ?? 6000}</span></div>
					<input type="range" min={1000} max={20000} step={500} value={exportSettings.bitrateKbps ?? 6000} onChange={(e)=>setBitrate(Number(e.target.value))} />
				</label>
				<label className="block text-sm">
					<div className="flex justify-between"><span className="text-black/70">Snap step</span><span className="text-black/60">{snap}</span></div>
					<input type="range" min={0.005} max={0.2} step={0.005} value={snap} onChange={(e)=>applySnap(Number(e.target.value))} />
				</label>
			</div>
                <label className="block text-sm">
                    <span className="text-black/70">Audio URL (timeline export)</span>
                    <input className="mt-1 w-full rounded-xl bg-white border border-black/10 px-2 py-1 text-black" type="text" placeholder="https://.../audio.mp3" value={exportSettings.audioUrl || ''} onChange={(e)=> useLabStore.getState().setExportAudioUrl?.(e.target.value || undefined)} />
                </label>
			<div className="flex items-center gap-2 text-sm">
				<span className="text-black/70">Presets:</span>
				<button className="btn-compact" onClick={()=>preset('1080p')}>1080p@24</button>
				<button className="btn-compact" onClick={()=>preset('square')}>Square@30</button>
				<button className="btn-compact" onClick={()=> setExportSize(1080, 1920)}>Vertical@30</button>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<label className="block text-sm">
					<span className="text-black/70">Export Width</span>
					<input className="mt-1 w-full rounded-xl bg-white border border-black/10 px-2 py-1 text-black" type="number" value={exportSettings.width ?? ''} onChange={(e)=>setExportSize(Number(e.target.value)||undefined, exportSettings.height)} />
				</label>
				<label className="block text-sm">
					<span className="text-black/70">Export Height</span>
					<input className="mt-1 w-full rounded-xl bg-white border border-black/10 px-2 py-1 text-black" type="number" value={exportSettings.height ?? ''} onChange={(e)=>setExportSize(exportSettings.width, Number(e.target.value)||undefined)} />
				</label>
			</div>
			<div className="flex gap-2">
				<button className="btn-compact" onClick={()=> useLabStore.getState().saveProjectToLocal?.()}>Save Project</button>
				<button className="btn-compact" onClick={()=> useLabStore.getState().loadProjectFromLocal?.()}>Load Project</button>
			</div>
			<label className="block text-sm">
				<div className="flex justify-between"><span className="text-black/70">Audio Volume</span><span className="text-black/60">{Math.round((exportSettings.audioVolume ?? 1)*100)}%</span></div>
				<input type="range" min={0} max={1} step={0.01} value={exportSettings.audioVolume ?? 1} onChange={(e)=> useLabStore.getState().setExportAudioVolume?.(Number(e.target.value))} />
			</label>
		</div>
	);
}
