import { useEffect, useRef, useState } from 'react';
import { fpsFromSamples } from '../utils/perf';
import { useLabStore } from '../store/useLabStore';
// @ts-ignore - Vite raw imports for GLSL
import HALFTONE_SRC from '../shaders/blocks/halftone.frag?raw';
// @ts-ignore
import CROSS_SRC from '../shaders/blocks/crosszoom.frag?raw';
// @ts-ignore
import VERT_SRC from '../shaders/fullscreen.vert?raw';

export default function CanvasHost() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const publishFps = useLabStore(s => s.setFps);
  const media = useLabStore(s => s.media);
  const effect = useLabStore(s => s.effect);
  const timeline = useLabStore(s => s.timeline);
  const [fps, setFpsLocal] = useState(60);

	useEffect(() => {
		const canvas = canvasRef.current; if (!canvas) return;
		const gl = canvas.getContext('webgl2'); if (!gl) return;

		function compile(type: number, src: string) { const sh = gl.createShader(type)!; gl.shaderSource(sh, src); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(sh)); } return sh; }
		const vs = compile(gl.VERTEX_SHADER, VERT_SRC as string);
		const fragSrc = media.secondary ? CROSS_SRC : HALFTONE_SRC;
		const fs = compile(gl.FRAGMENT_SHADER, `#version 300 es\nprecision highp float;\n${fragSrc}`);
		const prog = gl.createProgram()!; gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);

		const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
		const quad = new Float32Array([-1,-1, 3,-1, -1,3]);
		const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

		function makeTex() { const t = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; }
		const tex0 = makeTex(); const tex1 = makeTex();
		function upload(url: string, to: WebGLTexture){ const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>{ gl.bindTexture(gl.TEXTURE_2D,to); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,i); }; i.src=url; }
		upload(media.primary?.src || '/ace-lab.webp', tex0);
		if (media.secondary) upload(media.secondary.src, tex1);

		let raf = 0; const times: number[] = []; const t0 = performance.now();
		function resize() { const dpr = Math.min(window.devicePixelRatio||1,2); const w = canvas.clientWidth*dpr; const h = canvas.clientHeight*dpr; if (canvas.width!==w||canvas.height!==h) { canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h);} }
		function mixFromTimeline(elapsed: number){ const keys = timeline.keyframes; if(keys.length===0) return 0; const T = elapsed % 1; // normalize 0..1
			let prev = keys[0]; for (let i=1;i<keys.length;i++){ const cur = keys[i]; if (T<=cur.t){ const span = cur.t - prev.t || 1; const local = (T - prev.t)/span; return prev.mix*(1-local)+cur.mix*local; } prev = cur; } return keys[keys.length-1].mix; }
		const loop = () => {
			resize(); gl.useProgram(prog);
			gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), canvas.width, canvas.height);
			gl.uniform1f(gl.getUniformLocation(prog, 'uTime'), performance.now()/1000);
			const elapsed = (performance.now()-t0)/1000; gl.uniform1f(gl.getUniformLocation(prog, 'uMix'), media.secondary ? mixFromTimeline(elapsed) : 1.0);
			gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex0); const loc0 = gl.getUniformLocation(prog,'uTex0'); if(loc0) gl.uniform1i(loc0,0);
			if (media.secondary){ gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex1); const loc1 = gl.getUniformLocation(prog,'uTex1'); if(loc1) gl.uniform1i(loc1,1); }
			const p = effect.params as any; const locP = gl.getUniformLocation(prog,'uParams'); if(locP) gl.uniform4f(locP, p.dotScale||8, p.angleRad||0.6, p.contrast||1, p.invert01||0);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			times.push(performance.now()); if(times.length>120) times.shift(); const f = Math.round(fpsFromSamples(times)); setFpsLocal(f); publishFps(f);
			raf = requestAnimationFrame(loop);
		};
		rAF(); function rAF(){ raf = requestAnimationFrame(loop); }
		return () => cancelAnimationFrame(raf);
	}, [media.primary?.src, media.secondary?.src, effect.params, publishFps, timeline.keyframes]);

	return (
		<div className="relative w-full h-full">
			<canvas ref={canvasRef} className="w-full h-full rounded-2xl" aria-label="editor preview" />
			<div className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-black/60 border border-white/10">{fps} fps</div>
		</div>
	)
}


