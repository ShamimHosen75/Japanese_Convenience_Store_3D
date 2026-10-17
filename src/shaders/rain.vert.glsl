attribute vec3 aSeed;   // x,y: position in the rain box, z: phase
attribute float aEnd;   // 0 = head of the streak, 1 = tail
uniform float uTime;
uniform float uSpeed;
uniform float uHeight;
uniform float uSlope;   // sideways drift per unit of fall (slight angle)
uniform float uLen;
uniform vec2 uBox;
varying float vA;
void main() {
  float fall = fract(aSeed.z + uTime * uSpeed * (0.85 + 0.3 * aSeed.x) / uHeight);
  float y = uHeight * (1.0 - fall);
  vec3 p = vec3((aSeed.x - 0.5) * uBox.x + uHeight * fall * uSlope, y, (aSeed.y - 0.5) * uBox.y);
  vec3 dir = normalize(vec3(uSlope, -1.0, 0.0));
  p -= dir * uLen * aEnd;
  vA = (1.0 - aEnd * 0.85) * smoothstep(0.0, 0.5, y);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
