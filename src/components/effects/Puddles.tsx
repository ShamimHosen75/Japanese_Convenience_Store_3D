import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import { CircleGeometry, Color, MathUtils, Mesh, MeshStandardMaterial, ShaderMaterial } from 'three'
import vert from '../../shaders/ripple.vert.glsl?raw'
import fragSrc from '../../shaders/ripple.frag.glsl?raw'
import { BASE_SIZE, FORECOURT, PAD, PAD_H, ROAD_A, ROAD_B } from '../../layout'
import { env } from '../../systems/dayNight'
import { useSceneStore } from '../../store/useSceneStore'
import { GeoBuilder } from '../../utils/mergeGeometry'
import { mulberry32 } from '../../utils/rng'

const WHITE = new Color('#ffffff')
const rect = (r: { x0: number; x1: number; z0: number; z1: number }) =>
  `inRect(vec4(${r.x0.toFixed(2)}, ${r.z0.toFixed(2)}, ${r.x1.toFixed(2)}, ${r.z1.toFixed(2)}))`
const RECT_MASK = [ROAD_A, ROAD_B, PAD].map(rect).join(' + ')

// [x, z, radiusX, radiusZ] – on roads and the rear/side pad (the forecourt has the real reflector)
const PUDDLES: [number, number, number, number][] = [
  [2.2, 6.2, 0.95, 0.5], [7.6, 7.2, 0.8, 0.42], [-1.0, 5.5, 0.55, 0.3], [-6.9, -3.2, 0.5, 0.95],
  [-6.2, 0.4, 0.4, 0.3], [-7.2, 6.9, 0.65, 0.45], [5.9, -3.2, 0.5, 0.75], [-6.6, -7.8, 0.45, 0.7],
]

/** Wet-weather ground: puddles, animated ripple rings, and a real mirror-like reflector on the forecourt. */
export function Puddles() {
  const quality = useSceneStore((s) => s.quality)
  const [reflect, setReflect] = useState(false)
  const reflectorMat = useRef<MeshStandardMaterial & { opacity: number }>(null)
  const reflectMesh = useRef<Mesh>(null!)

  const puddleGeo = useMemo(() => {
    const b = new GeoBuilder()
    const rnd = mulberry32(31)
    PUDDLES.forEach(([x, z, rx, rz]) => {
      const c = new CircleGeometry(1, 22)
      c.rotateX(-Math.PI / 2)
      const pos = c.attributes.position
      const k = 0.85 + rnd() * 0.3
      for (let i = 0; i < pos.count; i++) {
        const a = Math.atan2(pos.getZ(i), pos.getX(i))
        const wob = 1 + 0.18 * Math.sin(a * 3 + x) + 0.1 * Math.sin(a * 5 + z)
        pos.setXYZ(i, pos.getX(i) * rx * wob * k, 0, pos.getZ(i) * rz * wob * k)
      }
      b.add(c, '#ffffff', [x, 0.068, z])
    })
    return b.build()
  }, [])
  const puddleMat = useMemo(
    () => new MeshStandardMaterial({ color: '#1e2740', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    [],
  )
  const puddleMesh = useRef<Mesh>(null!)

  const rippleMat = useMemo(
    () => new ShaderMaterial({
      vertexShader: vert,
      fragmentShader: fragSrc.replace('RECT_MASK', RECT_MASK),
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uRain: { value: 0 }, uColor: { value: new Color('#dbe8ff') } },
    }),
    [],
  )
  const rippleMesh = useRef<Mesh>(null!)

  useEffect(() => () => { puddleGeo.dispose(); puddleMat.dispose(); rippleMat.dispose() }, [puddleGeo, puddleMat, rippleMat])

  useFrame(() => {
    const wet = env.wet
    puddleMat.opacity = Math.min(0.75, wet * 0.8)
    puddleMesh.current.visible = wet > 0.02
    rippleMat.uniforms.uTime.value = env.time
    rippleMat.uniforms.uRain.value = env.rain
    rippleMat.uniforms.uColor.value.copy(env.palette.skyBottom).lerp(WHITE, 0.5).multiplyScalar(1 + env.night * 0.6)
    rippleMesh.current.visible = env.rain > 0.02

    // reflector fades in with night rain; only mounted (and so only rendered) when needed
    const target = quality === 'high' ? env.wet * MathUtils.smoothstep(env.t, 0.45, 0.8) : 0
    const want = target > 0.02
    if (want !== reflect) setReflect(want)
    if (reflectorMat.current) reflectorMat.current.opacity = target
  })

  const fw = FORECOURT.x1 - FORECOURT.x0, fd = FORECOURT.z1 - FORECOURT.z0
  return (
    <group>
      <mesh ref={puddleMesh} geometry={puddleGeo} material={puddleMat} renderOrder={2} />
      <mesh ref={rippleMesh} material={rippleMat} position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
        <planeGeometry args={[BASE_SIZE, BASE_SIZE]} />
      </mesh>
      {reflect && (
        <mesh ref={reflectMesh} position={[(FORECOURT.x0 + FORECOURT.x1) / 2, PAD_H + 0.025, (FORECOURT.z0 + FORECOURT.z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
          <planeGeometry args={[fw, fd]} />
          <MeshReflectorMaterial
            ref={reflectorMat as never}
            color="#a9a49a"
            roughness={0.55}
            metalness={0}
            mirror={0.35}
            mixStrength={1.8}
            mixBlur={0.8}
            blur={[260, 70]}
            resolution={512}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}
