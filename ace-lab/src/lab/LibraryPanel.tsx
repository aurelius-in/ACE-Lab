import { useLabStore } from '../store/useLabStore';

export default function LibraryPanel(){
	const media = useLabStore(s=>s.media);
	const clearA = useLabStore(s=>s.clearPrimary);
	const clearB = useLabStore(s=>s.clearSecondary);
	return (
		<div className="space-y-3">
			<h2 className="text-lg font-semibold ace-gradient-text">Library</h2>
			<div className="text-sm">Image A: {media.primary?.src ? <span className="text-white/80">loaded</span> : <span className="text-white/50">none</span>} {media.primary?.src && <button className="ml-2 btn-primary" onClick={clearA}>Clear</button>}</div>
			<div className="text-sm">Image B: {media.secondary?.src ? <span className="text-white/80">loaded</span> : <span className="text-white/50">none</span>} {media.secondary?.src && <button className="ml-2 btn-primary" onClick={clearB}>Clear</button>}</div>
		</div>
	);
}


