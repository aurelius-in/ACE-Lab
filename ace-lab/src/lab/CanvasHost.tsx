import { useEffect, useRef } from 'react';

export default function CanvasHost() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const gl = canvas.getContext('webgl2');
		if (!gl) return;
		let raf = 0;
		function resize() {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const w = canvas.clientWidth * dpr;
			const h = canvas.clientHeight * dpr;
			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w; canvas.height = h;
				gl.viewport(0, 0, w, h);
			}
		}
		const clear = () => {
			gl.clearColor(0.04, 0.05, 0.07, 1);
			gl.clear(gl.COLOR_BUFFER_BIT);
		};
		const loop = () => { resize(); clear(); raf = requestAnimationFrame(loop); };
		renderQueueMicrotask(() => loop());
		return () => cancelAnimationFrame(raf);
	}, []);

	return <canvas ref={canvasRef} className="w-full h-full rounded-2xl" aria-label="editor preview" />
}

function renderQueueMicrotask(fn: () => void) { Promise.resolve().then(fn); }


