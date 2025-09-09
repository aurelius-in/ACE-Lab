import { z } from 'zod';

export type BlockSpec = {
	name: string;
	file: string;
	params: z.ZodObject<any>;
};

export const HalftoneParams = z.object({ dotScale: z.number().min(1).max(64).default(9), angleRad: z.number().default(0.55), contrast: z.number().min(0.2).max(2).default(1.1), invert01: z.number().min(0).max(1).default(0) });
export const VhsParams = z.object({ aberration: z.number().min(0).max(1.5).default(0.6), noise: z.number().min(0).max(1).default(0.25), scanline: z.number().min(0).max(1).default(0.3), vignette: z.number().min(0).max(1).default(0.25) });
export const CrosszoomParams = z.object({ zoomStrength: z.number().min(0).max(2).default(0.9), samples: z.number().min(1).max(48).default(16) });
export const TextwaveParams = z.object({ amp: z.number().min(0).max(40).default(8), freq: z.number().min(0).max(40).default(10), speed: z.number().min(0).max(10).default(2), outlinePx: z.number().min(0).max(8).default(1) });

export const catalog: BlockSpec[] = [
	{ name: 'halftone', file: 'blocks/halftone.frag', params: HalftoneParams },
	{ name: 'vhs', file: 'blocks/vhs.frag', params: VhsParams },
	{ name: 'crosszoom', file: 'blocks/crosszoom.frag', params: CrosszoomParams },
	{ name: 'textwave', file: 'blocks/textwave.frag', params: TextwaveParams },
];


