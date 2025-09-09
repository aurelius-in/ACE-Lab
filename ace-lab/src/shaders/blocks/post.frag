precision highp float;
uniform sampler2D uTex0; // base
uniform sampler2D uTex1; // blurred ping-pong
uniform sampler2D uLUT;  // optional 16x16 tiles 3D LUT (256x16)
uniform vec2 uRes;
uniform float uTime;
uniform float uMix; // unused
uniform vec4 uParams; // x: bloomStrength (0..1), y: radiusPx, z: lutAmount (0..1)
out vec4 fragColor; in vec2 vUv;

vec3 sampleLUT(vec3 color){
  float size = 16.0; float tiles = 16.0; float tileSize = 1.0/tiles; float step = 1.0/(tiles*size);
  float b = floor(color.b*(size-1.0)+0.5);
  float tx = mod(b, tiles);
  float ty = floor(b/tiles);
  vec2 uv = vec2(
    (tx*size + color.r*(size-1.0) + 0.5) * step,
    (ty*size + color.g*(size-1.0) + 0.5) * step
  );
  return texture(uLUT, uv).rgb;
}

void main(){
  vec3 base = texture(uTex0, vUv).rgb;
  vec3 bloom = texture(uTex1, vUv).rgb * uParams.x;
  vec3 outc = base + bloom;
  #ifdef GL_ES
  // if no LUT bound, uParams.z should be 0
  #endif
  vec3 lutc = sampleLUT(outc);
  outc = mix(outc, lutc, clamp(uParams.z, 0.0, 1.0));
  fragColor = vec4(outc, 1.0);
}


