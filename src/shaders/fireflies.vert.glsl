attribute vec4 aSeed;
uniform float uTime;
uniform float uVis;
uniform float uSize;
uniform float uScale;
varying float vA;
void main() {
  vec3 p = position;
  float t = uTime * 0.35;
  // slow lazy drift (sums of sines = cheap noise)
  p.x += sin(t * (0.6 + aSeed.x) + aSeed.y * 20.0) * 0.9 + sin(t * 1.9 + aSeed.z * 13.0) * 0.35;
  p.y += sin(t * (0.5 + aSeed.y) + aSeed.w * 17.0) * 0.35 + 0.3;
  p.z += cos(t * (0.6 + aSeed.z) + aSeed.x * 11.0) * 0.9 + cos(t * 1.7 + aSeed.w * 9.0) * 0.35;
  float pulse = 0.5 + 0.5 * sin(uTime * (1.2 + aSeed.w * 2.2) + aSeed.x * 30.0);
  pulse = pulse * pulse;
  vA = uVis * (0.2 + 0.8 * pulse);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * uScale * (0.55 + 0.7 * pulse) / -mv.z;
  gl_Position = projectionMatrix * mv;
}
