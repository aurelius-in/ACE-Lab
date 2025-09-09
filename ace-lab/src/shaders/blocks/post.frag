precision highp float;
uniform sampler2D uTex0; // blurred image (pong)
uniform sampler2D uTex1; // base image (rtTex)
uniform sampler2D uLUT;  // optional 16x16 tiles 3D LUT (256x16)
uniform vec2 uRes;
uniform float uTime;
uniform float uMix; // unused
// uParams: x=bloomStrength (0..1), y=bloomThreshold (0..1), z=lutAmount (0..1), w=grainAmount (0..1)
uniform vec4 uParams;
uniform float uVignette; // 0..1 strength
out vec4 fragColor; in vec2 vUv;

float rand(vec2 co){
  return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
}

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
  vec3 base = texture(uTex1, vUv).rgb;
  vec3 blurred = texture(uTex0, vUv).rgb;
  // bloom mask from base brightness and threshold
  float bright = max(max(base.r, base.g), base.b);
  float mask = smoothstep(uParams.y, clamp(uParams.y+0.2, 0.0, 1.0), bright);
  vec3 outc = base + blurred * (uParams.x * mask);
  // LUT
  vec3 lutc = sampleLUT(outc);
  outc = mix(outc, lutc, clamp(uParams.z, 0.0, 1.0));
  // grain
  float g = (rand(vUv * uRes + vec2(uTime*60.0, uTime*37.0)) - 0.5) * 2.0 * uParams.w;
  outc += g;
  // vignette
  float r = length(vUv - 0.5);
  float v = smoothstep(0.8, 0.4, r);
  outc *= mix(1.0, (1.0 - v), clamp(uVignette, 0.0, 1.0));
  fragColor = vec4(outc, 1.0);
}


