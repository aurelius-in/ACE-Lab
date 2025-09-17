import { useRef, useState } from 'react';
import { useLabStore } from '../store/useLabStore';
import type { InpaintResponse } from '../types/services';
import { fetchJsonWithRetry } from '../utils/net';

export default function GenerativeFillPanel(){
    const [prompt, setPrompt] = useState('repair small blemishes');
    const [selecting, setSelecting] = useState(false);
    const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const overlayRef = useRef<HTMLDivElement|null>(null);
    const addRegion = useLabStore(s=>s.addInpaintRegion!);
    const clearRegions = useLabStore(s=>s.clearInpaintRegions!);
    const setFeather = useLabStore(s=>s.setInpaintFeather!);
    const setInvert = useLabStore(s=>s.setInpaintInvert!);
    const inpaint = useLabStore(s=>s.inpaint);
    const setPrimary = useLabStore(s=>s.setPrimary);

    function captureSnapshot(): HTMLCanvasElement | null {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement | null; if (!canvas) return null;
        const off = document.createElement('canvas'); off.width = canvas.width; off.height = canvas.height;
        off.getContext('2d')!.drawImage(canvas, 0, 0);
        return off;
    }

    function startSelect(){ setSelecting(true); setBox(null); clearRegions(); }
    function onMouseDown(e: React.MouseEvent){ if (!selecting) return; const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); setBox({ x: e.clientX - r.left, y: e.clientY - r.top, w: 0, h: 0 }); }
    function onMouseMove(e: React.MouseEvent){ if (!selecting || !box) return; const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); setBox(b => b ? ({ ...b, w: e.clientX - r.left - b.x, h: e.clientY - r.top - b.y }) : b); }
    function onMouseUp(){ setSelecting(false); if (box) { addRegion({ x: box.x, y: box.y, w: box.w, h: box.h }); } }

    async function runFill(){
        const snap = captureSnapshot(); if (!snap || !box) return;
        const regs = (inpaint?.regions && inpaint.regions.length>0) ? inpaint.regions : [box];
        const x = Math.max(0, Math.min(snap.width-1, Math.round(regs[0].x)));
        const y = Math.max(0, Math.min(snap.height-1, Math.round(regs[0].y)));
        const w = Math.max(1, Math.min(snap.width-x, Math.round(Math.abs(regs[0].w))));
        const h = Math.max(1, Math.min(snap.height-y, Math.round(Math.abs(regs[0].h))));
        const crop = document.createElement('canvas'); crop.width = w; crop.height = h; crop.getContext('2d')!.drawImage(snap, x, y, w, h, 0, 0, w, h);
        // build mask with feather/invert
        const mask = document.createElement('canvas'); mask.width = w; mask.height = h; const mctx = mask.getContext('2d')!;
        mctx.fillStyle = inpaint?.invert ? '#000' : '#fff'; mctx.fillRect(0,0,w,h);
        if (inpaint?.featherPx) {
            const g = mctx.createRadialGradient(w/2,h/2,Math.max(1,Math.min(w,h)/2 - inpaint.featherPx), w/2,h/2, Math.max(w,h)/2);
            if (inpaint.invert) { g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)'); }
            else { g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(255,255,255,0)'); }
            mctx.globalCompositeOperation = inpaint.invert ? 'destination-out' : 'destination-in';
            mctx.fillStyle = g; mctx.fillRect(0,0,w,h); mctx.globalCompositeOperation = 'source-over';
        }
        const image_url = crop.toDataURL('image/png'); const mask_url = mask.toDataURL('image/png');
        let j: InpaintResponse;
        try {
            const token = localStorage.getItem('ace-token');
            j = await fetchJsonWithRetry<InpaintResponse>('http://localhost:8103/inpaint', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ prompt, image_url, mask_url }) }, { retries: 2, backoffMs: 500 });
            if (!j.patch_url) throw new Error('Invalid inpaint response');
        } catch (e) {
            useLabStore.getState().showToast?.('Inpaint failed');
            return;
        }
        const patchImg = new Image(); await new Promise(r => { patchImg.onload = () => r(null); patchImg.src = j.patch_url; });
        const merged = document.createElement('canvas'); merged.width = snap.width; merged.height = snap.height;
        const m = merged.getContext('2d')!; m.drawImage(snap, 0, 0); m.drawImage(patchImg, x, y, w, h);
        setPrimary(merged.toDataURL('image/png'));
    }

    return (
        <div className="space-y-3">
            <div className="text-sm text-black/70">Paint a rectangle to inpaint</div>
            <div className="flex gap-2 items-center">
                <input className="flex-1 input" aria-label="Prompt" title="Prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Prompt" />
                <button className="btn-compact" aria-label="Select Area" title="Select Area" onClick={startSelect}>Select Area</button>
                <button className="btn-compact" aria-label="Fill" title="Fill" disabled={!box} onClick={runFill}>Fill</button>
            </div>
            <div className="flex items-center gap-3 text-sm text-black/70">
                <label className="flex items-center gap-2"><span>Feather</span><input type="range" min={0} max={64} step={1} value={inpaint?.featherPx||8} onChange={(e)=> setFeather(Number(e.target.value))} /></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!inpaint?.invert} onChange={(e)=> setInvert(e.target.checked)} /><span>Invert</span></label>
            </div>
            <div ref={overlayRef} className="relative rounded border border-black/10 bg-white/80 text-black p-2 select-none" aria-label="Selection overlay" role="region" title="Selection overlay"
                 onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
                 style={{ width: 480, height: 270 }}>
                <div className="absolute inset-0 grid place-items-center text-xs text-black/60">Click and drag to select</div>
                {box && (
                    <div className="absolute border-2 border-pink-500/80 bg-pink-500/10" style={{ left: Math.min(box.x, box.x+box.w), top: Math.min(box.y, box.y+box.h), width: Math.abs(box.w), height: Math.abs(box.h) }} />
                )}
            </div>
        </div>
    );
}


