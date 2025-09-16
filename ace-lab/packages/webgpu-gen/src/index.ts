export type InitOptions = { modelUrl: string; devicePreference?: 'webgpu'|'wasm' };
export type GenerateOptions = { prompt: string; negativePrompt?: string; seed?: number; steps?: number; cfg?: number; width?: number; height?: number };

let initialized = false;
let currentAbort: AbortController | null = null;

export async function init(opts: InitOptions){
	// Placeholder: load model and pick device
	initialized = true; return { device: opts.devicePreference || 'webgpu' } as const;
}

export async function generate(opts: GenerateOptions): Promise<HTMLCanvasElement>{
	if (!initialized) throw new Error('webgpu-gen not initialized');
	currentAbort?.abort(); currentAbort = new AbortController();
	const { width=512, height=512 } = opts;
	const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
	const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#000'; ctx.fillRect(0,0,width,height);
	ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.fillText('webgpu-gen placeholder', 12, 24);
	ctx.fillText(opts.prompt.slice(0, 40), 12, 48);
	return canvas;
}

export function cancel(){ currentAbort?.abort(); }


