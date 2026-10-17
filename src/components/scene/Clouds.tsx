import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Group, MeshLambertMaterial } from 'three'
import { env } from '../../systems/dayNight'
import { useSceneStore } from '../../store/useSceneStore'
import { GeoBuilder } from '../../utils/mergeGeometry'
import { mulberry32 } from '../../utils/rng'

const COUNT = 8
const WRAP = 30

interface CloudDef { geo: BufferGeometry; x: number; y: number; z: number; speed: number; s: number }

/** 8 puffy cartoon clouds, each ONE merged geometry of squashed spheres, drifting slowly. */
export function Clouds() {
  const refs = useRef<(Group | null)[]>([])
  const mat = useMemo(() => new MeshLambertMaterial({ vertexColors: true, transparent: true, emissive: '#ffffff', emissiveIntensity: 0.55 }), [])
  const clouds = useMemo<CloudDef[]>(() => {
    const rnd = mulberry32(11)
    return Array.from({ length: COUNT }, (_, i) => {
      const b = new GeoBuilder()
      const n = 5 + Math.floor(rnd() * 3)
      for (let k = 0; k < n; k++) {
        const f = k / (n - 1) - 0.5
        const r = (1.1 + rnd() * 0.5) * (1 - Math.abs(f) * 0.7)
        b.sphere(r, [f * 3.6, (1 - Math.abs(f) * 1.4) * 0.5 + rnd() * 0.25, (rnd() - 0.5) * 0.8], '#ffffff', [1, 0.78, 0.95], 12)
      }
      const a = (i / COUNT) * Math.PI * 2 + rnd()
      const rad = 9 + rnd() * 18
      return { geo: b.build(), x: Math.cos(a) * rad, z: Math.sin(a) * rad, y: 10.5 + rnd() * 3.5, speed: 0.12 + rnd() * 0.18, s: 0.9 + rnd() * 0.9 }
    })
  }, [])

  useEffect(() => () => { mat.dispose(); clouds.forEach((c) => c.geo.dispose()) }, [mat, clouds])

  useFrame((_, delta) => {
    const p = env.palette
    mat.color.copy(p.cloud)
    mat.emissive.copy(p.cloud)
    mat.opacity = p.cloudOpacity * 0.96
    const visible = p.cloudOpacity > 0.01
    const move = useSceneStore.getState().reducedMotion ? 0 : Math.min(delta, 0.1)
    clouds.forEach((c, i) => {
      const g = refs.current[i]
      if (!g) return
      g.visible = visible
      c.x += c.speed * move
      if (c.x > WRAP) c.x = -WRAP
      g.position.x = c.x
    })
  })

  return (
    <group>
      {clouds.map((c, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} position={[c.x, c.y, c.z]} scale={c.s}>
          <mesh geometry={c.geo} material={mat} />
        </group>
      ))}
    </group>
  )
}
