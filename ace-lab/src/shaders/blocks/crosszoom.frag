precision highp float;
uniform sampler2D uTex0, uTex1; uniform vec2 uRes; uniform float uTime; uniform float uMix; uniform vec4 uParams;
// uParams: zoomStrength, samples, x, y (unused)
out vec4 fragColor; in vec2 vUv;

vec4 sampleZoom(sampler2D tex, vec2 uv, float s, int k){
	vec4 acc=vec4(0.0); float w=0.0; for(int i=0;i<32;i++){ if(i>=k) break; float t=float(i)/max(1.0,float(k-1)); vec2 o=(uv-0.5)*t*s; acc+=texture(tex, uv-o); w+=1.0; } return acc/max(1.0,w);
}

void main(){
	int k=int(max(1.0,uParams.y)); float s=uParams.x*0.5;
	vec4 a=sampleZoom(uTex0,vUv,s,k); vec4 b=sampleZoom(uTex1,vUv,-s,k);
	fragColor=mix(a,b,clamp(uMix,0.0,1.0));
}


