export type StyleId = 'mosaic'|'udnie'|'candy'|'scream'|'rain_princess';

export async function apply(image: HTMLCanvasElement|ImageBitmap, style: StyleId, strength: number): Promise<HTMLCanvasElement>{
	const canvas = document.createElement('canvas');
	const w = (image as any).width || 512; const h = (image as any).height || 512; canvas.width = w; canvas.height = h;
	const ctx = canvas.getContext('2d')!; ctx.drawImage(image as any, 0, 0, w, h);
	ctx.globalAlpha = Math.max(0, Math.min(1, strength));
	ctx.fillStyle = style === 'mosaic' ? 'rgba(255,0,128,.15)' : style === 'udnie' ? 'rgba(0,200,255,.15)' : 'rgba(255,255,0,.12)';
	ctx.fillRect(0,0,w,h);
	return canvas;
}


