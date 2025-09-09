import './index.css'
import './styles.css'
import AppShell, { type TabKey } from './app/AppShell'
import CanvasHost from './lab/CanvasHost'
import RightPanelTabs from './lab/RightPanelTabs'
import TimelinePanel from './lab/TimelinePanel'
import LibraryPanel from './lab/LibraryPanel'
import { captureCanvasWebm, captureScaledWebmFromCanvas, downloadJson } from './utils/media'
import { useEffect, useState } from 'react'
import { useLabStore } from './store/useLabStore'
import KeyboardOverlay from './lab/KeyboardOverlay'

function App() {
	const [tab, setTab] = useState<TabKey>('Lab')
	const runAgent = useLabStore(s => s.runAgent)
	const check = useLabStore(s => s.exportPolicyCheck)
	const device = useLabStore(s => s.device)
	const setDevice = useLabStore(s => s.setDevice)
	const play = useLabStore(s => s.play)
	const togglePlay = useLabStore(s => s.togglePlay)
	const setPlayhead = useLabStore(s => s.setPlayhead)
	const buildPack = useLabStore(s => s.buildStylePack)
	const toast = useLabStore(s => s.toast)
	const exportSettings = useLabStore(s => s.exportSettings)
	const [exportProgress, setExportProgress] = useState<number>(0)
	const [exporting, setExporting] = useState<boolean>(false)
	const [aborter, setAborter] = useState<AbortController | null>(null)
	const [showKeys, setShowKeys] = useState(false)

	async function handleExport() {
		const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
		if (!canvas) return alert('Nothing to export')
		const res = await check(canvas.width, canvas.height)
		let blob: Blob
		const ctrl = new AbortController(); setAborter(ctrl); setExporting(true); setExportProgress(0)
		const common = { bitrateKbps: exportSettings.bitrateKbps ?? 6000, onProgress: (p:number)=>setExportProgress(p), signal: ctrl.signal }
		try {
			if (!res.allowed && device === 'mobile') {
				const fixed = res.fix ? res.fix() : { width: 1920, height: Math.round(1920 / canvas.width * canvas.height) }
				blob = await captureScaledWebmFromCanvas(canvas, fixed.width, 3, common)
			} else {
				blob = await captureCanvasWebm(canvas, 3, common)
			}
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url; a.download = `ace-export.webm`; a.click()
			URL.revokeObjectURL(url)
		} finally {
			setExporting(false); setAborter(null); setExportProgress(0)
		}
	}
	function abortExport(){ aborter?.abort(); }
	async function handleRecord(seconds: number) {
		const canvas = document.querySelector('canvas')
		if (!canvas) return
		const blob = await captureCanvasWebm(canvas as HTMLCanvasElement, seconds)
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url; a.download = `ace-${seconds}s.webm`; a.click()
		URL.revokeObjectURL(url)
	}

	async function handleExportGif(){
		const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
		if (!canvas) return
		const { captureCanvasGif } = await import('./utils/media')
		const blob = await captureCanvasGif(canvas, 3, 12)
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url; a.download = `ace-export.webp`; a.click()
		URL.revokeObjectURL(url)
	}

	useEffect(() => {
		function onKey(e: KeyboardEvent){
			if (e.target && (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
			switch(e.key){
				case ' ': e.preventDefault(); togglePlay(); break;
				case 'ArrowRight': setPlayhead((play.t + 0.01) % 1); break;
				case 'ArrowLeft': setPlayhead((play.t - 0.01 + 1) % 1); break;
				case 'e': case 'E': handleExport(); break;
				case 'r': case 'R': handleRecord(3); break;
				case '6': handleRecord(6); break;
				case 's': case 'S': downloadJson('ace-style-pack.json', buildPack()); break;
				case 'a': case 'A': import('./agents/pipeline').then(m => m.applyAceLook()); break;
				case '?': case 'h': case 'H': setShowKeys(v=>!v); break;
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [play.t, togglePlay, setPlayhead, buildPack])

	return (
		<AppShell
			rightSlot={tab==='Library' ? <LibraryPanel/> : <RightPanelTabs />}
			onExport={handleExport}
			onRecord3={() => handleRecord(3)}
			onRecord6={() => handleRecord(6)}
			activeTab={tab}
			onTabChange={setTab}
			device={device}
			onDeviceChange={setDevice}
		>
			{tab === 'Lab' && (
				<>
					<div className="aspect-video w-full grid place-items-center rounded-2xl border border-white/10 overflow-hidden">
						<CanvasHost />
					</div>
					<div className="flex justify-end mt-3">
						<button className="btn-primary" onClick={() => runAgent('TransitionAgent')}>Auto-compose</button>
						<button className="btn-primary ml-2" onClick={handleExportGif}>Export GIF</button>
					</div>
					<TimelinePanel />
				</>
			)}
			{tab === 'Agents' && (
				<div className="p-4">Agents view placeholder</div>
			)}
			{tab === 'Library' && (
				<div className="p-4">Manage loaded media on the right</div>
			)}
			{toast && (
				<div className="fixed bottom-4 right-4 px-3 py-2 rounded-xl bg-black/70 border border-white/10 shadow-lg">
					<span className="ace-gradient-text text-sm">{toast.message}</span>
				</div>
			)}
			{exporting && (
				<div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl bg-black/70 border border-white/10 shadow-lg flex items-center gap-2">
					<div className="w-40 h-2 bg-white/10 rounded">
						<div className="h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded" style={{ width: `${Math.round(exportProgress*100)}%` }} />
					</div>
					<button className="btn-primary" onClick={abortExport}>Abort</button>
				</div>
			)}
			{showKeys && <KeyboardOverlay onClose={()=>setShowKeys(false)} />}
		</AppShell>
	)
}

export default App
