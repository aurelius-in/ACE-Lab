export type FrameStats = { fps: number; cpuMs: number; gpuMs?: number };
export type OutputMeta = { width: number; height: number; hasText?: boolean };
export type Fix = { description: string; apply: () => void };
export type SuggestContext = { edits: number; device: 'mobile'|'desktop' };
export type Preset = { id: string; name: string; params: Record<string, number> };

export interface RenderTool {
	compile(src: string): { ok: boolean; log?: string; id?: string };
	render(id: string, params: Record<string, number>): FrameStats;
	profile(id: string): { gpuMs?: number; cpuMs: number; fps: number };
}
export interface MediaTool {
	analyzeImage(file: File): { palette: string[]; saturation: number; contrast: number };
	analyzeMotion(video: File): { magnitude: number; beats?: number[] };
}
export interface PolicyTool {
	check(meta: OutputMeta): { allowed: boolean; violations: string[]; fixes?: Fix[] };
}
export interface PresetStore {
	suggest(ctx: SuggestContext): Preset[];
	save(p: Preset): void;
}


