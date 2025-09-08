import { create } from 'zustand';

export type TexSource = { kind: 'image'|'video'; src: string };
export type Preset = { id: string; name: string; params: Record<string, number> };

type LabState = {
	media: { primary?: TexSource; secondary?: TexSource };
	effect: { id: string; params: Record<string, number>; mix: number };
	timeline: { keyframes: { t: number; mix: number }[] };
	fps: number; gpuMs?: number;
	presets: Preset[];
	setEffectParam: (k: string, v: number) => void;
	applyPreset: (p: Preset) => void;
	record: (seconds: number) => Promise<void>;
	runAgent: (name: string, input?: unknown) => Promise<void>;
	setFps: (n: number) => void;
	setPrimary: (src: string) => void;
	setSecondary: (src: string) => void;
};

export const useLabStore = create<LabState>((set) => ({
	media: {},
	effect: { id: 'halftone', params: { dotScale: 8, angleRad: 0.6, contrast: 1.0, invert01: 0 }, mix: 0 },
	timeline: { keyframes: [{ t: 0.0, mix: 0 }, { t: 1.0, mix: 1 }] },
	fps: 60,
	presets: [
		{ id: 'halftone-soft', name: 'Soft Halftone', params: { dotScale: 10, angleRad: 0.5, contrast: 0.9, invert01: 0 } },
		{ id: 'halftone-bold', name: 'Bold Halftone', params: { dotScale: 6, angleRad: 0.8, contrast: 1.3, invert01: 0 } },
	],
	setEffectParam: (k, v) => set((s) => ({ effect: { ...s.effect, params: { ...s.effect.params, [k]: v } } })),
	applyPreset: (p) => set(() => ({ effect: { id: p.id, params: p.params, mix: 0 } })),
	record: async () => { /* handled in App for now */ },
	runAgent: async (name) => {
		if (name === 'TransitionAgent') {
			// Simple stub: generate cross-zoom keyframes
			const keys = [
				{ t: 0.0, mix: 0 },
				{ t: 0.5, mix: 1 },
				{ t: 1.0, mix: 0 },
			];
			set(() => ({ timeline: { keyframes: keys } }));
		}
	},
	setFps: (n) => set(() => ({ fps: n })),
	setPrimary: (src) => set((s) => ({ media: { ...s.media, primary: { kind: 'image', src } } })),
	setSecondary: (src) => set((s) => ({ media: { ...s.media, secondary: { kind: 'image', src } } })),
}));


