import { useEffect, useRef, useState } from 'react';
import { fpsFromSamples } from '../utils/perf';
import { useLabStore } from '../store/useLabStore';
// @ts-ignore - Vite raw imports for GLSL
import HALFTONE_SRC from '../shaders/blocks/halftone.frag?raw';
// @ts-ignore
import CROSS_SRC from '../shaders/blocks/crosszoom.frag?raw';
// @ts-ignore
import TEXTWAVE_SRC from '../shaders/blocks/textwave.frag?raw';
// @ts-ignore
import VERT_SRC from '../shaders/fullscreen.vert?raw';

export default function CanvasHost() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const publishFps = useLabStore(s => s.setFps);
  const media = useLabStore(s => s.media);
  const effect = useLabStore(s => s.effect);
  const timeline = useLabStore(s => s.timeline);
  const text = useLabStore(s => s.text);
  const [fps, setFpsLocal] = useState(60);
  const [tip, setTip] = useState<string | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current; if (!canvas) return;
		const gl = canvas.getContext('webgl2'); if (!gl) return;

		function compile(type: number, src: string) { const sh = gl.createShader(type)!; gl.shaderSource(sh, src); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(sh)); } return sh; }
		const vs = compile(gl.VERTEX_SHADER, VERT_SRC as string);
		const fragSrc = media.secondary ? CROSS_SRC : HALFTONE_SRC;
		const fs = compile(gl.FRAGMENT_SHADER, `#version 300 es\nprecision highp float;\n${fragSrc}`);
		const baseProg = gl.createProgram()!; gl.attachShader(baseProg, vs); gl.attachShader(baseProg, fs); gl.linkProgram(baseProg);

		// textwave program
		const fsText = compile(gl.FRAGMENT_SHADER, `#version 300 es\nprecision highp float;\n${TEXTWAVE_SRC}`);
		const textProg = gl.createProgram()!; gl.attachShader(textProg, vs); gl.attachShader(textProg, fsText); gl.linkProgram(textProg);

		const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
		const quad = new Float32Array([-1,-1, 3,-1, -1,3]);
		const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

		function makeTex() { const t = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; }
		const tex0 = makeTex(); const tex1 = makeTex(); const textTex = makeTex();
		function upload(url: string, to: WebGLTexture){ const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>{ gl.bindTexture(gl.TEXTURE_2D,to); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,i); }; i.src=url; }
		upload(media.primary?.src || '/ace-lab.webp', tex0);
		if (media.secondary) upload(media.secondary.src, tex1);

		// offscreen canvas for text
		const textCanvas = document.createElement('canvas');
		textCanvas.width = 1024; textCanvas.height = 256;
		const textCtx = textCanvas.getContext('2d')!;
		function redrawText(t: { value: string }){
			textCtx.clearRect(0,0,textCanvas.width,textCanvas.height);
			textCtx.fillStyle = 'white';
			textCtx.font = '700 120px Poppins';
			textCtx.textBaseline = 'middle';
			textCtx.fillText(t.value || '', 32, textCanvas.height/2);
			gl.bindTexture(gl.TEXTURE_2D, textTex);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
		}
		if (text.enabled) redrawText(text);

		let raf = 0; const times: number[] = []; const t0 = performance.now(); let running = true;
		function resize() { const dpr = Math.min(window.devicePixelRatio||1,2); const w = canvas.clientWidth*dpr; const h = canvas.clientHeight*dpr; if (canvas.width!==w||canvas.height!==h) { canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h);} }
		function mixFromTimeline(elapsed: number){ const keys = timeline.keyframes; if(keys.length===0) return 0; const T = (elapsed % 1 + 1) % 1; let prev = keys[0]; for (let i=1;i<keys.length;i++){ const cur = keys[i]; if (T<=cur.t){ const span = cur.t - prev.t || 1; const local = (T - prev.t)/span; return prev.mix*(1-local)+cur.mix*local; } prev = cur; } return keys[keys.length-1].mix; }
		const loop = () => {
			if (!running) { raf = requestAnimationFrame(loop); return; }
			resize();
			// Base pass
			gl.useProgram(baseProg);
			gl.uniform2f(gl.getUniformLocation(baseProg, 'uRes'), canvas.width, canvas.height);
			gl.uniform1f(gl.getUniformLocation(baseProg, 'uTime'), performance.now()/1000);
			const elapsed = (performance.now()-t0)/1000; gl.uniform1f(gl.getUniformLocation(baseProg, 'uMix'), media.secondary ? mixFromTimeline(elapsed) : 1.0);
			gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex0); const loc0 = gl.getUniformLocation(baseProg,'uTex0'); if(loc0) gl.uniform1i(loc0,0);
			if (media.secondary){ gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex1); const loc1 = gl.getUniformLocation(baseProg,'uTex1'); if(loc1) gl.uniform1i(loc1,1); }
			const p = effect.params as any;
			let zoomStrength = p.zoomStrength ?? 0.8;
			let samples = Math.max(1, Math.min(32, Math.floor(p.samples ?? 16)));
			if (fps < 30 && media.secondary) { if (samples > 8) { samples = 8; if (!tip) { setTip('Performance: reduced samples to keep 30fps'); setTimeout(()=>setTip(null), 2000); } } }
			const locP = gl.getUniformLocation(baseProg,'uParams'); if(locP) gl.uniform4f(locP, p.dotScale ?? zoomStrength, p.angleRad ?? samples, p.contrast ?? 1, p.invert01 ?? 0);
			gl.drawArrays(gl.TRIANGLES, 0, 3);

			// Text pass
			if (text.enabled && text.value) {
				redrawText(text);
				gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
				gl.useProgram(textProg);
				gl.uniform2f(gl.getUniformLocation(textProg, 'uRes'), canvas.width, canvas.height);
				gl.uniform1f(gl.getUniformLocation(textProg, 'uTime'), performance.now()/1000);
				const tp = text.params;
				gl.uniform4f(gl.getUniformLocation(textProg,'uParams'), tp.amp, tp.freq, tp.speed, tp.outlinePx);
				gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, textTex);
				const lt = gl.getUniformLocation(textProg,'uTextTex'); if (lt) gl.uniform1i(lt,2);
				gl.uniform1f(gl.getUniformLocation(textProg,'uMix'), 1.0);
				gl.drawArrays(gl.TRIANGLES, 0, 3);
				gl.disable(gl.BLEND);
			}

			times.push(performance.now()); if(times.length>120) times.shift(); const f = Math.round(fpsFromSamples(times)); setFpsLocal(f); publishFps(f);
			raf = requestAnimationFrame(loop);
		};
		rAF(); function rAF(){ raf = requestAnimationFrame(loop); }

		function vis(){ running = document.visibilityState === 'visible'; }
		document.addEventListener('visibilitychange', vis);
		return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); };
	}, [media.primary?.src, media.secondary?.src, effect.params, publishFps, timeline.keyframes, fps, tip, text.enabled, text.value, text.params]);

	return (
		<div className="relative w-full h-full">
			<canvas ref={canvasRef} className="w-full h-full rounded-2xl" aria-label="editor preview" />
			<div className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-black/60 border border-white/10">{fps} fps</div>
			{tip && (<div className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-black/60 border border-white/10">{tip}</div>)}
		</div>
	)
}


