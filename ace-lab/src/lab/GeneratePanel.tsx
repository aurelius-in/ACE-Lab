import { useEffect, useRef, useState } from 'react';
import { useWebGpuGen } from './hooks/useWebGpuGen';
import { useLabStore } from '../store/useLabStore';

export default function GeneratePanel(){
    const { ready, device, running, error, init, generate, cancel, lastMs } = useWebGpuGen();
    const [modelUrl, setModelUrl] = useState(
        localStorage.getItem('ace-demo-model-url') ||
        'https://github.com/onnx/models/raw/main/vision/classification/squeezenet/model/squeezenet1.0-12.onnx'
    );
    const [pref, setPref] = useState<'auto'|'webgpu'|'wasm'>('auto');
    const [prompt, setPrompt] = useState('neon cityscape, dusk');
    const [seed, setSeed] = useState<number | undefined>(undefined);
    const [steps, setSteps] = useState(6);
    const [cfg, setCfg] = useState(1.5);
    const [thumb, setThumb] = useState<HTMLCanvasElement | null>(null);
    const setPrimary = useLabStore(s=>s.setPrimary);
    const [catalog, setCatalog] = useState<{ name: string; url: string }[]>([]);
    const addClip = useLabStore(s=>s.addClip!);

    useEffect(()=>{
        const prefArg = pref === 'auto' ? undefined : pref;
        init(modelUrl, prefArg as any).catch(()=>{});
    }, [init, modelUrl, pref]);
    useEffect(()=>{
        fetch('/models/models.json').then(r=> r.ok ? r.json() : []).then((arr)=>{
            if (Array.isArray(arr)) setCatalog(arr as any);
        }).catch(()=>{});
    }, []);

    useEffect(()=>{ try { localStorage.setItem('ace-demo-model-url', modelUrl); } catch {} }, [modelUrl]);
    useEffect(()=>{ try { localStorage.setItem('ace-demo-model-pref', pref); } catch {} }, [pref]);

    async function onGenerate(){
        try {
            const canvas = await generate({ prompt, seed, steps, cfg, width: 512, height: 512 });
            setThumb(canvas);
        } catch {
            // error state already set in hook
        }
    }
    function onSendToCanvas(){ if (thumb) { const url = thumb.toDataURL('image/png'); setPrimary(url); } }
    function onSendToTimeline(){ if (thumb) { const url = thumb.toDataURL('image/png'); addClip({ id: String(Date.now()), kind: 'image', src: url, durationSec: 3, name: 'Generated' }); window.dispatchEvent(new Event('ace:scroll-timeline')); } }

    return (
        <div className="space-y-3">
            <div className="text-sm text-black/70">Device: {device} {lastMs!=null && <span className="text-black/50">· {lastMs} ms</span>}</div>
            <div className="flex gap-2 items-center">
                <input className="input w-1/2" aria-label="Model URL" title="Model URL (.onnx)" value={modelUrl} onChange={e=>setModelUrl(e.target.value)} placeholder="Model URL (.onnx)" />
                <select className="input" aria-label="Device preference" title="Execution device" value={pref} onChange={e=>setPref(e.target.value as any)}>
                    <option value="auto">Auto</option>
                    <option value="webgpu">WebGPU</option>
                    <option value="wasm">WASM</option>
                </select>
                <button className="btn-compact" aria-label="Use demo model" title="Use demo model" onClick={()=>{
                    setModelUrl('https://github.com/onnx/models/raw/main/vision/classification/squeezenet/model/squeezenet1.0-12.onnx');
                    setPref('auto');
                }}>Use demo model</button>
                {catalog.length>0 && (
                    <select className="input" aria-label="Local models" title="Local models" onChange={e=>{ const found = catalog.find(c=>c.url===e.target.value); if (found) setModelUrl(found.url); }}>
                        <option value="">Local models…</option>
                        {catalog.map((m)=> <option key={m.url} value={m.url}>{m.name}</option>)}
                    </select>
                )}
            </div>
            <div className="flex gap-2 items-center">
                <input className="flex-1 input" aria-label="Prompt" title="Prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Prompt" onKeyDown={(e)=>{ if (e.key==='Enter' && !running) { onGenerate(); } }} />
                <button className="btn-compact" aria-label="Generate" title="Generate" disabled={running} onClick={onGenerate}>{running ? 'Generating…' : 'Generate'}</button>
                {running && <button className="btn-compact" aria-label="Cancel" title="Cancel" onClick={cancel}>Cancel</button>}
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {thumb && <div className="rounded border border-black/10 p-2 bg-white"><img src={thumb.toDataURL('image/png')} alt="thumb" className="max-w-full h-auto" /></div>}
            <div className="flex gap-2">
                <button className="btn-primary" aria-label="Send to Canvas" title="Send to Canvas" disabled={!thumb} onClick={onSendToCanvas}>Send to Canvas</button>
                <button className="btn-compact" aria-label="Send to Timeline" title="Send to Timeline" disabled={!thumb} onClick={onSendToTimeline}>Send to Timeline</button>
            </div>
        </div>
    );
}


