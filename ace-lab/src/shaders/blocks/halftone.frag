precision highp float;
uniform sampler2D uTex0; uniform vec2 uRes; uniform float uTime; uniform float uMix; uniform vec4 uParams;
// uParams: dotScale, angleRad, contrast, invert01
out vec4 fragColor; in vec2 vUv;
float luma(vec3 c){return dot(c, vec3(0.2126,0.7152,0.0722));}
void main(){
  vec2 uv=vUv; vec2 px=1.0/uRes; float s=uParams.x; float a=uParams.y; mat2 R=mat2(cos(a),-sin(a),sin(a),cos(a));
  vec2 g=floor(R*(uv*uRes)/max(1.0,s))*max(1.0,s); vec2 p=(R*(uv*uRes)-g)/max(1.0,s)-.5; float d=length(p);
  vec3 col=texture(uTex0,uv).rgb; float v=luma(col); v=pow(v, uParams.z);
  float m=smoothstep(.5,.45,d); if(uParams.w>0.5) m=1.0-m; vec3 ht=mix(col, vec3(m), uMix);
  fragColor=vec4(ht,1.0);
}


