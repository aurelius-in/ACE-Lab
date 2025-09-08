import { useLabStore } from '../store/useLabStore';

export default function ControlsPanel() {
	const effect = useLabStore(s => s.effect);
	const setParam = useLabStore(s => s.setEffectParam);

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold ace-gradient-text">Effects</h2>
			<div className="space-y-3">
				{Object.entries(effect.params).map(([k, v]) => (
					<label key={k} className="block text-sm">
						<span className="text-white/70">{k}</span>
						<input aria-label={k} type="range" min={0} max={1} step={0.01} value={v}
							className="w-full"
							onChange={(e) => setParam(k, Number((e.target as HTMLInputElement).value))} />
					</label>
				))}
			</div>
		</div>
	);
}


