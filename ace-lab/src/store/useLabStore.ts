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
};

export const useLabStore = create<LabState>((set) => ({
	media: {},
	effect: { id: 'halftone', params: { u0: 0.5, u1: 0.5, u2: 0.5, u3: 0.5 }, mix: 0 },
	timeline: { keyframes: [{ t: 0.0, mix: 0 }, { t: 1.0, mix: 1 }] },
	fps: 60,
	presets: [],
	setEffectParam: (k, v) => set((s) => ({ effect: { ...s.effect, params: { ...s.effect.params, [k]: v } } })),
	applyPreset: (p) => set(() => ({ effect: { id: p.id, params: p.params, mix: 0 } })),
}));


