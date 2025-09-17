import { useLabStore } from '../store/useLabStore';
import { downloadJson } from '../utils/media';

export default function LibraryPanel(){
	const media = useLabStore(s=>s.media);
	const clearA = useLabStore(s=>s.clearPrimary);
	const clearB = useLabStore(s=>s.clearSecondary);
	const buildPack = useLabStore(s=>s.buildStylePack);
	const applyPack = useLabStore(s=>s.applyStylePack);

	function savePack(){
		const sp = buildPack();
		downloadJson('ace-style-pack.json', sp);
	}
	function loadPack(e: React.ChangeEvent<HTMLInputElement>){
		const f = e.target.files?.[0]; if (!f) return;
		const reader = new FileReader();
		reader.onload = () => {
			try { const sp = JSON.parse(String(reader.result)); applyPack(sp); } catch { useLabStore.getState().showToast?.('Invalid style pack'); }
		};
		reader.readAsText(f);
	}

	return (
		<div className="space-y-4 bg-white text-black rounded-lg p-3">
			<h2 className="text-lg font-semibold">Library</h2>
			<div className="text-sm">
				<div className="flex items-center gap-2">
					<span>Image A:</span>
					{media.primary?.src ? <span className="text-black/80">loaded</span> : <span className="text-black/50 animate-pulse">none</span>}
					{media.primary?.src && <button className="ml-2 btn-compact" onClick={clearA}>Clear</button>}
				</div>
			</div>
			<div className="text-sm">
				<div className="flex items-center gap-2">
					<span>Image B:</span>
					{media.secondary?.src ? <span className="text-black/80">loaded</span> : <span className="text-black/50 animate-pulse">none</span>}
					{media.secondary?.src && <button className="ml-2 btn-compact" onClick={clearB}>Clear</button>}
				</div>
			</div>
			<div className="pt-2 border-t border-black/10">
				<h3 className="text-sm text-black/70 mb-2">Style Packs</h3>
				<div className="flex items-center gap-2">
					<button className="btn-compact" onClick={savePack}>Save Pack</button>
					<label className="btn-compact cursor-pointer">
						Load Pack
						<input type="file" accept="application/json" onChange={loadPack} className="hidden" />
					</label>
				</div>
				{(!media.primary?.src && !media.secondary?.src) && (
					<div className="text-xs text-black/60 mt-3">Tip: Load Image A in the Effects tab to get started.</div>
				)}
			</div>
		</div>
	);
}


