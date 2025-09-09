export default function KeyboardOverlay({ onClose }: { onClose: () => void }){
	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" aria-label="Keyboard shortcuts overlay">
			<div className="w-[520px] max-w-[92vw] card-dark border border-white/10 rounded-2xl p-4 space-y-3">
				<div className="flex items-center justify-between">
					<h3 className="ace-gradient-text text-lg">Keyboard shortcuts</h3>
					<button className="btn-primary" onClick={onClose} aria-label="Close">Close</button>
				</div>
				<ul className="text-sm text-white/80 space-y-1">
					<li><b>Space</b>: Play/Pause</li>
					<li><b>Left/Right</b>: Scrub timeline</li>
					<li><b>R</b>: Record 3s • <b>6</b>: Record 6s</li>
					<li><b>E</b>: Export • <b>S</b>: Save Style Pack</li>
					<li><b>A</b>: Apply ACE Look (pipeline + top preset)</li>
					<li><b>Shift</b>: Finer snapping • <b>Alt</b>: Coarser snapping</li>
					<li><b>Click timeline</b>: Add keyframe • <b>Alt+Click keyframe</b>: Delete keyframe</li>
					<li><b>?</b> or <b>H</b>: Toggle this help</li>
				</ul>
			</div>
		</div>
	);
}
