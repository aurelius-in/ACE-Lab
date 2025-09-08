export function fpsFromSamples(samples: number[], windowMs = 1000): number {
	const now = performance.now();
	const windowStart = now - windowMs;
	const count = samples.filter((t) => t >= windowStart).length;
	return (count / windowMs) * 1000;
}

export async function measureFps(durationMs = 1000): Promise<{ fps: number; samples: number[] }>{
	return new Promise((resolve) => {
		const times: number[] = [];
		let raf = 0;
		const start = performance.now();
		const loop = () => {
			times.push(performance.now());
			if (performance.now() - start < durationMs) {
				raf = requestAnimationFrame(loop);
			} else {
				cancelAnimationFrame(raf);
				const fps = Math.round((times.length / durationMs) * 1000);
				resolve({ fps, samples: times });
			}
		};
		raf = requestAnimationFrame(loop);
	});
}


