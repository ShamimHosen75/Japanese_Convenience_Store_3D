// Animated rain-ring ripples on roads + pavement (the rectangle mask is injected from layout.ts).
uniform float uTime;
uniform float uRain;
uniform vec3 uColor;
varying vec2 vXZ;

float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float layer(vec2 p, float scale, float seed) {
  vec2 g = p * scale + seed * 7.3;
  vec2 id = floor(g);
  vec2 f = fract(g);
  float h = hash21(id + seed * 13.1);
  vec2 c = vec2(hash21(id + 1.7), hash21(id + 5.3)) * 0.4 + 0.3;
  float life = fract(uTime * 0.55 + h);
  float d = distance(f, c);
  float r = life * 0.3;
  float ring = smoothstep(0.04, 0.0, abs(d - r)) * (1.0 - life) * (1.0 - life);
  return ring * step(0.3, hash21(id + 9.1));
}

float inRect(vec4 r) { // x0, z0, x1, z1
  return step(r.x, vXZ.x) * step(vXZ.x, r.z) * step(r.y, vXZ.y) * step(vXZ.y, r.w);
}

void main() {
  float mask = clamp(RECT_MASK, 0.0, 1.0);
  float a = clamp(layer(vXZ, 2.2, 0.0) + layer(vXZ, 3.6, 1.0) * 0.8, 0.0, 1.0) * mask * uRain;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a * 0.85);
}
