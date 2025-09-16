import { useRef, useState } from 'react';
import { useLabStore } from '../store/useLabStore';

type InpaintResponse = { patch_url: string; w: number; h: number };

export default function GenerativeFillPanel(){
    const [prompt, setPrompt] = useState('repair small blemishes');
    const [selecting, setSelecting] = useState(false);
    const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const overlayRef = useRef<HTMLDivElement|null>(null);
    const setPrimary = useLabStore(s=>s.setPrimary);

    function captureSnapshot(): HTMLCanvasElement | null {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement | null; if (!canvas) return null;
        const off = document.createElement('canvas'); off.width = canvas.width; off.height = canvas.height;
        off.getContext('2d')!.drawImage(canvas, 0, 0);
        return off;
    }

    function startSelect(){ setSelecting(true); setBox(null); }
    function onMouseDown(e: React.MouseEvent){ if (!selecting) return; const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); setBox({ x: e.clientX - r.left, y: e.clientY - r.top, w: 0, h: 0 }); }
    function onMouseMove(e: React.MouseEvent){ if (!selecting || !box) return; const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); setBox(b => b ? ({ ...b, w: e.clientX - r.left - b.x, h: e.clientY - r.top - b.y }) : b); }
    function onMouseUp(){ setSelecting(false); }

    async function runFill(){
        const snap = captureSnapshot(); if (!snap || !box) return;
        const x = Math.max(0, Math.min(snap.width-1, Math.round(box.x)));
        const y = Math.max(0, Math.min(snap.height-1, Math.round(box.y)));
        const w = Math.max(1, Math.min(snap.width-x, Math.round(Math.abs(box.w))));
        const h = Math.max(1, Math.min(snap.height-y, Math.round(Math.abs(box.h))));
        const crop = document.createElement('canvas'); crop.width = w; crop.height = h; crop.getContext('2d')!.drawImage(snap, x, y, w, h, 0, 0, w, h);
        const mask = document.createElement('canvas'); mask.width = w; mask.height = h; const mctx = mask.getContext('2d')!; mctx.fillStyle = '#fff'; mctx.fillRect(0,0,w,h);
        const image_url = crop.toDataURL('image/png'); const mask_url = mask.toDataURL('image/png');
        const res = await fetch('http://localhost:8103/inpaint', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, image_url, mask_url }) });
        if (!res.ok) throw new Error('Inpaint failed');
        const j: InpaintResponse = await res.json();
        if (!j.patch_url) throw new Error('Invalid inpaint response');
        const patchImg = new Image(); await new Promise(r => { patchImg.onload = () => r(null); patchImg.src = j.patch_url; });
        const merged = document.createElement('canvas'); merged.width = snap.width; merged.height = snap.height;
        const m = merged.getContext('2d')!; m.drawImage(snap, 0, 0); m.drawImage(patchImg, x, y, w, h);
        setPrimary(merged.toDataURL('image/png'));
    }

    return (
        <div className="space-y-3">
            <div className="text-sm text-black/70">Paint a rectangle to inpaint</div>
            <div className="flex gap-2 items-center">
                <input className="flex-1 input" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Prompt" />
                <button className="btn-compact" onClick={startSelect}>Select Area</button>
                <button className="btn-compact" disabled={!box} onClick={runFill}>Fill</button>
            </div>
            <div ref={overlayRef} className="relative rounded border border-black/10 bg-white/80 text-black p-2 select-none"
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


