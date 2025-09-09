import { useLabStore } from '../store/useLabStore';

const SAMPLE_LUTS: { name: string; url: string }[] = [
	{ name: 'Orchid Film', url: 'https://dummyimage.com/256x16/FF4BB5/000000.png&text=lut' },
	{ name: 'Violet Fade', url: 'https://dummyimage.com/256x16/6E00FF/000000.png&text=lut' },
	{ name: 'Retro Print', url: 'https://dummyimage.com/256x16/A83CF0/000000.png&text=lut' },
];

export default function LutGallery(){
	const setLutSrc = useLabStore(s => s.setLutSrc!);
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<h3 className="text-sm text-white/70">LUT Gallery</h3>
			</div>
			<div className="flex flex-wrap gap-2">
				{SAMPLE_LUTS.map(l => (
					<button key={l.name} onClick={()=>setLutSrc(l.url)} className="rounded-xl border border-white/10 bg-black/30 hover:bg-black/40 p-1 flex items-center gap-2">
						<img src={l.url} alt={l.name} className="w-16 h-4 object-cover rounded" />
						<span className="text-xs ace-gradient-text">{l.name}</span>
					</button>
				))}
			</div>
			<div className="text-xs text-white/60">Tip: Upload a .cube or PNG LUT in Effects.</div>
		</div>
	);
}
