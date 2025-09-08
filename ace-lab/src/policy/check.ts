export type OutputMeta = { width: number; height: number; device: 'mobile'|'desktop'; hasText?: boolean };
export type PolicyResult = { allowed: boolean; violations: string[]; fixes?: { label: string; apply: (m: OutputMeta) => OutputMeta }[] };

export function checkPolicy(meta: OutputMeta): PolicyResult {
	const violations: string[] = [];
	const fixes: { label: string; apply: (m: OutputMeta) => OutputMeta }[] = [];
	if (meta.device === 'mobile' && Math.max(meta.width, meta.height) > 1920) {
		violations.push('Export exceeds 1080p on mobile');
		fixes.push({ label: 'Set export size to 1080p', apply: (m) => ({ ...m, width: 1920, height: Math.round((1920 / m.width) * m.height) }) });
	}
	return { allowed: violations.length === 0, violations, fixes };
}
