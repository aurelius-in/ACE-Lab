import { useEffect, useRef, useState } from 'react';
import { fpsFromSamples } from '../utils/perf';
import { useLabStore } from '../store/useLabStore';
// @ts-ignore - Vite raw imports for GLSL
import HALFTONE_SRC from '../shaders/blocks/halftone.frag?raw';
// @ts-ignore
import CROSS_SRC from '../shaders/blocks/crosszoom.frag?raw';
// @ts-ignore
import TEXT_SDF_SRC from '../shaders/blocks/text_sdf.frag?raw';
// @ts-ignore
import BLUR_SRC from '../shaders/blocks/blur.frag?raw';
// @ts-ignore
import POST_SRC from '../shaders/blocks/post.frag?raw';
// @ts-ignore
import VERT_SRC from '../shaders/fullscreen.vert?raw';
// @ts-ignore
import VHS_SRC from '../shaders/blocks/vhs.frag?raw';

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
		const c = canvas;

		const compile = (g: WebGL2RenderingContext, type: number, src: string) => { const sh = g.createShader(type)!; g.shaderSource(sh, src); g.compileShader(sh); if (!g.getShaderParameter(sh, g.COMPILE_STATUS)) { console.error(g.getShaderInfoLog(sh)); } return sh; };
		const program = (g: WebGL2RenderingContext, fsSrc: string) => { const vs = compile(g, g.VERTEX_SHADER, VERT_SRC as string); const fs = compile(g, g.FRAGMENT_SHADER, `#version 300 es\nprecision highp float;\n${fsSrc}`); const p = g.createProgram()!; g.attachShader(p, vs); g.attachShader(p, fs); g.linkProgram(p); return p; };

		const baseProg = program(gl, (effect.id === 'crosszoom' && !!media.secondary) ? CROSS_SRC : (effect.id === 'vhs' ? VHS_SRC : HALFTONE_SRC));
		const textProg = program(gl, TEXT_SDF_SRC);
		const blurProg = program(gl, BLUR_SRC);
		const postProg = program(gl, POST_SRC);

		const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
		const quad = new Float32Array([-1,-1, 3,-1, -1,3]);
		const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

		const makeTex = (g: WebGL2RenderingContext) => { const t = g.createTexture()!; g.bindTexture(g.TEXTURE_2D, t); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE); return t; };
		const tex0 = makeTex(gl); const tex1 = makeTex(gl); const textTex = makeTex(gl);
		const uploadImage = (g: WebGL2RenderingContext, url: string, to: WebGLTexture) => { const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>{ g.bindTexture(g.TEXTURE_2D,to); g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,i); }; i.src=url; };
		const uploadVideo = (g: WebGL2RenderingContext, url: string, to: WebGLTexture) => {
			const v = document.createElement('video');
			v.src = url; v.muted = true; (v as any).playsInline = true; v.loop = true; v.autoplay = true; v.crossOrigin = 'anonymous';
			v.addEventListener('loadeddata', ()=>{
				g.bindTexture(g.TEXTURE_2D, to);
				g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,v);
			});
			const update = () => { if (v.readyState >= 2) { g.bindTexture(g.TEXTURE_2D, to); g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,v); } requestAnimationFrame(update); };
			update();
		};
		if (media.primary) { if (media.primary.kind==='video') uploadVideo(gl, media.primary.src, tex0); else uploadImage(gl, media.primary.src, tex0); } else { uploadImage(gl, '/ace-lab.webp', tex0); }
		if (media.secondary) { if (media.secondary.kind==='video') uploadVideo(gl, media.secondary.src, tex1); else uploadImage(gl, media.secondary.src, tex1); }

		// Generate SDF atlas for the whole text string using tiny-sdf (with simple cache)
		const glyphCache = new Map<string, HTMLCanvasElement>();
		async function buildSdfTexture() {
			const { default: TinySDF } = await import('tiny-sdf');
			const fontFamily = (useLabStore.getState().text.font) || 'Poppins';
			const sdf = new (TinySDF as any)(48, 3, 8, 0.25, fontFamily);
			const str = text.value || '';
			const pad = 8; const w = 1024, h = 256; const canvas2 = document.createElement('canvas'); canvas2.width = w; canvas2.height = h; const ctx2 = canvas2.getContext('2d', { willReadFrequently: true } as any)!; ctx2.clearRect(0,0,w,h);
			let x = 32; const y = h/2 + 16;
			for (const ch of str) {
				const key = fontFamily + '|' + ch;
				let glyphCanvas = glyphCache.get(key);
				if (!glyphCanvas) {
					const glyph = sdf.draw(ch) as Uint8ClampedArray | Uint8Array | number[];
					if (!glyph || (glyph as any).length === 0) { continue; }
					const src = Array.isArray(glyph) ? glyph : Array.from(glyph as any);
					const size = sdf.size as number;
					const rgba = new Uint8ClampedArray(size * size * 4);
					for (let i = 0; i < size * size; i++) {
						const a = (src[i] as number) | 0;
						const idx = i * 4;
						rgba[idx] = 255; rgba[idx + 1] = 255; rgba[idx + 2] = 255; rgba[idx + 3] = a;
					}
					const img = new ImageData(rgba, size, size);
					glyphCanvas = document.createElement('canvas'); glyphCanvas.width = size; glyphCanvas.height = size; glyphCanvas.getContext('2d')!.putImageData(img, 0, 0);
					glyphCache.set(key, glyphCanvas);
				}
				ctx2.drawImage(glyphCanvas, x, y - (glyphCanvas.height/2));
				x += (glyphCanvas.width + pad);
			}
			const g = gl as WebGL2RenderingContext;
			g.bindTexture(g.TEXTURE_2D, textTex);
			g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, canvas2);
		}
		buildSdfTexture();

		// offscreen and ping-pong
		const rtTex = makeTex(gl), ping = makeTex(gl), pong = makeTex(gl);
		const fbo = gl.createFramebuffer()!, fbo2 = gl.createFramebuffer()!;
		const resizeRT = () => { [rtTex, ping, pong].forEach(t=>{ gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA, c.width, c.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null); }); };

		let raf = 0; const times: number[] = []; let last = performance.now(); let running = true;
		const resize = () => { const dpr = Math.min(window.devicePixelRatio||1,2); const w = c.clientWidth*dpr; const h = c.clientHeight*dpr; if (c.width!==w||c.height!==h) { c.width=w; c.height=h; gl.viewport(0,0,w,h); resizeRT(); } };
		const mixAt = (t: number) => { const keys = timeline.keyframes; if(keys.length===0) return 0; let prev = keys[0]; for (let i=1;i<keys.length;i++){ const cur = keys[i]; if (t<=cur.t){ const span = cur.t - prev.t || 1; const local = (t - prev.t)/span; return prev.mix*(1-local)+cur.mix*local; } prev = cur; } return keys[keys.length-1].mix; };

		// LUT upload (optional)
		let lutTex: WebGLTexture | undefined; const st = useLabStore.getState();
		if ((st.assets?.lutSrc)) { lutTex = makeTex(gl); upload(gl, st.assets!.lutSrc!, lutTex); }

		const loop = () => {
			if (!running) { raf = requestAnimationFrame(loop); return; }
			resize();
			const now = performance.now(); const dt = Math.min(0.1, (now - last) / 1000); last = now;
			if (play.playing) { const nt = (play.t + dt) % 1; setPlayhead(nt); }
			const wantCrossNow = effect.id === 'crosszoom' && !!media.secondary; const mix = wantCrossNow ? mixAt(play.t) : 1.0;

			// base to rtTex
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rtTex, 0);
			gl.useProgram(baseProg);
			gl.uniform2f(gl.getUniformLocation(baseProg, 'uRes'), c.width, c.height);
			gl.uniform1f(gl.getUniformLocation(baseProg, 'uTime'), now/1000);
			gl.uniform1f(gl.getUniformLocation(baseProg, 'uMix'), mix);
			gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex0); const loc0 = gl.getUniformLocation(baseProg,'uTex0'); if(loc0) gl.uniform1i(loc0,0);
			if (wantCrossNow){ gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex1); const loc1 = gl.getUniformLocation(baseProg,'uTex1'); if(loc1) gl.uniform1i(loc1,1); }
			const p = effect.params as any; let zoomStrength = p.zoomStrength ?? 0.8; let samples = Math.max(1, Math.min(32, Math.floor(p.samples ?? 16))); if (fps < 30 && wantCrossNow) { if (samples > 8) { samples = 8; if (!tip) { setTip('Performance: reduced samples to keep 30fps'); setTimeout(()=>setTip(null), 2000); } } } const locP = gl.getUniformLocation(baseProg,'uParams'); if(locP) gl.uniform4f(locP, p.dotScale ?? zoomStrength, p.angleRad ?? samples, p.contrast ?? 1, p.invert01 ?? 0);
			gl.drawArrays(gl.TRIANGLES, 0, 3);

			// blur ping
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo2); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ping, 0);
			gl.useProgram(blurProg); gl.uniform2f(gl.getUniformLocation(blurProg,'uRes'), c.width, c.height); gl.uniform2f(gl.getUniformLocation(blurProg,'uDir'), 1, 0); gl.uniform1f(gl.getUniformLocation(blurProg,'uRadius'), 2.0); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rtTex); const b0=gl.getUniformLocation(blurProg,'uTex0'); if(b0) gl.uniform1i(b0,0); gl.drawArrays(gl.TRIANGLES,0,3);
			// blur pong
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pong, 0);
			gl.uniform2f(gl.getUniformLocation(blurProg,'uDir'), 0, 1); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, ping); if(b0) gl.uniform1i(b0,0); gl.drawArrays(gl.TRIANGLES,0,3);

			// text on pong with SDF
			if (text.enabled && text.value) { gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.useProgram(textProg); gl.uniform2f(gl.getUniformLocation(textProg, 'uRes'), c.width, c.height); gl.uniform1f(gl.getUniformLocation(textProg, 'uTime'), now/1000); const tp = text.params; gl.uniform4f(gl.getUniformLocation(textProg,'uParams'), tp.amp, tp.freq, tp.speed, tp.outlinePx); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, textTex); const lt = gl.getUniformLocation(textProg,'uTextTex'); if (lt) gl.uniform1i(lt,2); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.disable(gl.BLEND); }

			// post to screen (combine pong into rtTex with bloomStrength and LUT)
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.useProgram(postProg);
			gl.uniform2f(gl.getUniformLocation(postProg, 'uRes'), c.width, c.height);
			gl.uniform1f(gl.getUniformLocation(postProg, 'uTime'), now/1000);
			gl.uniform1f(gl.getUniformLocation(postProg, 'uMix'), 1.0);
			// uTex0 = blurred (pong), uTex1 = base (rtTex)
			gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, pong); const p0 = gl.getUniformLocation(postProg,'uTex0'); if(p0) gl.uniform1i(p0,0);
			gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, rtTex); const p1u = gl.getUniformLocation(postProg,'uTex1'); if(p1u) gl.uniform1i(p1u,1);
			const bloomStrength = (effect.params as any).bloomStrength ?? 0.25; const lutAmount = (effect.params as any).lutAmount ?? 0.2; const bloomThreshold = (effect.params as any).bloomThreshold ?? 0.7; const grainAmount = (effect.params as any).grainAmount ?? 0.05; const vignette01 = (effect.params as any).vignette01 ?? 1.0;
			gl.uniform4f(gl.getUniformLocation(postProg,'uParams'), bloomStrength, bloomThreshold, lutAmount, grainAmount);
			const vloc = gl.getUniformLocation(postProg,'uVignette'); if (vloc) gl.uniform1f(vloc, vignette01);
			// bind LUT if present
			if (lutTex) { gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, lutTex); const l0 = gl.getUniformLocation(postProg,'uLUT'); if (l0) gl.uniform1i(l0,3); }
			gl.drawArrays(gl.TRIANGLES, 0, 3);

			times.push(now); if(times.length>120) times.shift(); const f = Math.round(fpsFromSamples(times)); setFpsLocal(f); publishFps(f);
			raf = requestAnimationFrame(loop);
		};
		rAF(); function rAF(){ raf = requestAnimationFrame(loop); }

		function vis(){ running = document.visibilityState === 'visible'; }
		document.addEventListener('visibilitychange', vis);
		return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); };
	}, [media.primary?.src, media.secondary?.src, effect.id, effect.params, publishFps, timeline.keyframes, fps, text.enabled, text.value, text.params, play.playing, play.t, setPlayhead]);

	return (
		<div className="relative w-full h-full">
			<canvas ref={canvasRef} className="w-full h-full rounded-2xl" aria-label="editor preview" />
			<div className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-black/60 border border-white/10">{fps} fps</div>
		</div>
	)
}


