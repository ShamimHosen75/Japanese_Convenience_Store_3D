import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PointLight, QuadraticBezierCurve3, TubeGeometry, Vector3 } from 'three'
import { LIGHT_POLES, POLES } from '../../layout'
import { env } from '../../systems/dayNight'
import { bodyMaterial, glowMaterial } from '../../utils/materials'
import { GeoBuilder } from '../../utils/mergeGeometry'

const POLE_H = 5.3
const LANES: [number, number][] = [[-0.55, 4.8], [0, 5.3], [0.55, 4.8]] // [lateral offset, wire height]

/** Perpendicular (horizontal) to the line of poles at index i. */
function lateral(i: number): Vector3 {
  const a = POLES[Math.max(0, i - 1)], b = POLES[Math.min(POLES.length - 1, i + 1)]
  const t = new Vector3(b[0] - a[0], 0, b[1] - a[1]).normalize()
  return new Vector3(-t.z, 0, t.x)
}

/** 6 wooden poles with crossbars, sagging wires (TubeGeometry on quadratic curves) and 2 street lights. */
export function UtilityPoles() {
  const lights = useRef<(PointLight | null)[]>([])
  const { body, glow, wires, lamps } = useMemo(() => {
    const b = new GeoBuilder()
    const g = new GeoBuilder()
    const w = new GeoBuilder()
    const lampPos: Vector3[] = []

    POLES.forEach(([x, z], i) => {
      const n = lateral(i)
      b.cyl(0.085, 0.13, POLE_H, [x, 0, z], '#7a5a3a', 10)
      const yaw = Math.atan2(n.x, n.z)
      b.block([1.4, 0.1, 0.1], [x, 4.65, z], '#6a4c30', [0, yaw - Math.PI / 2, 0])
      b.block([1.0, 0.09, 0.09], [x, 4.2, z], '#6a4c30', [0, yaw - Math.PI / 2, 0])
      b.block([0.16, 0.08, 0.16], [x, 0.0, z], '#5a4028')
      LANES.forEach(([off, y]) => {
        const px = x + n.x * off, pz = z + n.z * off
        b.cyl(0.035, 0.045, 0.16, [px, y - 0.1, pz], '#E8E2D0', 8)
      })
      // transformer can on the second pole for flavour
      if (i === 2) b.cyl(0.22, 0.22, 0.62, [x, 3.4, z + 0.3], '#8d959c', 12)
      if (LIGHT_POLES.includes(i)) {
        const d = new Vector3(-x, 0, -z).normalize() // arm reaches in towards the diorama
        const ax = x + d.x * 1.15, az = z + d.z * 1.15
        b.tube([x, 4.5, z], [ax, 4.85, az], 0.04, '#505860', 6)
        b.block([0.46, 0.09, 0.26], [ax, 4.8, az], '#505860', [0, Math.atan2(d.x, d.z), 0])
        g.block([0.38, 0.04, 0.2], [ax, 4.77, az], '#FFE9B8', [0, Math.atan2(d.x, d.z), 0])
        lampPos.push(new Vector3(ax, 4.45, az))
      }
    })

    // sagging wires between consecutive poles
    for (let i = 0; i < POLES.length - 1; i++) {
      const n0 = lateral(i), n1 = lateral(i + 1)
      LANES.forEach(([off, y]) => {
        const a = new Vector3(POLES[i][0] + n0.x * off, y, POLES[i][1] + n0.z * off)
        const c = new Vector3(POLES[i + 1][0] + n1.x * off, y, POLES[i + 1][1] + n1.z * off)
        const len = a.distanceTo(c)
        const mid = a.clone().add(c).multiplyScalar(0.5)
        mid.y -= 2 * (0.05 * len + 0.08) // quadratic control point = 2x the visual sag
        w.add(new TubeGeometry(new QuadraticBezierCurve3(a, mid, c), 28, 0.014, 3, false), '#1c1c22')
      })
    }
    return { body: b.build(), glow: g.build(), wires: w.build(), lamps: lampPos }
  }, [])

  useEffect(() => () => { body.dispose(); glow.dispose(); wires.dispose() }, [body, glow, wires])
  useFrame(() => {
    lights.current.forEach((l) => l && (l.intensity = env.lights * 16))
  })

  return (
    <group>
      <mesh geometry={body} material={bodyMaterial()} castShadow />
      <mesh geometry={glow} material={glowMaterial()} />
      <mesh geometry={wires} material={bodyMaterial()} />
      {lamps.map((p, i) => (
        <pointLight key={i} ref={(el) => (lights.current[i] = el)} position={p} color="#FFE0A6" distance={13} decay={2} intensity={0} />
      ))}
    </group>
  )
}
