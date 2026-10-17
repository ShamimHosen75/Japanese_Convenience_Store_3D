// Injected into MeshLambertMaterial (so the wheat still gets lights + shadows).
// Wind sway = sin(time + worldPos.x * k) * heightFactor, plus a slow travelling gust.
#ifdef WHEAT_VERT_HEAD
attribute float aH;       // 0 at the root .. 1 at the tip
uniform float uTime;
uniform float uWind;
varying float vH;
varying float vSeed;
#endif

#ifdef WHEAT_VERT_BODY
vH = aH;
vec4 iw = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); // blade root in world space
vSeed = fract(sin(dot(iw.xz, vec2(12.9898, 78.233))) * 43758.5453);
float hf = aH * aH;                                                // stiff at the root, floppy at the tip
float sway = sin(uTime * 1.7 + iw.x * 0.65 + iw.z * 0.30 + vSeed * 2.0) * 0.11
           + sin(uTime * 0.6 + iw.x * 0.18 - iw.z * 0.22) * 0.09;  // slow gust wave
transformed.x += sway * hf * uWind * 1.4;
transformed.z += sway * 0.45 * hf * uWind * 1.4;
transformed.y -= abs(sway) * hf * uWind * 0.25;
#endif
