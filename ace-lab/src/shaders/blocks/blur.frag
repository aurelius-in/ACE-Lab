precision highp float;
uniform sampler2D uTex0; uniform vec2 uRes; uniform vec2 uDir; uniform float uRadius;
out vec4 fragColor; in vec2 vUv;
void main(){
  vec2 px = 1.0 / uRes;
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  // 9-tap gaussian
  float weights[5];
  weights[0] = 0.227027; weights[1]=0.1945946; weights[2]=0.1216216; weights[3]=0.075; weights[4]=0.045;
  acc += texture(uTex0, vUv).rgb * weights[0]; wsum += weights[0];
  for(int i=1;i<5;i++){
    vec2 o = uDir * float(i) * uRadius * px;
    acc += texture(uTex0, vUv + o).rgb * weights[i];
    acc += texture(uTex0, vUv - o).rgb * weights[i];
    wsum += 2.0*weights[i];
  }
  fragColor = vec4(acc / wsum, 1.0);
}


