import { useState } from 'react';
import * as ST from '../../packages/style-transfer/src';
import { useLabStore } from '../store/useLabStore';

export default function StyleTransferPanel(){
    const [style, setStyle] = useState<ST.StyleId>('mosaic');
    const [strength, setStrength] = useState(0.5);
    const [working, setWorking] = useState(false);
    const setPrimary = useLabStore(s=>s.setPrimary);

    async function apply(){
        const canvas = document.querySelector('canvas') as HTMLCanvasElement | null; if (!canvas) return;
        setWorking(true);
        try {
            const out = await ST.apply(canvas, style, strength);
            setPrimary(out.toDataURL('image/png'));
        } finally { setWorking(false); }
    }

    return (
        <div className="space-y-3">
            <div className="flex gap-2 items-center">
                <select className="input" aria-label="Style" title="Style" value={style} onChange={e=>setStyle(e.target.value as ST.StyleId)}>
                    <option value="mosaic">Mosaic</option>
                    <option value="udnie">Udnie</option>
                    <option value="candy">Candy</option>
                    <option value="scream">Scream</option>
                    <option value="rain_princess">Rain Princess</option>
                </select>
                <input type="range" aria-label="Strength" title="Strength" min={0} max={1} step={0.05} value={strength} onChange={e=>setStrength(parseFloat(e.target.value))} />
                <button className="btn-compact" aria-label="Apply" title="Apply" onClick={apply} disabled={working}>{working ? 'Applying…' : 'Apply'}</button>
            </div>
            <div className="text-xs text-black/60">Applies non-destructive style; you can still tweak shader effects afterward.</div>
        </div>
    );
}


