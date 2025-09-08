export function fpsFromSamples(samples: number[], windowMs = 1000): number {
	const now = performance.now();
	const windowStart = now - windowMs;
	const count = samples.filter((t) => t >= windowStart).length;
	return (count / windowMs) * 1000;
}


