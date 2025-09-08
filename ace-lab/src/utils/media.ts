export async function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}

export async function captureCanvasWebm(canvas: HTMLCanvasElement, seconds: number): Promise<Blob> {
	const stream = (canvas as any).captureStream ? (canvas as any).captureStream(60) : null;
	if (!stream) throw new Error('captureStream not supported');
	const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
	const chunks: Blob[] = [];
	recorder.ondataavailable = (e) => chunks.push(e.data);
	recorder.start();
	await new Promise((r) => setTimeout(r, seconds * 1000));
	recorder.stop();
	await new Promise((r) => (recorder.onstop = () => r(null)));
	return new Blob(chunks, { type: 'video/webm' });
}

export async function captureScaledWebmFromCanvas(source: HTMLCanvasElement, targetWidth: number, seconds: number): Promise<Blob> {
	const scale = targetWidth / source.width;
	const w = Math.round(targetWidth);
	const h = Math.round(source.height * scale);
	const off = document.createElement('canvas');
	off.width = w; off.height = h;
	const ctx = off.getContext('2d');
	if (!ctx) throw new Error('2D context not available');
	const stream = (off as any).captureStream ? (off as any).captureStream(60) : null;
	if (!stream) throw new Error('captureStream not supported');
	const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
	const chunks: Blob[] = [];
	recorder.ondataavailable = (e) => chunks.push(e.data);
	recorder.start();
	let running = true;
	const start = performance.now();
	function draw() {
		if (!running) return;
		ctx.clearRect(0,0,w,h);
		ctx.drawImage(source, 0, 0, w, h);
		if (performance.now() - start < seconds * 1000) {
			requestAnimationFrame(draw);
		}
	}
	draw();
	await new Promise((r) => setTimeout(r, seconds * 1000));
	recorder.stop();
	await new Promise((r) => (recorder.onstop = () => r(null)));
	running = false;
	return new Blob(chunks, { type: 'video/webm' });
}


