import './index.css'
import './styles.css'
import AppShell, { TabKey } from './app/AppShell'
import CanvasHost from './lab/CanvasHost'
import RightPanelTabs from './lab/RightPanelTabs'
import TimelinePanel from './lab/TimelinePanel'
import LibraryPanel from './lab/LibraryPanel'
import { captureCanvasWebm } from './utils/media'
import { useState } from 'react'
import { useLabStore } from './store/useLabStore'

function App() {
	const [tab, setTab] = useState<TabKey>('Lab')
	const runAgent = useLabStore(s => s.runAgent)
	const check = useLabStore(s => s.exportPolicyCheck)
	const device = useLabStore(s => s.device)
	const setDevice = useLabStore(s => s.setDevice)

	async function handleExport() {
		const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
		if (!canvas) return alert('Nothing to export')
		const { allowed, message } = check(canvas.width, canvas.height)
		if (!allowed) {
			alert(message)
			return
		}
		const blob = await captureCanvasWebm(canvas, 3)
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url; a.download = `ace-export.webm`; a.click()
		URL.revokeObjectURL(url)
	}
	async function handleRecord(seconds: number) {
		const canvas = document.querySelector('canvas')
		if (!canvas) return
		const blob = await captureCanvasWebm(canvas as HTMLCanvasElement, seconds)
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url; a.download = `ace-${seconds}s.webm`; a.click()
		URL.revokeObjectURL(url)
	}

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
		</AppShell>
	)
}

export default App
