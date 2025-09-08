precision highp float;
uniform sampler2D uTextTex; uniform vec2 uRes; uniform float uTime; uniform float uMix; uniform vec4 uParams;
// uParams: amp, freq, speed, outlinePx
out vec4 fragColor; in vec2 vUv;
void main(){
  float amp=uParams.x; float freq=uParams.y; float sp=uParams.z; float outline=uParams.w/uRes.y;
  vec2 uv=vUv; uv.y += sin(uv.x*freq + uTime*sp)*amp/uRes.y;
  vec4 t=texture(uTextTex, uv);
  float edge=smoothstep(0.5,0.5-outline, t.a);
  vec3 col=mix(vec3(0.0), vec3(1.0), t.r);
  fragColor=vec4(mix(col, vec3(0.0), 1.0-edge), t.a);
}


