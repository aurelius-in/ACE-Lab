precision highp float;
uniform sampler2D uTextTex; // SDF atlas for whole text block
uniform vec2 uRes;
uniform float uTime;
uniform vec4 uParams; // amp, freq, speed, outlinePx
out vec4 fragColor; in vec2 vUv;

void main(){
  vec2 uv = vUv;
  uv.y += sin(uv.x * uParams.y + uTime * uParams.z) * (uParams.x / uRes.y);
  float sdf = texture(uTextTex, uv).r; // 0..1 distance field
  float edge = 0.5; // iso-surface
  float width = max(0.001, uParams.w / uRes.y); // outline width
  float alpha = smoothstep(edge - width, edge + width, sdf);
  vec3 col = vec3(1.0);
  fragColor = vec4(col, alpha);
}


