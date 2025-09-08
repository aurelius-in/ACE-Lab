precision highp float;
uniform sampler2D uTex0; // scene
uniform vec2 uRes;
uniform float uTime;
uniform float uMix; // unused
uniform vec4 uParams; // x: bloomStrength (0..1), y: radiusPx, z: lutAmount (0..1)
out vec4 fragColor; in vec2 vUv;

float luma(vec3 c){ return dot(c, vec3(0.2126,0.7152,0.0722)); }
vec3 aceGradient(float t){
  vec3 a = vec3(0.431, 0.0, 1.0); // #6E00FF approx
  vec3 b = vec3(0.659, 0.235, 0.941); // #A83CF0 approx
  vec3 c = vec3(1.0, 0.294, 0.709); // #FF4BB5 approx
  return mix(mix(a,b,clamp(t*2.0,0.0,1.0)), c, clamp(t*2.0-1.0,0.0,1.0));
}

void main(){
  vec2 px = 1.0 / uRes;
  float radius = max(1.0, uParams.y);
  vec3 scene = texture(uTex0, vUv).rgb;

  // Naive separable-like blur kernel (fixed 9 taps)
  vec3 blur = scene * 0.227027;
  blur += texture(uTex0, vUv + vec2(px.x*radius, 0.0)).rgb * 0.1945946;
  blur += texture(uTex0, vUv - vec2(px.x*radius, 0.0)).rgb * 0.1945946;
  blur += texture(uTex0, vUv + vec2(0.0, px.y*radius)).rgb * 0.1216216;
  blur += texture(uTex0, vUv - vec2(0.0, px.y*radius)).rgb * 0.1216216;
  blur += texture(uTex0, vUv + vec2(px.x*radius, px.y*radius)).rgb * 0.075;
  blur += texture(uTex0, vUv + vec2(-px.x*radius, px.y*radius)).rgb * 0.075;
  blur += texture(uTex0, vUv + vec2(px.x*radius, -px.y*radius)).rgb * 0.075;
  blur += texture(uTex0, vUv + vec2(-px.x*radius, -px.y*radius)).rgb * 0.075;

  // Bright threshold
  float th = 0.7; vec3 bright = max(blur - th, 0.0);
  vec3 bloomed = scene + bright * uParams.x;

  // Simple LUT-like tint mixing with ACE gradient based on luma
  float y = luma(bloomed);
  vec3 ace = aceGradient(y);
  vec3 graded = mix(bloomed, ace, uParams.z);

  fragColor = vec4(graded, 1.0);
}


