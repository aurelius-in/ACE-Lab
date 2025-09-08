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
import POST_SRC from '../shaders/blocks/post.frag?raw';
// @ts-ignore
import VERT_SRC from '../shaders/fullscreen.vert?raw';

export default function CanvasHost() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const publishFps = useLabStore(s => s.setFps);
  const media = useLabStore(s => s.media);
  const effect = useLabStore(s => s.effect);
  const timeline = useLabStore(s => s.timeline);
  const play = useLabStore(s => s.play);
  const setPlayhead = useLabStore(s => s.setPlayhead);
  const text = useLabStore(s => s.text);
  const [fps, setFpsLocal] = useState(60);
  const [tip, setTip] = useState<string | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current; if (!canvas) return;
		const gl = canvas.getContext('webgl2'); if (!gl) return;

		function compile(type: number, src: string) {
			const sh = gl.createShader(type); if (!sh) return null;
			gl.shaderSource(sh, src); gl.compileShader(sh);
			if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(sh)); }
			return sh;
		}
		const vs = compile(gl.VERTEX_SHADER, VERT_SRC as string); if (!vs) return;
		const wantCross = effect.id === 'crosszoom' && !!media.secondary;
		const fragSrc = wantCross ? CROSS_SRC : HALFTONE_SRC;
		const fs = compile(gl.FRAGMENT_SHADER, `#version 300 es\nprecision highp float;\n${fragSrc}`); if (!fs) return;
		const baseProg = gl.createProgram(); if (!baseProg) return; gl.attachShader(baseProg, vs); gl.attachShader(baseProg, fs); gl.linkProgram(baseProg);

		const fsText = compile(gl.FRAGMENT_SHADER, `#version 300 es\nprecision highp float;\n${TEXTWAVE_SRC}`); if (!fsText) return;
		const textProg = gl.createProgram(); if (!textProg) return; gl.attachShader(textProg, vs); gl.attachShader(textProg, fsText); gl.linkProgram(textProg);

		const fsPost = compile(gl.FRAGMENT_SHADER, `#version 300 es\nprecision highp float;\n${POST_SRC}`); if (!fsPost) return;
		const postProg = gl.createProgram(); if (!postProg) return; gl.attachShader(postProg, vs); gl.attachShader(postProg, fsPost); gl.linkProgram(postProg);

		const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
		const quad = new Float32Array([-1,-1, 3,-1, -1,3]);
		const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

		function makeTex() { const t = gl.createTexture(); if (!t) return null; gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; }
		const tex0 = makeTex(); if (!tex0) return; const tex1 = makeTex(); const textTex = makeTex(); if (!textTex) return;
		function upload(url: string, to: WebGLTexture|null){ if (!to) return; const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>{ gl.bindTexture(gl.TEXTURE_2D,to); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,i); }; i.src=url; }
		upload(media.primary?.src || '/ace-lab.webp', tex0);
		if (media.secondary) upload(media.secondary.src, tex1);

		// offscreen framebuffer for post
		const rtTex = makeTex(); if (!rtTex) return;
		const fbo = gl.createFramebuffer(); if (!fbo) return;
		function resizeRT(){ gl.bindTexture(gl.TEXTURE_2D, rtTex); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA, canvas.width, canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rtTex, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }

		const textCanvas = document.createElement('canvas'); textCanvas.width = 1024; textCanvas.height = 256; const textCtx = textCanvas.getContext('2d'); if (!textCtx) return;
		function redrawText(t: { value: string }){ textCtx.clearRect(0,0,textCanvas.width,textCanvas.height); textCtx.fillStyle = 'white'; textCtx.font = '700 120px Poppins'; textCtx.textBaseline = 'middle'; textCtx.fillText(t.value || '', 32, textCanvas.height/2); if (textTex) { gl.bindTexture(gl.TEXTURE_2D, textTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas); } } if (text.enabled) redrawText(text);

		let raf = 0; const times: number[] = []; let last = performance.now(); let running = true;
		function resize() { const dpr = Math.min(window.devicePixelRatio||1,2); const w = canvas.clientWidth*dpr; const h = canvas.clientHeight*dpr; if (canvas.width!==w||canvas.height!==h) { canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h); resizeRT(); } }
		function mixAt(t: number){ const keys = timeline.keyframes; if(keys.length===0) return 0; let prev = keys[0]; for (let i=1;i<keys.length;i++){ const cur = keys[i]; if (t<=cur.t){ const span = cur.t - prev.t || 1; const local = (t - prev.t)/span; return prev.mix*(1-local)+cur.mix*local; } prev = cur; } return keys[keys.length-1].mix; }
		const loop = () => {
			if (!running) { raf = requestAnimationFrame(loop); return; }
			resize();
			const now = performance.now(); const dt = Math.min(0.1, (now - last) / 1000); last = now;
			if (play.playing) { const nt = (play.t + dt) % 1; setPlayhead(nt); }
			const wantCross = effect.id === 'crosszoom' && !!media.secondary;
			const mix = wantCross ? mixAt(play.t) : 1.0;

			// base pass to rt
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
			gl.useProgram(baseProg);
			gl.uniform2f(gl.getUniformLocation(baseProg, 'uRes'), canvas.width, canvas.height);
			gl.uniform1f(gl.getUniformLocation(baseProg, 'uTime'), now/1000);
			gl.uniform1f(gl.getUniformLocation(baseProg, 'uMix'), mix);
			gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex0); const loc0 = gl.getUniformLocation(baseProg,'uTex0'); if(loc0) gl.uniform1i(loc0,0);
			if (wantCross && tex1){ gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex1); const loc1 = gl.getUniformLocation(baseProg,'uTex1'); if(loc1) gl.uniform1i(loc1,1); }
			const p = effect.params as any; let zoomStrength = p.zoomStrength ?? 0.8; let samples = Math.max(1, Math.min(32, Math.floor(p.samples ?? 16))); if (fps < 30 && wantCross) { if (samples > 8) { samples = 8; if (!tip) { setTip('Performance: reduced samples to keep 30fps'); setTimeout(()=>setTip(null), 2000); } } } const locP = gl.getUniformLocation(baseProg,'uParams'); if(locP) gl.uniform4f(locP, p.dotScale ?? zoomStrength, p.angleRad ?? samples, p.contrast ?? 1, p.invert01 ?? 0);
			gl.drawArrays(gl.TRIANGLES, 0, 3);

			// text on rt
			if (text.enabled && text.value) { redrawText(text); gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.useProgram(textProg); gl.uniform2f(gl.getUniformLocation(textProg, 'uRes'), canvas.width, canvas.height); gl.uniform1f(gl.getUniformLocation(textProg, 'uTime'), now/1000); const tp = text.params; gl.uniform4f(gl.getUniformLocation(textProg,'uParams'), tp.amp, tp.freq, tp.speed, tp.outlinePx); if (textTex){ gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, textTex); const lt = gl.getUniformLocation(textProg,'uTextTex'); if (lt) gl.uniform1i(lt,2); } gl.uniform1f(gl.getUniformLocation(textProg,'uMix'), 1.0); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.disable(gl.BLEND); }

			// post to screen
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.useProgram(postProg);
			gl.uniform2f(gl.getUniformLocation(postProg, 'uRes'), canvas.width, canvas.height);
			gl.uniform1f(gl.getUniformLocation(postProg, 'uTime'), now/1000);
			gl.uniform1f(gl.getUniformLocation(postProg, 'uMix'), 1.0);
			gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rtTex); const p0 = gl.getUniformLocation(postProg,'uTex0'); if(p0) gl.uniform1i(p0,0);
			gl.uniform4f(gl.getUniformLocation(postProg,'uParams'), 0.25, 2.0, 0.2, 0.0);
			gl.drawArrays(gl.TRIANGLES, 0, 3);

			times.push(now); if(times.length>120) times.shift(); const f = Math.round(fpsFromSamples(times)); setFpsLocal(f); publishFps(f);
			raf = requestAnimationFrame(loop);
		};
		rAF(); function rAF(){ raf = requestAnimationFrame(loop); }

		function vis(){ running = document.visibilityState === 'visible'; }
		document.addEventListener('visibilitychange', vis);
		return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); };
	}, [media.primary?.src, media.secondary?.src, effect.id, effect.params, publishFps, timeline.keyframes, fps, tip, text.enabled, text.value, text.params, play.playing, play.t, setPlayhead]);

	return (
		<div className="relative w-full h-full">
			<canvas ref={canvasRef} className="w-full h-full rounded-2xl" aria-label="editor preview" />
			<div className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-black/60 border border-white/10">{fps} fps</div>
			{tip && (<div className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-black/60 border border-white/10">{tip}</div>)}
		</div>
	)
}


