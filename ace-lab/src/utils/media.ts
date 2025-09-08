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


