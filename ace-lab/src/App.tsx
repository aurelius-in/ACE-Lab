import './index.css'
import './styles.css'
import AppShell from './app/AppShell'
import CanvasHost from './lab/CanvasHost'
import ControlsPanel from './lab/ControlsPanel'
import TimelinePanel from './lab/TimelinePanel'
import { captureCanvasWebm } from './utils/media'

function App() {
	async function handleExport() {
		alert('Export action placeholder');
	}
	async function handleRecord(seconds: number) {
		const canvas = document.querySelector('canvas');
		if (!canvas) return;
		const blob = await captureCanvasWebm(canvas, seconds);
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url; a.download = `ace-${seconds}s.webm`; a.click();
		URL.revokeObjectURL(url);
	}
	return (
		<AppShell rightSlot={<ControlsPanel />} onExport={handleExport} onRecord3={() => handleRecord(3)} onRecord6={() => handleRecord(6)}>
			<div className="aspect-video w-full grid place-items-center rounded-2xl border border-white/10 overflow-hidden">
				<CanvasHost />
			</div>
			<TimelinePanel />
		</AppShell>
	)
}

export default App
