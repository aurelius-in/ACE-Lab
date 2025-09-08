import { useEffect, useRef, useState } from 'react';
import { fpsFromSamples } from '../utils/perf';
import { useLabStore } from '../store/useLabStore';
// @ts-ignore - Vite raw imports for GLSL
import HALFTONE_SRC from '../shaders/blocks/halftone.frag?raw';
// @ts-ignore
import VERT_SRC from '../shaders/fullscreen.vert?raw';

export default function CanvasHost() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const publishFps = useLabStore(s => s.setFps);
  const media = useLabStore(s => s.media);
  const effect = useLabStore(s => s.effect);
  const [fps, setFpsLocal] = useState(60);

	useEffect(() => {
		const canvas = canvasRef.current; if (!canvas) return;
		const gl = canvas.getContext('webgl2'); if (!gl) return;

		// setup program
		function compile(type: number, src: string) {
			const sh = gl.createShader(type)!; gl.shaderSource(sh, src); gl.compileShader(sh);
			if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(sh)); }
			return sh;
		}
		const vs = compile(gl.VERTEX_SHADER, VERT_SRC as string);
		const fs = compile(gl.FRAGMENT_SHADER, `#version 300 es\nprecision highp float;\n${HALFTONE_SRC}`);
		const prog = gl.createProgram()!; gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);

		const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
		const quad = new Float32Array([-1,-1, 3,-1, -1,3]);
		const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

		// texture
		const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		};
		img.src = media.primary?.src || '/ace-lab.webp';

		let raf = 0; const times: number[] = [];
		function resize() { const dpr = Math.min(window.devicePixelRatio||1,2); const w = canvas.clientWidth*dpr; const h = canvas.clientHeight*dpr; if (canvas.width!==w||canvas.height!==h) { canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h);} }
		const loop = () => {
			resize();
			gl.useProgram(prog);
			const locTex = gl.getUniformLocation(prog, 'uTex0'); gl.uniform1i(locTex, 0); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), canvas.width, canvas.height);
			gl.uniform1f(gl.getUniformLocation(prog, 'uTime'), performance.now()/1000);
			gl.uniform1f(gl.getUniformLocation(prog, 'uMix'), 1.0);
			const p = effect.params as any; gl.uniform4f(gl.getUniformLocation(prog, 'uParams'), p.dotScale||8, p.angleRad||0.6, p.contrast||1, p.invert01||0);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			times.push(performance.now()); if(times.length>120) times.shift(); const f = Math.round(fpsFromSamples(times)); setFpsLocal(f); publishFps(f);
			rAF();
		};
		function rAF(){ raf = requestAnimationFrame(loop); }
		rAF();
		return () => cancelAnimationFrame(raf);
	}, [media.primary?.src, effect.params, publishFps]);

	return (
		<div className="relative w-full h-full">
			<canvas ref={canvasRef} className="w-full h-full rounded-2xl" aria-label="editor preview" />
			<div className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-black/60 border border-white/10">{fps} fps</div>
		</div>
	)
}


