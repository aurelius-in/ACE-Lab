import { useState } from 'react';
import { useLabStore } from '../../store/useLabStore';

export default function PolicyPanel(){
	const check = useLabStore(s => s.exportPolicyCheck);
	const setExportSize = useLabStore(s => s.setExportSize);
	const device = useLabStore(s => s.device);
	const [result, setResult] = useState<{ allowed: boolean; message?: string; fix?: () => { width: number; height: number } }|null>(null);
	async function run(){
		const canvas = document.querySelector('canvas') as HTMLCanvasElement | null; if (!canvas) return;
		const r = await check(canvas.width, canvas.height); setResult(r);
	}
	function fix(){ if (!result?.fix) return; const f = result.fix(); setExportSize(f.width, f.height); }
	return (
		<div className="space-y-3 p-2">
			<div className="flex items-center justify-between">
				<h3 className="text-sm text-white/70">Policy</h3>
				<div className="text-xs text-white/50">Device: {device}</div>
			</div>
			<div className="flex gap-2">
				<button className="btn-primary" onClick={run}>Run Check</button>
				<button className="btn-primary" disabled={!result || result.allowed || !result.fix} onClick={fix}>Fix</button>
			</div>
			<div className="text-sm">
				{result ? (result.allowed ? <div className="text-green-400">Compliant</div> : <div className="text-red-400">{result.message || 'Violation detected'}</div>) : <div className="text-white/60">No results yet</div>}
			</div>
		</div>
	);
}
