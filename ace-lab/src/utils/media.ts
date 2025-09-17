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

type ClipIn = { id: string; kind: 'image'|'video'; src: string; durationSec: number; name?: string };
type ExportClipsOpts = { width: number; height: number; fps?: number; bitrateKbps?: number; audioUrl?: string; audioVolume?: number; onProgress?: (p:number)=>void; signal?: AbortSignal };

export async function exportClipsToWebm(clips: ClipIn[], opts: ExportClipsOpts): Promise<Blob> {
    const fps = opts.fps ?? 30;
    const off = document.createElement('canvas'); off.width = opts.width; off.height = opts.height;
    const ctx = off.getContext('2d')!;
    const videoStream = (off as any).captureStream ? (off as any).captureStream(fps) : null;
    if (!videoStream) throw new Error('captureStream not supported');
    let combined: MediaStream = videoStream;
    let audioEl: HTMLAudioElement | null = null;
    try {
        if (opts.audioUrl) {
            audioEl = document.createElement('audio');
            audioEl.src = opts.audioUrl; audioEl.crossOrigin = 'anonymous'; (audioEl as any).playsInline = true; audioEl.loop = true; await audioEl.play().catch(()=>{});
            if (typeof opts.audioVolume === 'number') audioEl.volume = Math.max(0, Math.min(1, opts.audioVolume));
            const astream = (audioEl as any).captureStream ? (audioEl as any).captureStream() : null;
            if (astream) {
                combined = new MediaStream([ ...(videoStream.getVideoTracks()), ...(astream.getAudioTracks()) ]);
            }
        }
    } catch {}
    const recorder = new MediaRecorder(combined, { mimeType: 'video/webm;codecs=vp9', bitsPerSecond: opts.bitrateKbps ? opts.bitrateKbps * 1000 : undefined } as any);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.start();
    let aborted = false;
    const stop = () => { if (!aborted) { aborted = true; try { recorder.stop(); } catch {} } };
    if (opts.signal) { opts.signal.addEventListener('abort', stop, { once: true }); }
    const totalFrames = clips.reduce((sum,c)=> sum + Math.max(1, Math.floor(c.durationSec * fps)), 0);
    let written = 0;
    for (const clip of clips) {
        if (aborted) break;
        if (clip.kind === 'image') {
            const img = await loadImage(clip.src);
            const frames = Math.max(1, Math.floor(clip.durationSec * fps));
            for (let i=0;i<frames && !aborted;i++){
                ctx.clearRect(0,0,off.width, off.height);
                ctx.drawImage(img, 0, 0, off.width, off.height);
                written++; if (opts.onProgress) opts.onProgress(Math.min(1, written/totalFrames));
                await new Promise(r=>requestAnimationFrame(r));
            }
        } else {
            const v = document.createElement('video'); v.src = clip.src; v.crossOrigin = 'anonymous'; v.loop = true; v.muted = true; (v as any).playsInline = true; await v.play().catch(()=>{});
            await new Promise(r=> v.addEventListener('canplay', ()=> r(null), { once: true }));
            const endAt = performance.now() + clip.durationSec * 1000;
            while (performance.now() < endAt && !aborted) {
                if (v.readyState >= 2) {
                    ctx.clearRect(0,0,off.width, off.height);
                    ctx.drawImage(v, 0, 0, off.width, off.height);
                }
                written++; if (opts.onProgress) opts.onProgress(Math.min(1, written/totalFrames));
                await new Promise(r=>requestAnimationFrame(r));
            }
            try { v.pause(); } catch {}
        }
    }
    stop();
    await new Promise((r) => (recorder.onstop = () => r(null)));
    try { if (audioEl) { audioEl.pause(); audioEl.removeAttribute('src'); audioEl.load(); } } catch {}
    return new Blob(chunks, { type: 'video/webm' });
}


