import { useCallback, useMemo, useRef, useState } from 'react';

type InitFn = (opts: { modelUrl: string; devicePreference?: 'webgpu'|'wasm' }) => Promise<{ device: 'webgpu'|'wasm' }>;
type GenerateFn = (opts: { prompt: string; negativePrompt?: string; seed?: number; steps?: number; cfg?: number; width?: number; height?: number }) => Promise<HTMLCanvasElement>;
type CancelFn = () => void;

export function useWebGpuGen(){
    const modRef = useRef<{ init: InitFn; generate: GenerateFn; cancel: CancelFn } | null>(null);
    const [ready, setReady] = useState(false);
    const [device, setDevice] = useState<'webgpu'|'wasm'|'unknown'>('unknown');
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const init = useCallback(async (modelUrl: string, devicePreference?: 'webgpu'|'wasm') => {
        setError(null);
        const m = await import('../../../packages/webgpu-gen/src/index');
        modRef.current = { init: m.init as any, generate: m.generate as any, cancel: m.cancel as any };
        const res = await (modRef.current!.init({ modelUrl, devicePreference }));
        setReady(true); setDevice(res.device);
        return res.device;
    }, []);

    const generate = useCallback(async (opts: Parameters<GenerateFn>[0]) => {
        if (!modRef.current) throw new Error('Generator not initialized');
        setRunning(true); setError(null);
        try {
            const canvas = await modRef.current.generate(opts);
            return canvas;
        } catch (e: any) {
            setError(e?.message || 'Generation failed'); throw e;
        } finally { setRunning(false); }
    }, []);

    const cancel = useCallback(() => { modRef.current?.cancel(); }, []);

    return useMemo(() => ({ ready, device, running, error, init, generate, cancel }), [ready, device, running, error, init, generate, cancel]);
}


