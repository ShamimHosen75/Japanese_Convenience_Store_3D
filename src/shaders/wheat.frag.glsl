#ifdef WHEAT_FRAG_HEAD
uniform vec3 uBase;     // #C98A1C
uniform vec3 uTip;      // #E8B33A
uniform vec3 uTint;     // palette wheat tint (blue-purple at night)
uniform float uTintMix;
varying float vH;
varying float vSeed;
#endif

#ifdef WHEAT_FRAG_COLOR
vec3 wc = mix(uBase, uTip, smoothstep(0.0, 1.0, vH));
wc *= 0.86 + 0.28 * vSeed;
wc = mix(wc, uTint * (0.45 + 0.5 * vH), uTintMix);
diffuseColor.rgb = wc;
#endif
