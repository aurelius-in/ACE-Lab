import { create } from 'zustand';
import { checkPolicy } from '../policy/check';

export type TexSource = { kind: 'image'|'video'; src: string };
export type Preset = { id: string; name: string; params: Record<string, number> };

type TextParams = { amp: number; freq: number; speed: number; outlinePx: number };

type LabState = {
	media: { primary?: TexSource; secondary?: TexSource };
	effect: { id: string; params: Record<string, number>; mix: number };
	timeline: { keyframes: { t: number; mix: number }[] };
	fps: number; gpuMs?: number;
	device: 'mobile'|'desktop';
	presets: Preset[];
	editCount: number;
	text: { enabled: boolean; value: string; params: TextParams };
	setEffectParam: (k: string, v: number) => void;
	applyPreset: (p: Preset) => void;
	record: (seconds: number) => Promise<void>;
	runAgent: (name: string, input?: unknown) => Promise<void>;
	setFps: (n: number) => void;
	setPrimary: (src: string) => void;
	setSecondary: (src: string) => void;
	exportPolicyCheck: (w: number, h: number) => { allowed: boolean; message?: string; fix?: () => { width: number; height: number } };
	setTextValue: (t: string) => void;
	setTextParam: (k: keyof TextParams, v: number) => void;
	toggleText: (on: boolean) => void;
};

export const useLabStore = create<LabState>((set, get) => ({
	media: {},
	effect: { id: 'halftone', params: { dotScale: 8, angleRad: 0.6, contrast: 1.0, invert01: 0 }, mix: 0 },
	timeline: { keyframes: [{ t: 0.0, mix: 0 }, { t: 1.0, mix: 1 }] },
	fps: 60,
	device: 'desktop',
	presets: [
		{ id: 'halftone-soft', name: 'Soft Halftone', params: { dotScale: 10, angleRad: 0.5, contrast: 0.9, invert01: 0 } },
		{ id: 'halftone-bold', name: 'Bold Halftone', params: { dotScale: 6, angleRad: 0.8, contrast: 1.3, invert01: 0 } },
	],
	editCount: 0,
	text: { enabled: false, value: 'ACE Lab', params: { amp: 6, freq: 10, speed: 2, outlinePx: 1 } },
	setEffectParam: (k, v) => set((s) => {
		const next = { effect: { ...s.effect, params: { ...s.effect.params, [k]: v } }, editCount: s.editCount + 1 } as Partial<LabState> as any;
		if (s.editCount + 1 === 10 && s.presets.length < 2) {
			next.presets = [
				...(s.presets ?? []),
				{ id: 'suggest-1', name: 'ACE Warm Print', params: { dotScale: 9, angleRad: 0.55, contrast: 1.1, invert01: 0 } },
				{ id: 'suggest-2', name: 'Mobile Safe', params: { dotScale: 12, angleRad: 0.6, contrast: 0.95, invert01: 0 } },
			];
		}
		return next;
	}),
	applyPreset: (p) => set(() => ({ effect: { id: p.id, params: p.params, mix: 0 } })),
	record: async () => { /* handled in App for now */ },
	runAgent: async (name) => {
		if (name === 'TransitionAgent') {
			const keys = [ { t: 0.0, mix: 0 }, { t: 0.5, mix: 1 }, { t: 1.0, mix: 0 } ];
			set(() => ({ timeline: { keyframes: keys } }));
		} else if (name === 'PresetAgent') {
			const s = get();
			if (s.presets.filter(p=>p.id.startsWith('ai-')).length === 0) {
				set({ presets: [...s.presets, { id: 'ai-contrast', name: 'ACE Contrast Pop', params: { dotScale: 7, angleRad: 0.7, contrast: 1.25, invert01: 0 } }, { id: 'ai-retro', name: 'Retro Orchid', params: { dotScale: 11, angleRad: 0.4, contrast: 0.9, invert01: 0 } }] });
			}
		} else if (name === 'PerfAgent') {
			const s = get();
			if (s.media.secondary) {
				const params = { ...s.effect.params } as any;
				if (typeof params.samples === 'number') { params.samples = Math.max(8, Math.floor(params.samples * 0.7)); } else { params.samples = 8; }
				set({ effect: { ...s.effect, params } });
			}
		}
	},
	setFps: (n) => set(() => ({ fps: n })),
	setPrimary: (src) => set((s) => ({ media: { ...s.media, primary: { kind: 'image', src } } })),
	setSecondary: (src) => set((s) => ({ media: { ...s.media, secondary: { kind: 'image', src } } })),
	exportPolicyCheck: (w, h) => {
		const res = checkPolicy({ width: w, height: h, device: get().device });
		if (res.allowed) return { allowed: true };
		const fix = res.fixes?.[0];
		return { allowed: false, message: res.violations[0], fix: fix ? () => fix.apply({ width: w, height: h, device: get().device }) : undefined };
	},
	setTextValue: (t) => set((s)=> ({ text: { ...s.text, value: t } })),
	setTextParam: (k, v) => set((s)=> ({ text: { ...s.text, params: { ...s.text.params, [k]: v } } })),
	toggleText: (on) => set((s)=> ({ text: { ...s.text, enabled: on } })),
}));


