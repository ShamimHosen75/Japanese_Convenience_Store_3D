import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending, BackSide, BufferGeometry, Color, Float32BufferAttribute, Mesh, MeshBasicMaterial,
  Points, PointsMaterial, ShaderMaterial, Sprite, SpriteMaterial,
} from 'three'
import { env } from '../../systems/dayNight'
import { radialTexture } from '../../utils/canvasTexture'
import { mulberry32 } from '../../utils/rng'

const vert = /* glsl */ `
varying float vH;
void main() {
  vH = normalize(position).y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
const frag = /* glsl */ `
uniform vec3 uTop; uniform vec3 uBottom;
varying float vH;
// The composer applies ACES filmic tone mapping to everything. Pre-invert it for the sky so the
// gradient on screen matches the palette hex values (#F3E9D2, #F2A97E, #1B1F5E ...).
vec3 invACES(vec3 y) {
  y = clamp(y, 0.0, 0.93);
  vec3 A = 0.983729 * y - 1.0;
  vec3 B = 0.432951 * y - 0.0245786;
  vec3 C = 0.238081 * y + 0.000090537;
  vec3 v = (-B - sqrt(max(B * B - 4.0 * A * C, 0.0))) / (2.0 * A);
  return max(v, 0.0) * 0.6;
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
void main() {
  float h = smoothstep(-0.5, 0.4, vH);
  vec3 col = mix(uBottom, uTop, pow(h, 0.85));
  col += (hash(gl_FragCoord.xy) - 0.5) / 160.0; // dither, avoids banding in the gradient
  gl_FragColor = vec4(invACES(col), 1.0);
}`

/** Gradient sky dome + stars + sun/moon disc. Follows the palette every frame. */
export function Sky() {
  const mat = useMemo(
    () => new ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, side: BackSide, depthWrite: false, fog: false,
      uniforms: { uTop: { value: new Color() }, uBottom: { value: new Color() } },
    }),
    [],
  )
  const stars = useRef<Points>(null!)
  const orb = useRef<Mesh>(null!)
  const halo = useRef<Sprite>(null!)

  const starGeo = useMemo(() => {
    const rnd = mulberry32(7)
    const n = 450
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const th = rnd() * Math.PI * 2
      const y = 0.08 + rnd() * 0.92
      const r = Math.sqrt(1 - y * y)
      pos[i * 3] = Math.cos(th) * r * 82
      pos[i * 3 + 1] = y * 82
      pos[i * 3 + 2] = Math.sin(th) * r * 82
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return g
  }, [])
  const starMat = useMemo(
    () => new PointsMaterial({ color: '#dfe6ff', size: 2.2, sizeAttenuation: false, transparent: true, depthWrite: false, fog: false }),
    [],
  )
  const orbMat = useMemo(() => new MeshBasicMaterial({ fog: false }), [])
  const haloTex = useMemo(() => radialTexture('rgba(255,255,255,0.9)', 'rgba(255,255,255,0)'), [])
  const haloMat = useMemo(
    () => new SpriteMaterial({ map: haloTex, blending: AdditiveBlending, transparent: true, depthWrite: false, fog: false }),
    [haloTex],
  )

  useEffect(() => () => {
    mat.dispose(); starGeo.dispose(); starMat.dispose(); orbMat.dispose(); haloTex.dispose(); haloMat.dispose()
  }, [mat, starGeo, starMat, orbMat, haloTex, haloMat])

  useFrame(() => {
    const p = env.palette
    mat.uniforms.uTop.value.copy(p.skyTop)
    mat.uniforms.uBottom.value.copy(p.skyBottom)
    starMat.opacity = env.palette.stars * 0.9
    stars.current.visible = p.stars > 0.01
    const pos = env.sunDir.clone().multiplyScalar(66)
    orb.current.position.copy(pos)
    halo.current.position.copy(pos)
    orbMat.color.copy(p.sun).multiplyScalar(2.2)
    const low = 1 - Math.min(1, p.sunElevation / 60)
    orb.current.scale.setScalar(1 + low * 0.7)
    halo.current.scale.setScalar(26 + low * 14)
    haloMat.color.copy(p.sun)
    haloMat.opacity = 0.35 + low * 0.15
  })

  return (
    <group>
      <mesh scale={90} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[1, 32, 20]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <points ref={stars} geometry={starGeo} material={starMat} frustumCulled={false} />
      <mesh ref={orb} frustumCulled={false}>
        <sphereGeometry args={[2.4, 20, 14]} />
        <primitive object={orbMat} attach="material" />
      </mesh>
      <sprite ref={halo} material={haloMat} frustumCulled={false} />
    </group>
  )
}
