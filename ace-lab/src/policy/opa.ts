// Lightweight OPA WASM loader. Expects a compiled WASM at /policy/policy.wasm
// Falls back to simple JS rule if WASM unavailable.

export type OutputMeta = { width: number; height: number; device: 'mobile'|'desktop'; hasText?: boolean };

export async function checkWithOpa(meta: OutputMeta): Promise<{ allowed: boolean; violations: string[] }>{
  try {
    const resp = await fetch('/policy/policy.wasm');
    if (!resp.ok) throw new Error('no wasm');
    const bytes = await resp.arrayBuffer();
    // @ts-ignore - dynamic import
    const { loadPolicy } = await import('@open-policy-agent/opa-wasm');
    const policy = await loadPolicy(bytes);
    policy.setData({});
    const result = policy.evaluate(meta) as any[];
    const decision = result?.[0]?.result ?? {};
    if (decision.allow) return { allowed: true, violations: [] };
    const violations: string[] = Array.isArray(decision.violations) ? decision.violations : ['Policy violation'];
    return { allowed: false, violations };
  } catch {
    // Fallback JS check: mobile <= 1080p
    if (meta.device === 'mobile' && Math.max(meta.width, meta.height) > 1920) {
      return { allowed: false, violations: ['Export exceeds 1080p on mobile'] };
    }
    return { allowed: true, violations: [] };
  }
}


