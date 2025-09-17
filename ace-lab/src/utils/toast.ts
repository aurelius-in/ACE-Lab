export function showErrorToast(message: string){
    try { const s = (window as any).useLabStore?.getState?.(); if (s?.showToast) s.showToast(message); } catch {}
}


