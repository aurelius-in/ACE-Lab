precision highp float;
uniform sampler2D uTex0; uniform vec2 uRes; uniform float uTime; uniform float uMix; uniform vec4 uParams;
// uParams: aberration, noise, scanline, vignette
out vec4 fragColor; in vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} 
void main(){
  vec2 uv=vUv; float t=uTime*0.6; float ab=uParams.x*0.004;
  vec3 c;
  c.r=texture(uTex0, uv+vec2(ab,0.0)).r;
  c.g=texture(uTex0, uv).g;
  c.b=texture(uTex0, uv-vec2(ab,0.0)).b;
  float n=(hash(floor(uv*uRes)+t)-0.5)*uParams.y;
  float scan=sin(uv.y*uRes.y*3.1415)*uParams.z*0.15;
  float vig=smoothstep(0.9,0.4,length(uv-0.5))*uParams.w;
  vec3 vhs=c + n + scan;
  vhs*=1.0-vig;
  fragColor=vec4(mix(c,vhs,uMix),1.0);
}


