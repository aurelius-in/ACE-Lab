import { useEffect, useRef, useState } from 'react';
import { useWebGpuGen } from './hooks/useWebGpuGen';
import { useLabStore } from '../store/useLabStore';

export default function GeneratePanel(){
    const { ready, device, running, error, init, generate, cancel, lastMs } = useWebGpuGen();
    const [modelUrl, setModelUrl] = useState('https://example.com/models/sdxl-turbo.onnx');
    const [pref, setPref] = useState<'auto'|'webgpu'|'wasm'>('auto');
    const [prompt, setPrompt] = useState('neon cityscape, dusk');
    const [seed, setSeed] = useState<number | undefined>(undefined);
    const [steps, setSteps] = useState(6);
    const [cfg, setCfg] = useState(1.5);
    const [thumb, setThumb] = useState<HTMLCanvasElement | null>(null);
    const setPrimary = useLabStore(s=>s.setPrimary);

    useEffect(()=>{
        const prefArg = pref === 'auto' ? undefined : pref;
        init(modelUrl, prefArg as any).catch(()=>{});
    }, [init, modelUrl, pref]);

    async function onGenerate(){
        try {
            const canvas = await generate({ prompt, seed, steps, cfg, width: 512, height: 512 });
            setThumb(canvas);
        } catch {
            // error state already set in hook
        }
    }
    function onSendToCanvas(){ if (thumb) { const url = thumb.toDataURL('image/png'); setPrimary(url); } }

    return (
        <div className="space-y-3">
            <div className="text-sm text-black/70">Device: {device} {lastMs!=null && <span className="text-black/50">· {lastMs} ms</span>}</div>
            <div className="flex gap-2 items-center">
                <input className="input w-1/2" value={modelUrl} onChange={e=>setModelUrl(e.target.value)} placeholder="Model URL (.onnx)" />
                <select className="input" value={pref} onChange={e=>setPref(e.target.value as any)}>
                    <option value="auto">Auto</option>
                    <option value="webgpu">WebGPU</option>
                    <option value="wasm">WASM</option>
                </select>
            </div>
            <div className="flex gap-2 items-center">
                <input className="flex-1 input" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Prompt" onKeyDown={(e)=>{ if (e.key==='Enter' && !running) { onGenerate(); } }} />
                <button className="btn-compact" disabled={running} onClick={onGenerate}>{running ? 'Generating…' : 'Generate'}</button>
                {running && <button className="btn-compact" onClick={cancel}>Cancel</button>}
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {thumb && <div className="rounded border border-black/10 p-2 bg-white"><img src={thumb.toDataURL('image/png')} alt="thumb" className="max-w-full h-auto" /></div>}
            <div className="flex gap-2">
                <button className="btn-primary" disabled={!thumb} onClick={onSendToCanvas}>Send to Canvas</button>
            </div>
        </div>
    );
}


