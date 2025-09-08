import { create } from 'zustand';
import { checkPolicy } from '../policy/check';
import { briefFromPrompt } from '../agents/brief';
import { measureFps } from '../utils/perf';

export type TexSource = { kind: 'image'|'video'; src: string };
export type Preset = { id: string; name: string; params: Record<string, number> };

export type StylePack = {
	palette: string[];
	blocks: string[];
	params: Record<string, number>;
	timeline: { t: number; mix: number }[];
};

type TextParams = { amp: number; freq: number; speed: number; outlinePx: number };

type LabState = {
	media: { primary?: TexSource; secondary?: TexSource };
	effect: { id: string; params: Record<string, number>; mix: number };
	timeline: { keyframes: { t: number; mix: number }[] };
	play: { t: number; playing: boolean };
	fps: number; gpuMs?: number;
	device: 'mobile'|'desktop';
	presets: Preset[];
	editCount: number;
	text: { enabled: boolean; value: string; params: TextParams };
	exportSettings: { width?: number; height?: number };
	briefPrompt: string;
	qa?: { fps: number };
	setEffectParam: (k: string, v: number) => void;
	setEffectId: (id: string) => void;
	applyPreset: (p: Preset) => void;
	record: (seconds: number) => Promise<void>;
	runAgent: (name: string, input?: unknown) => Promise<void>;
	setFps: (n: number) => void;
	setPrimary: (src: string) => void;
	setSecondary: (src: string) => void;
	clearPrimary: () => void;
	clearSecondary: () => void;
	exportPolicyCheck: (w: number, h: number) => { allowed: boolean; message?: string; fix?: () => { width: number; height: number } };
	setTextValue: (t: string) => void;
	setTextParam: (k: keyof TextParams, v: number) => void;
	toggleText: (on: boolean) => void;
	setDevice: (d: 'mobile'|'desktop') => void;
	setBriefPrompt: (t: string) => void;
	setExportSize: (w?: number, h?: number) => void;
	setPlayhead: (t: number) => void;
	togglePlay: () => void;
	buildStylePack: () => StylePack;
	applyStylePack: (sp: StylePack) => void;
	resetDefaults: () => void;
	hydrateFrom: (p: Partial<Pick<LabState,'effect'|'timeline'|'text'|'device'|'exportSettings'|'play'>>) => void;
};

export const useLabStore = create<LabState>((set, get) => ({
	media: {},
	effect: { id: 'halftone', params: { dotScale: 8, angleRad: 0.6, contrast: 1.0, invert01: 0 }, mix: 0 },
	timeline: { keyframes: [{ t: 0.0, mix: 0 }, { t: 1.0, mix: 1 }] },
	play: { t: 0, playing: true },
	fps: 60,
	device: 'desktop',
	presets: [
		{ id: 'halftone-soft', name: 'Soft Halftone', params: { dotScale: 10, angleRad: 0.5, contrast: 0.9, invert01: 0 } },
		{ id: 'halftone-bold', name: 'Bold Halftone', params: { dotScale: 6, angleRad: 0.8, contrast: 1.3, invert01: 0 } },
	],
	editCount: 0,
	text: { enabled: false, value: 'ACE Lab', params: { amp: 6, freq: 10, speed: 2, outlinePx: 1 } },
	exportSettings: {},
	briefPrompt: 'warm retro print, soft grain',
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
	setEffectId: (id) => set((s)=> {
		const current = s.effect;
		let params = { ...current.params };
		if (id === 'crosszoom') {
			params.zoomStrength = params.zoomStrength ?? 0.8;
			params.samples = params.samples ?? 16;
		} else if (id === 'halftone') {
			params.dotScale = params.dotScale ?? 8;
			params.angleRad = params.angleRad ?? 0.6;
			params.contrast = params.contrast ?? 1.0;
			params.invert01 = params.invert01 ?? 0;
		}
		return { effect: { ...current, id, params } } as Partial<LabState> as any;
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
		} else if (name === 'BriefAgent') {
			const lp = briefFromPrompt(get().briefPrompt);
			set({ effect: { ...get().effect, params: { ...get().effect.params, ...lp.params } } });
		} else if (name === 'PolicyAgent') {
			if (get().device === 'mobile') { set({ exportSettings: { width: 1920 } }); }
		} else if (name === 'QAAgent') {
			const r = await measureFps(1000);
			set({ qa: { fps: r.fps } });
		}
	},
	setFps: (n) => set(() => ({ fps: n })),
	setPrimary: (src) => set((s) => ({ media: { ...s.media, primary: { kind: 'image', src } } })),
	setSecondary: (src) => set((s) => ({ media: { ...s.media, secondary: { kind: 'image', src } } })),
	clearPrimary: () => set((s) => ({ media: { ...s.media, primary: undefined } })),
	clearSecondary: () => set((s) => ({ media: { ...s.media, secondary: undefined } })),
	exportPolicyCheck: (w, h) => {
		const res = checkPolicy({ width: w, height: h, device: get().device });
		if (res.allowed) return { allowed: true };
		const fix = res.fixes?.[0];
		return { allowed: false, message: res.violations[0], fix: fix ? () => fix.apply({ width: w, height: h, device: get().device }) : undefined };
	},
	setTextValue: (t) => set((s)=> ({ text: { ...s.text, value: t } })),
	setTextParam: (k, v) => set((s)=> ({ text: { ...s.text, params: { ...s.text.params, [k]: v } } })),
	toggleText: (on) => set((s)=> ({ text: { ...s.text, enabled: on } })),
	setDevice: (d) => set(() => ({ device: d })),
	setBriefPrompt: (t) => set(() => ({ briefPrompt: t })),
	setExportSize: (w, h) => set(() => ({ exportSettings: { width: w, height: h } })),
	setPlayhead: (t) => set(() => ({ play: { ...get().play, t: Math.max(0, Math.min(1, t)) } })),
	togglePlay: () => set(() => ({ play: { ...get().play, playing: !get().play.playing } })),
	buildStylePack: () => {
		const s = get();
		return { palette: ['#6E00FF', '#A83CF0', '#FF4BB5'], blocks: [s.effect.id], params: s.effect.params, timeline: s.timeline.keyframes };
	},
	applyStylePack: (sp) => set(() => ({ effect: { id: sp.blocks[0] || 'halftone', params: sp.params, mix: 0 }, timeline: { keyframes: sp.timeline } })),
	resetDefaults: () => set(() => ({
		effect: { id: 'halftone', params: { dotScale: 8, angleRad: 0.6, contrast: 1.0, invert01: 0 }, mix: 0 },
		timeline: { keyframes: [{ t: 0.0, mix: 0 }, { t: 1.0, mix: 1 }] },
		play: { t: 0, playing: true },
		text: { enabled: false, value: 'ACE Lab', params: { amp: 6, freq: 10, speed: 2, outlinePx: 1 } },
		exportSettings: {},
	})),
	hydrateFrom: (p) => set(() => ({
		effect: p.effect ? { ...get().effect, ...p.effect } : get().effect,
		timeline: p.timeline ? { keyframes: p.timeline.keyframes } : get().timeline,
		text: p.text ? { ...get().text, ...p.text } : get().text,
		device: p.device ?? get().device,
		exportSettings: p.exportSettings ?? get().exportSettings,
		play: p.play ?? get().play,
	})),
}));


