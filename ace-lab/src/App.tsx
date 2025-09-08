import './index.css'
import './styles.css'
import AppShell from './app/AppShell'
import CanvasHost from './lab/CanvasHost'
import ControlsPanel from './lab/ControlsPanel'
import TimelinePanel from './lab/TimelinePanel'

function App() {
	return (
		<AppShell>
			<div className="aspect-video w-full grid place-items-center rounded-2xl border border-white/10 overflow-hidden">
				<CanvasHost />
			</div>
			<TimelinePanel />
		</AppShell>
	)
}

export default App
