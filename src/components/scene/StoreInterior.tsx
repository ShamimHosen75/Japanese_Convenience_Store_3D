import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PointLight } from 'three'
import { STORE_D, STORE_H } from '../../layout'
import { env } from '../../systems/dayNight'
import { bodyMaterial, glowMaterial } from '../../utils/materials'
import { GeoBuilder } from '../../utils/mergeGeometry'
import { mulberry32 } from '../../utils/rng'

export const FY = 0.06 // interior floor height
const PRODUCT = ['#E8503A', '#F5B83D', '#3AA7E8', '#6FCB6F', '#B45FD1', '#F58AB3', '#FFFFFF', '#A9663A', '#FF8C42', '#2EC4B6']
const HEADER = ['#f58220', '#1aa35b', '#2f6fd6', '#e8503a']

/** Everything you can see through the glass: shelves, drink fridge, ATM, counter, clerk, ceiling lights. */
export function StoreInterior() {
  const light = useRef<PointLight>(null!)
  const { body, glow } = useMemo(() => {
    const b = new GeoBuilder()
    const g = new GeoBuilder()
    const rnd = mulberry32(99)
    const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]

    // ---- aisle shelves (two rows, each split by the entrance aisle) -----------------------
    const shelf = (cx: number, cz: number, len: number, headerColor: string) => {
      const D = 0.5, Hh = 1.5
      b.block([len, 0.12, D], [cx, FY, cz], '#C9C2B2')
      b.block([len, Hh, 0.04], [cx, FY, cz], '#EFEAD9')
      for (const s of [-1, 1]) b.block([0.05, Hh, D], [cx + (s * len) / 2, FY, cz], '#D9D2C0')
      for (let i = 0; i < 4; i++) b.block([len, 0.04, D], [cx, FY + 0.12 + i * 0.4, cz], '#F4F1EA')
      g.block([len + 0.05, 0.24, D + 0.06], [cx, FY + Hh, cz], headerColor)
      for (let tier = 0; tier < 3; tier++) {
        const y = FY + 0.12 + tier * 0.4 + 0.04
        for (const s of [-1, 1]) {
          let x = cx - len / 2 + 0.1
          while (x < cx + len / 2 - 0.12) {
            const w = 0.1 + rnd() * 0.07, h = 0.14 + rnd() * 0.14, d = 0.09 + rnd() * 0.05
            b.block([w, h, d], [x + w / 2, y, cz + s * (0.02 + d / 2 + 0.01)], pick(PRODUCT))
            x += w + 0.025
          }
        }
      }
    }
    shelf(-2.05, -0.45, 1.9, HEADER[0])
    shelf(2.05, -0.45, 1.9, HEADER[1])
    shelf(-2.05, 0.8, 1.9, HEADER[2])
    shelf(2.05, 0.8, 1.9, HEADER[3])

    // ---- drink fridge along the back wall -------------------------------------------------
    const fz = -STORE_D / 2 + 0.15 + 0.3
    b.block([4.5, 2.25, 0.6], [-1.05, FY, fz], '#E7ECF0')
    g.block([4.5, 0.1, 0.62], [-1.05, FY + 2.25, fz], '#BFEFFF')
    for (let i = 0; i < 5; i++) {
      const x = -2.85 + i * 0.9
      g.block([0.8, 1.8, 0.03], [x, FY + 0.22, fz + 0.315], '#D5F4FF')
      for (let r = 0; r < 4; r++) {
        for (let k = 0; k < 6; k++) {
          b.block([0.09, 0.26, 0.07], [x - 0.33 + k * 0.132, FY + 0.32 + r * 0.42, fz + 0.37], pick(PRODUCT))
        }
        b.block([0.78, 0.02, 0.1], [x, FY + 0.28 + r * 0.42, fz + 0.36], '#9AA1A8')
      }
    }

    // ---- ATM ------------------------------------------------------------------------------
    b.block([0.7, 1.55, 0.5], [2.6, FY, -1.85], '#C9CED6')
    b.block([0.6, 0.06, 0.4], [2.6, FY + 1.55, -1.85], '#6b7480')
    g.block([0.46, 0.32, 0.03], [2.6, FY + 1.02, -1.59], '#8CFFD0', [-0.25, 0, 0])
    b.block([0.4, 0.2, 0.06], [2.6, FY + 0.72, -1.58], '#3d4650', [-0.35, 0, 0])
    g.block([0.34, 0.04, 0.03], [2.6, FY + 0.56, -1.58], '#F5B83D')
    g.block([0.6, 0.12, 0.03], [2.6, FY + 1.38, -1.59], '#f58220')

    // ---- counter, register, clerk ---------------------------------------------------------
    b.block([1.7, 0.95, 0.6], [-2.2, FY, 1.7], '#9C6B3E')
    b.block([1.78, 0.06, 0.68], [-2.2, FY + 0.95, 1.7], '#F2F0EA')
    b.block([0.42, 0.2, 0.34], [-2.55, FY + 1.01, 1.7], '#3d4650')
    g.block([0.3, 0.16, 0.02], [-2.55, FY + 1.18, 1.57], '#7CF0FF', [-0.35, 0, 0])
    for (let i = 0; i < 4; i++) b.block([0.16, 0.1, 0.12], [-1.95 + i * 0.2, FY + 1.01, 1.7], pick(PRODUCT))
    b.cyl(0.17, 0.19, 0.62, [-2.2, FY, 1.16], '#1aa35b')
    b.sphere(0.15, [-2.2, FY + 0.78, 1.16], '#F6D3B3')
    b.cyl(0.16, 0.16, 0.06, [-2.2, FY + 0.88, 1.16], '#1aa35b')
    b.block([0.2, 0.03, 0.12], [-2.2, FY + 0.9, 1.26], '#1aa35b')

    // ---- ceiling lights (glow) ------------------------------------------------------------
    for (const x of [-1.9, 1.9]) for (const z of [-0.5, 0.9]) g.block([1.7, 0.04, 0.28], [x, STORE_H - 0.1 - 0.04, z], '#FFF3D6')
    // entrance mat inside
    b.block([1.5, 0.012, 0.8], [0, FY, STORE_D / 2 - 0.6], '#46604a')
    return { body: b.build(), glow: g.build() }
  }, [])

  useEffect(() => () => { body.dispose(); glow.dispose() }, [body, glow])
  useFrame(() => {
    light.current.intensity = env.lights * 9
  })

  return (
    <group>
      <mesh geometry={body} material={bodyMaterial()} castShadow receiveShadow />
      <mesh geometry={glow} material={glowMaterial()} />
      <pointLight ref={light} position={[0, STORE_H - 0.6, 0.3]} color="#FFE6BC" distance={9} decay={2} intensity={0} />
    </group>
  )
}
