import { create } from 'zustand';
import { checkPolicy } from '../policy/check';
import { briefFromPrompt } from '../agents/brief';
import { measureFps } from '../utils/perf';

export type TexSource = { kind: 'image'|'video'; src: string };
export type Preset = { id: string; name: string; params: Record<string, number>; thumb?: string };

export type StylePack = {
	palette: string[];
	blocks: string[];
	params: Record<string, number>;
	timeline: { t: number; mix: number }[];
};

type TextParams = { amp: number; freq: number; speed: number; outlinePx: number };

type Clip = { id: string; kind: 'image'|'video'; src: string; durationSec: number; name?: string };

type InpaintSelection = { x: number; y: number; w: number; h: number };

type LabState = {
	media: { primary?: TexSource; secondary?: TexSource };
	clips?: Clip[];
	effect: { id: string; params: Record<string, number>; mix: number };
	assets?: { lutSrc?: string; lutFavorites?: string[] };
	timeline: { keyframes: { t: number; mix: number }[] };
	play: { t: number; playing: boolean };
	fps: number; gpuMs?: number;
	device: 'mobile'|'desktop';
	presets: Preset[];
	editCount: number;
	text: { enabled: boolean; value: string; params: TextParams; font?: string };
	exportSettings: { width?: number; height?: number; bitrateKbps?: number; audioUrl?: string; audioVolume?: number };
	inpaint?: { enabled: boolean; regions: InpaintSelection[]; featherPx: number; invert: boolean };
	briefPrompt: string;
	qa?: { fps: number };
	toast?: { message: string; t: number };
	agentLog?: { name: string; message: string; t: number }[];
	agentTraces?: { name: string; started: number; durationMs: number; note?: string }[];
	timelineEasing?: 'linear'|'easeIn'|'easeOut'|'easeInOut';
	setEffectParam: (k: string, v: number) => void;
	setEffectId: (id: string) => void;
	applyPreset: (p: Preset) => void;
	record: (seconds: number) => Promise<void>;
	runAgent: (name: string, input?: unknown) => Promise<void>;
	setFps: (n: number) => void;
	setPrimary: (src: string) => void;
	setSecondary: (src: string) => void;
	setPrimaryVideo?: (src: string) => void;
	setSecondaryVideo?: (src: string) => void;
	clearPrimary: () => void;
	clearSecondary: () => void;
	exportPolicyCheck: (w: number, h: number) => Promise<{ allowed: boolean; message?: string; fix?: () => { width: number; height: number }, violations?: string[] }>;
	setTextValue: (t: string) => void;
	setTextParam: (k: keyof TextParams, v: number) => void;
	toggleText: (on: boolean) => void;
	setDevice: (d: 'mobile'|'desktop') => void;
	setBriefPrompt: (t: string) => void;
	setExportSize: (w?: number, h?: number) => void;
	setExportAudioUrl?: (u?: string) => void;
	setPlayhead: (t: number) => void;
	togglePlay: () => void;
	buildStylePack: () => StylePack;
	applyStylePack: (sp: StylePack) => void;
	resetDefaults: () => void;
	hydrateFrom: (p: Partial<Pick<LabState,'effect'|'timeline'|'text'|'device'|'exportSettings'|'play'|'clips'|'inpaint'>>) => void;
	buildProject?: () => Partial<Pick<LabState,'effect'|'timeline'|'text'|'device'|'exportSettings'|'play'|'clips'|'inpaint'>>;
	saveProjectToLocal?: () => void;
	loadProjectFromLocal?: () => void;
	setNoiseOpacity: (v: number) => void;
	setLutSrc?: (src?: string) => void;
	showToast?: (message: string) => void;
	setTimelineEasing?: (e: 'linear'|'easeIn'|'easeOut'|'easeInOut') => void;
	// clips
	addClip?: (c: Clip) => void;
	removeClip?: (id: string) => void;
	reorderClips?: (fromIdx: number, toIdx: number) => void;
	setClipDuration?: (id: string, durationSec: number) => void;
	clearAgentLog?: () => void;
	clearAgentTraces?: () => void;
	addLutFavorite?: (url: string) => void;
	removeLutFavorite?: (url: string) => void;
	// inpaint selections
	setInpaintEnabled?: (on: boolean) => void;
	addInpaintRegion?: (r: InpaintSelection) => void;
	removeInpaintRegion?: (idx: number) => void;
	clearInpaintRegions?: () => void;
	setInpaintFeather?: (px: number) => void;
	setInpaintInvert?: (inv: boolean) => void;
};

export const useLabStore = create<LabState>((set, get) => ({
	media: {}, assets: {}, clips: [],
	effect: { id: 'halftone', params: { dotScale: 8, angleRad: 0.6, contrast: 1.0, invert01: 0, bloomStrength: 0.25, lutAmount: 0.2, bloomThreshold: 0.7, grainAmount: 0.05, vignette01: 1 }, mix: 0 },
	timeline: { keyframes: [{ t: 0.0, mix: 0 }, { t: 1.0, mix: 1 }] },
	play: { t: 0, playing: true },
	fps: 60,
	device: 'desktop',
	presets: [
		{ id: 'halftone-soft', name: 'Soft Halftone', params: { dotScale: 10, angleRad: 0.5, contrast: 0.9, invert01: 0 } },
		{ id: 'halftone-bold', name: 'Bold Halftone', params: { dotScale: 6, angleRad: 0.8, contrast: 1.3, invert01: 0 } },
	],
	editCount: 0,
	text: { enabled: false, value: 'ACE Lab', params: { amp: 6, freq: 10, speed: 2, outlinePx: 1 }, font: 'Poppins' },
	exportSettings: { bitrateKbps: 6000 },
	inpaint: { enabled: false, regions: [], featherPx: 8, invert: false },
	briefPrompt: 'warm retro print, soft grain',
	timelineEasing: 'linear',
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
		if (id === 'crosszoom') { params.zoomStrength = params.zoomStrength ?? 0.8; params.samples = params.samples ?? 16; }
		if (id === 'halftone') { params.dotScale = params.dotScale ?? 8; params.angleRad = params.angleRad ?? 0.6; params.contrast = params.contrast ?? 1.0; params.invert01 = params.invert01 ?? 0; }
		if (id === 'vhs') { (params as any).aberration = (params as any).aberration ?? 0.6; (params as any).noise = (params as any).noise ?? 0.25; (params as any).scanline = (params as any).scanline ?? 0.3; (params as any).vignette = (params as any).vignette ?? 0.25; }
		return { effect: { ...current, id, params } } as Partial<LabState> as any;
	}),
	applyPreset: (p) => set((s) => ({ effect: { id: s.effect.id, params: { ...s.effect.params, ...p.params }, mix: 0 } })),
	record: async () => { /* handled in App for now */ },
	runAgent: async (name) => {
		const start = performance.now();
		const push = (message: string) => set((s)=> ({ agentLog: [...(s.agentLog||[]), { name, message, t: Date.now() }] }));
		try {
			if (name === 'TransitionAgent') { const keys = [ { t: 0.0, mix: 0 }, { t: 0.5, mix: 1 }, { t: 1.0, mix: 0 } ]; set(() => ({ timeline: { keyframes: keys } })); push('Inserted 3 keyframes for cross-zoom'); }
			else if (name === 'PresetAgent') { const s = get(); if (s.presets.filter(p=>p.id.startsWith('ai-')).length === 0) { set({ presets: [...s.presets, { id: 'ai-contrast', name: 'ACE Contrast Pop', params: { dotScale: 7, angleRad: 0.7, contrast: 1.25, invert01: 0 } }, { id: 'ai-retro', name: 'Retro Orchid', params: { dotScale: 11, angleRad: 0.4, contrast: 0.9, invert01: 0 } }] }); push('Added 2 AI-suggested presets'); } }
			else if (name === 'PerfAgent') { const s = get(); if (s.media.secondary) { const params = { ...s.effect.params } as any; params.samples = Math.max(8, Math.floor((params.samples ?? 16) * 0.7)); set({ effect: { ...s.effect, params } }); push('Reduced samples for mobile-safe performance'); } else push('No secondary media; skipped sample reduction'); }
			else if (name === 'BriefAgent') { const lp = briefFromPrompt(get().briefPrompt); set({ effect: { ...get().effect, params: { ...get().effect.params, ...lp.params } } }); push('Applied look profile from brief'); }
			else if (name === 'PolicyAgent') { if (get().device === 'mobile') { set({ exportSettings: { ...get().exportSettings, width: 1920 } }); push('Set export width to 1920 for mobile policy'); } else push('No mobile constraints detected'); }
			else if (name === 'QAAgent') { const r = await measureFps(1000); set({ qa: { fps: r.fps } }); push(`Measured ~${r.fps} fps`); }
			else if (name === 'ArchitectAgent') { const s = get(); const suggested = { bloomThreshold: 0.65, grainAmount: 0.04, lutAmount: 0.25 }; set({ effect: { ...s.effect, params: { ...s.effect.params, ...suggested } }, presets: [...s.presets, { id: 'ai-architect-1', name: 'Architect Suggestion', params: suggested }] }); push('Applied architect suggestions and saved preset'); }
		} finally {
			const durationMs = Math.round(performance.now() - start);
			set((s)=> ({ agentTraces: [...(s.agentTraces||[]), { name, started: Date.now(), durationMs }] }));
		}
	},
	setFps: (n) => set(() => ({ fps: n })),
	setPrimary: (src) => set((s) => ({ media: { ...s.media, primary: { kind: 'image', src } } })),
	setSecondary: (src) => set((s) => ({ media: { ...s.media, secondary: { kind: 'image', src } } })),
	setPrimaryVideo: (src) => set((s) => ({ media: { ...s.media, primary: { kind: 'video', src } } })),
	setSecondaryVideo: (src) => set((s) => ({ media: { ...s.media, secondary: { kind: 'video', src } } })),
	clearPrimary: () => set((s) => ({ media: { ...s.media, primary: undefined } })),
	clearSecondary: () => set((s) => ({ media: { ...s.media, secondary: undefined } })),
	exportPolicyCheck: async (w, h) => {
		try {
			const { checkWithOpa } = await import('../policy/opa');
			const out = await checkWithOpa({ width: w, height: h, device: get().device });
			if (out.allowed) return { allowed: true, violations: [] };
			return { allowed: false, message: out.violations[0], violations: out.violations, fix: () => ({ width: 1920, height: Math.round(1920 / w * h) }) };
		} catch {
			try {
				const r = await fetch('http://localhost:4000/policy/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ width: w, height: h, device: get().device }) });
				if (r.ok) {
					const j = await r.json();
					if (j.allowed) return { allowed: true, violations: [] };
					const fx = j.fix ? () => ({ width: j.fix.width, height: j.fix.height ?? Math.round(j.fix.width / w * h) }) : undefined;
					return { allowed: false, message: j.violations?.[0], violations: j.violations, fix: fx };
				}
			} catch {}
			const res = checkPolicy({ width: w, height: h, device: get().device });
			if (res.allowed) return { allowed: true, violations: [] };
			const fix = res.fixes?.[0];
			return { allowed: false, message: res.violations[0], violations: res.violations, fix: fix ? () => fix.apply({ width: w, height: h, device: get().device }) : undefined };
		}
	},
	setTextValue: (t) => set((s)=> ({ text: { ...s.text, value: t } })),
	setTextParam: (k, v) => set((s)=> ({ text: { ...s.text, params: { ...s.text.params, [k]: v } } })),
	toggleText: (on) => set((s)=> ({ text: { ...s.text, enabled: on } })),
	setDevice: (d) => set(() => ({ device: d })),
	setBriefPrompt: (t) => set(() => ({ briefPrompt: t })),
	setExportSize: (w, h) => set(() => ({ exportSettings: { ...get().exportSettings, width: w, height: h } })),
	setExportAudioUrl: (u) => set(() => ({ exportSettings: { ...get().exportSettings, audioUrl: u } })),
	setExportAudioVolume: (v: number) => set(() => ({ exportSettings: { ...get().exportSettings, audioVolume: Math.max(0, Math.min(1, v)) } })),
	setPlayhead: (t) => set(() => ({ play: { ...get().play, t: Math.max(0, Math.min(1, t)) } })),
	togglePlay: () => set(() => ({ play: { ...get().play, playing: !get().play.playing } })),
	buildStylePack: () => { const s = get(); return { palette: ['#6E00FF', '#A83CF0', '#FF4BB5'], blocks: [s.effect.id], params: s.effect.params, timeline: s.timeline.keyframes }; },
	applyStylePack: (sp) => set(() => ({ effect: { id: sp.blocks[0] || 'halftone', params: sp.params, mix: 0 }, timeline: { keyframes: sp.timeline } })),
	resetDefaults: () => set(() => ({ effect: { id: 'halftone', params: { dotScale: 8, angleRad: 0.6, contrast: 1.0, invert01: 0, bloomStrength: 0.25, lutAmount: 0.2, bloomThreshold: 0.7, grainAmount: 0.05, vignette01: 1 }, mix: 0 }, timeline: { keyframes: [{ t: 0.0, mix: 0 }, { t: 1.0, mix: 1 }] }, play: { t: 0, playing: true }, text: { enabled: false, value: 'ACE Lab', params: { amp: 6, freq: 10, speed: 2, outlinePx: 1 }, font: 'Poppins' }, exportSettings: { bitrateKbps: 6000 }, clips: [], inpaint: { enabled: false, regions: [], featherPx: 8, invert: false } })),
	hydrateFrom: (p) => set(() => ({ effect: p.effect ? { ...get().effect, ...p.effect } : get().effect, timeline: p.timeline ? { keyframes: p.timeline.keyframes } : get().timeline, text: p.text ? { ...get().text, ...p.text } : get().text, device: p.device ?? get().device, exportSettings: p.exportSettings ?? get().exportSettings, play: p.play ?? get().play, clips: p.clips ?? get().clips, inpaint: p.inpaint ?? get().inpaint })),
	buildProject: () => ({ effect: get().effect, timeline: get().timeline, text: get().text, device: get().device, exportSettings: get().exportSettings, play: get().play, clips: get().clips, inpaint: get().inpaint }),
	saveProjectToLocal: () => { try { localStorage.setItem('ace.project', JSON.stringify((get().buildProject && get().buildProject()) || {})); get().showToast?.('Project saved'); } catch {} },
	loadProjectFromLocal: () => { try { const txt = localStorage.getItem('ace.project'); if (!txt) return; const data = JSON.parse(txt); (get().hydrateFrom as any)(data); get().showToast?.('Project loaded'); } catch {} },
	setNoiseOpacity: (v) => { document.documentElement.style.setProperty('--noise-opacity', String(Math.max(0, Math.min(0.2, v)))); },
	setLutSrc: (src) => set((s) => ({ assets: { ...(s.assets ?? {}), lutSrc: src, lutFavorites: s.assets?.lutFavorites } })),
	showToast: (message: string) => { set({ toast: { message, t: Date.now() } }); setTimeout(() => { const cur = get().toast; if (cur && Date.now() - cur.t >= 1800) { set({ toast: undefined }); } }, 2000); },
	setTimelineEasing: (e) => set(() => ({ timelineEasing: e })),
	addClip: (c) => set((s)=> ({ clips: [ ...(s.clips||[]), c ] })),
	removeClip: (id) => set((s)=> ({ clips: (s.clips||[]).filter(c=>c.id!==id) })),
	reorderClips: (fromIdx, toIdx) => set((s)=>{
		const arr = [ ...(s.clips||[]) ]; const [item] = arr.splice(fromIdx,1); if (!item) return {} as any; arr.splice(toIdx,0,item); return { clips: arr } as any;
	}),
	setClipDuration: (id, durationSec) => set((s)=> ({ clips: (s.clips||[]).map(c=> c.id===id ? { ...c, durationSec } : c) })),
	clearAgentLog: () => set(() => ({ agentLog: [] })),
	clearAgentTraces: () => set(() => ({ agentTraces: [] })),
	addLutFavorite: (url: string) => set((s)=> ({ assets: { ...(s.assets||{}), lutSrc: s.assets?.lutSrc, lutFavorites: Array.from(new Set([...(s.assets?.lutFavorites||[]), url])) } })),
	removeLutFavorite: (url: string) => set((s)=> ({ assets: { ...(s.assets||{}), lutSrc: s.assets?.lutSrc, lutFavorites: (s.assets?.lutFavorites||[]).filter(u=>u!==url) } })),
	setInpaintEnabled: (on) => set((s)=> ({ inpaint: { ...(s.inpaint||{ regions: [], featherPx: 8, invert: false }), enabled: on } })),
	addInpaintRegion: (r) => set((s)=> ({ inpaint: { ...(s.inpaint||{ enabled:false, featherPx:8, invert:false, regions:[] }), regions: [ ...((s.inpaint?.regions)||[]), r ] } })),
	removeInpaintRegion: (idx) => set((s)=> ({ inpaint: { ...(s.inpaint||{ enabled:false, featherPx:8, invert:false, regions:[] }), regions: (s.inpaint?.regions||[]).filter((_,i)=>i!==idx) } })),
	clearInpaintRegions: () => set((s)=> ({ inpaint: { ...(s.inpaint||{ enabled:false, featherPx:8, invert:false, regions:[] }), regions: [] } })),
	setInpaintFeather: (px) => set((s)=> ({ inpaint: { ...(s.inpaint||{ enabled:false, regions:[], invert:false }), featherPx: Math.max(0, Math.min(64, Math.round(px))) } })),
	setInpaintInvert: (inv) => set((s)=> ({ inpaint: { ...(s.inpaint||{ enabled:false, regions:[], featherPx:8 }), invert: !!inv } })),
}));


