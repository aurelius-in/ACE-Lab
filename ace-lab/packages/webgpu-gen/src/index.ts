export type InitOptions = { modelUrl: string; devicePreference?: 'webgpu'|'wasm' };
export type GenerateOptions = { prompt: string; negativePrompt?: string; seed?: number; steps?: number; cfg?: number; width?: number; height?: number };
export type InitResult = { device: 'webgpu'|'wasm'; initMs: number };
export type GenerateResult = { canvas: HTMLCanvasElement; ms: number };

let initialized = false;
let currentAbort: AbortController | null = null;
let deviceUsed: 'webgpu'|'wasm' = 'wasm';
let modelUrlCached = '';

export async function init(opts: InitOptions): Promise<InitResult>{
	// Best-effort: prefer WebGPU if available
	const t0 = performance.now();
	const gpu = (navigator as any).gpu;
	deviceUsed = (opts.devicePreference || (gpu ? 'webgpu' : 'wasm')) as any;
	modelUrlCached = opts.modelUrl;
	// TODO: actually fetch model asset and warm session via onnxruntime-web (omitted for brevity)
	initialized = true; const initMs = Math.max(1, Math.round(performance.now() - t0));
	return { device: deviceUsed, initMs };
}

export async function generate(opts: GenerateOptions): Promise<GenerateResult>{
	if (!initialized) throw new Error('webgpu-gen not initialized');
	currentAbort?.abort(); currentAbort = new AbortController();
	const t0 = performance.now();
	const { width=512, height=512 } = opts;
	const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
	const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#000'; ctx.fillRect(0,0,width,height);
	ctx.fillStyle = '#fff'; ctx.font = '14px system-ui, sans-serif';
	ctx.fillText(`[${deviceUsed}]`, 12, 22);
	ctx.fillText(modelUrlCached ? new URL(modelUrlCached).pathname.split('/').pop() || '' : '', 12, 40);
	ctx.fillText(opts.prompt.slice(0, 40), 12, 64);
	const ms = Math.max(1, Math.round(performance.now() - t0));
	return { canvas, ms };
}

export function cancel(){ currentAbort?.abort(); }


