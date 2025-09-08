import './index.css'
import './styles.css'
import AppShell from './app/AppShell'

function App() {
	return (
		<AppShell>
			<div className="aspect-video w-full bg-black/40 grid place-items-center rounded-2xl border border-white/10">
				<p className="ace-gradient-text text-xl">Canvas area</p>
			</div>
		</AppShell>
	)
}

export default App
