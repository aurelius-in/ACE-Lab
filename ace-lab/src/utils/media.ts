export async function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}

type RecordOptions = { bitrateKbps?: number; onProgress?: (p: number) => void; signal?: AbortSignal };

export async function captureCanvasWebm(canvas: HTMLCanvasElement, seconds: number, opts: RecordOptions = {}): Promise<Blob> {
	const stream = (canvas as any).captureStream ? (canvas as any).captureStream(60) : null;
	if (!stream) throw new Error('captureStream not supported');
	const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', bitsPerSecond: opts.bitrateKbps ? opts.bitrateKbps * 1000 : undefined } as any);
	const chunks: Blob[] = [];
	recorder.ondataavailable = (e) => chunks.push(e.data);
	recorder.start();
	const start = performance.now();
	let stopped = false;
	const stop = () => { if (!stopped) { stopped = true; try { recorder.stop(); } catch {} } };
	if (opts.signal) { opts.signal.addEventListener('abort', stop, { once: true }); }
	while (!stopped && performance.now() - start < seconds * 1000) {
		if (opts.onProgress) opts.onProgress(Math.min(1, (performance.now() - start) / (seconds * 1000)));
		await new Promise(r => setTimeout(r, 100));
	}
	stop();
	await new Promise((r) => (recorder.onstop = () => r(null)));
	return new Blob(chunks, { type: 'video/webm' });
}

export async function captureScaledWebmFromCanvas(source: HTMLCanvasElement, targetWidth: number, seconds: number, opts: RecordOptions = {}): Promise<Blob> {
	const scale = targetWidth / source.width;
	const w = Math.round(targetWidth);
	const h = Math.round(source.height * scale);
	const off = document.createElement('canvas');
	off.width = w; off.height = h;
	const ctx = off.getContext('2d') as CanvasRenderingContext2D;
	const stream = (off as any).captureStream ? (off as any).captureStream(60) : null;
	if (!stream) throw new Error('captureStream not supported');
	const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', bitsPerSecond: opts.bitrateKbps ? opts.bitrateKbps * 1000 : undefined } as any);
	const chunks: Blob[] = [];
	recorder.ondataavailable = (e) => chunks.push(e.data);
	recorder.start();
	const start = performance.now();
	let stopped = false;
	const stop = () => { if (!stopped) { stopped = true; try { recorder.stop(); } catch {} } };
	if (opts.signal) { opts.signal.addEventListener('abort', stop, { once: true }); }
	function draw() {
		ctx.clearRect(0,0,w,h);
		ctx.drawImage(source, 0, 0, w, h);
		if (!stopped && performance.now() - start < seconds * 1000) requestAnimationFrame(draw);
	}
	draw();
	while (!stopped && performance.now() - start < seconds * 1000) {
		if (opts.onProgress) opts.onProgress(Math.min(1, (performance.now() - start) / (seconds * 1000)));
		await new Promise(r => setTimeout(r, 100));
	}
	stop();
	await new Promise((r) => (recorder.onstop = () => r(null)));
	return new Blob(chunks, { type: 'video/webm' });
}

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve) => canvas.toBlob((b)=> resolve(b || new Blob()), 'image/png'));
}

export async function captureCanvasGif(canvas: HTMLCanvasElement, seconds: number, fps = 15): Promise<Blob> {
	// Simple fallback: sample frames into an animated WebP if GIF encoder not present
	const frames: ImageBitmap[] = [];
	const total = Math.max(1, Math.floor(seconds * fps));
	for (let i=0;i<total;i++){ frames.push(await createImageBitmap(canvas)); await new Promise(r=>setTimeout(r, 1000/fps)); }
	// Try to use OffscreenCanvas to encode Animated WebP
	const webp = await (async () => {
		const off = document.createElement('canvas'); off.width = canvas.width; off.height = canvas.height;
		const ctx = off.getContext('2d')!;
		for (const f of frames){ ctx.drawImage(f,0,0); }
		return await new Promise<Blob>((resolve)=> off.toBlob(b=>resolve(b||new Blob()), 'image/webp'));
	})();
	return webp;
}

export function downloadBlob(filename: string, blob: Blob) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url; a.download = filename; a.click();
	URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown){
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}


