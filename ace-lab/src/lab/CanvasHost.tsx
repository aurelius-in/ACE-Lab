import { useEffect, useRef, useState } from 'react';
import { fpsFromSamples } from '../utils/perf';
import { useLabStore } from '../store/useLabStore';

export default function CanvasHost() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const publishFps = useLabStore(s => s.setFps);
  const [fps, setFpsLocal] = useState(60);

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
		const times: number[] = [];
		const loop = () => {
			resize(); clear();
			times.push(performance.now()); if(times.length>120) times.shift();
			const f = Math.round(fpsFromSamples(times));
			setFpsLocal(f); publishFps(f);
			raf = requestAnimationFrame(loop);
		};
		renderQueueMicrotask(() => loop());
		return () => cancelAnimationFrame(raf);
	}, [publishFps]);

	return (
		<div className="relative w-full h-full">
			<canvas ref={canvasRef} className="w-full h-full rounded-2xl" aria-label="editor preview" />
			<div className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-black/60 border border-white/10">{fps} fps</div>
		</div>
	)
}

function renderQueueMicrotask(fn: () => void) { Promise.resolve().then(fn); }


