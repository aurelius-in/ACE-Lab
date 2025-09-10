import { useLabStore } from '../store/useLabStore';

const LUTS = [
	{ name: 'Kodak 2393', url: '/luts/kodak2393.png' },
	{ name: 'TealOrange', url: '/luts/tealorange.png' },
];

export default function LutGallery(){
	const setLutSrc = useLabStore(s=>s.setLutSrc);
	return (
		<div className="space-y-2">
			<h3 className="text-sm text-white/70">LUT Gallery</h3>
			<div className="flex flex-wrap gap-2">
				{LUTS.map(l => (
					<button key={l.name} onClick={()=>setLutSrc?.(l.url)} className="btn-compact flex items-center gap-2">
						<span className="w-4 h-4 rounded bg-black/5" />
						<span className="text-white text-xs">{l.name}</span>
					</button>
				))}
			</div>
		</div>
	);
}
