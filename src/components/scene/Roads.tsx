import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, Color, ExtrudeGeometry, MathUtils, MeshStandardMaterial, Shape } from 'three'
import { FORECOURT, PAD, PAD_H, ROAD_A, ROAD_B, ROAD_H } from '../../layout'
import { wetLook } from '../../systems/dayNight'
import { GeoBuilder } from '../../utils/mergeGeometry'
import { bodyMaterial } from '../../utils/materials'

const ASPHALT = new Color('#3a3f47')
const ASPHALT_WET = new Color('#262a33')
const PAD_COL = new Color('#C9C3B6')
const PAD_WET = new Color('#9a968f')
const WHITE = '#F4F1EA'
const CURB = '#CFC8B8'
const MARK_Y = ROAD_H // markings sit directly on the asphalt, 0.02 thick

function useWetMaterial(dry: Color, wet: Color, roughDry: number) {
  const mat = useMemo(() => new MeshStandardMaterial({ color: dry.clone(), roughness: roughDry, metalness: 0 }), [dry, roughDry])
  useFrame(() => {
    const w = wetLook()
    mat.roughness = MathUtils.lerp(roughDry, 0.16, w)
    mat.color.lerpColors(dry, wet, w)
  })
  useEffect(() => () => mat.dispose(), [mat])
  return mat
}

/** L-shaped asphalt road + painted markings, curbs, zebra crossings and the concrete pad. */
export function Roads() {
  const asphaltGeo = useMemo(() => {
    const s = new Shape()
    // shape-y == world z
    s.moveTo(ROAD_B.x0, ROAD_B.z0)
    s.lineTo(ROAD_B.x1, ROAD_B.z0)
    s.lineTo(ROAD_B.x1, ROAD_A.z0)
    s.lineTo(ROAD_A.x1, ROAD_A.z0)
    s.lineTo(ROAD_A.x1, ROAD_A.z1)
    s.lineTo(ROAD_B.x0, ROAD_A.z1)
    s.closePath()
    const g = new ExtrudeGeometry(s, { depth: ROAD_H, bevelEnabled: false })
    g.rotateX(Math.PI / 2)
    g.translate(0, ROAD_H, 0)
    return g
  }, [])

  const padGeo = useMemo(() => {
    const g = new BoxGeometry(PAD.x1 - PAD.x0, PAD_H, PAD.z1 - PAD.z0)
    g.translate((PAD.x0 + PAD.x1) / 2, PAD_H / 2, (PAD.z0 + PAD.z1) / 2)
    return g
  }, [])

  const markGeo = useMemo(() => {
    const b = new GeoBuilder()
    const T = 0.02
    const xCW = [-3.4, -2.0] // crosswalk across road A
    const zCW = [1.4, 2.8] // crosswalk across road B
    const cy = (ROAD_A.z0 + ROAD_A.z1) / 2
    const cx = (ROAD_B.x0 + ROAD_B.x1) / 2

    // dashed centre line, road A (east-west)
    for (let x = -4.4; x < ROAD_A.x1 - 0.1; x += 1.2) {
      const x1 = Math.min(x + 0.7, ROAD_A.x1)
      if (x1 > xCW[0] - 0.3 && x < xCW[1] + 0.3) continue
      b.block([x1 - x, T, 0.1], [(x + x1) / 2, MARK_Y, cy], WHITE)
    }
    // dashed centre line, road B (north-south)
    for (let z = ROAD_B.z0 + 0.3; z < 3.9; z += 1.2) {
      const z1 = z + 0.7
      if (z1 > zCW[0] - 0.3 && z < zCW[1] + 0.3) continue
      b.block([0.1, T, 0.7], [cx, MARK_Y, z + 0.35], WHITE)
    }
    // zebra crossings: bars run with the traffic, side by side across the road
    const bar = 0.22, step = 0.44
    const nA = 6, startA = cy - ((nA - 1) * step) / 2
    for (let i = 0; i < nA; i++) b.block([xCW[1] - xCW[0], T, bar], [(xCW[0] + xCW[1]) / 2, MARK_Y, startA + i * step], WHITE)
    const nB = 6, startB = cx - ((nB - 1) * step) / 2
    for (let i = 0; i < nB; i++) b.block([bar, T, zCW[1] - zCW[0]], [startB + i * step, MARK_Y, (zCW[0] + zCW[1]) / 2], WHITE)
    // stop line on road B (traffic lane on the left)
    b.block([1.35, T, 0.14], [ROAD_B.x0 + 0.85, MARK_Y, 4.35], WHITE)

    // curbs (raised 0.1) – outside the asphalt so nothing overlaps
    const CH = 0.1, CW = 0.12
    const lenA = ROAD_A.x1 - ROAD_B.x0
    b.block([lenA, CH, CW], [(ROAD_B.x0 + ROAD_A.x1) / 2, 0, ROAD_A.z1 + CW / 2], CURB) // front outer
    b.block([CW, CH, ROAD_A.z1 + CW - ROAD_B.z0], [ROAD_B.x0 - CW / 2, 0, (ROAD_B.z0 + ROAD_A.z1 + CW) / 2], CURB) // left outer
    b.block([ROAD_A.x1 - ROAD_B.x1, CH, CW], [(ROAD_B.x1 + ROAD_A.x1) / 2, 0, ROAD_A.z0 - CW / 2], CURB) // A inner
    b.block([CW, CH, ROAD_A.z0 - CW - ROAD_B.z0], [ROAD_B.x1 + CW / 2, 0, (ROAD_B.z0 + ROAD_A.z0 - CW) / 2], CURB) // B inner

    // forecourt: yellow tactile strip along the curb + parking bays
    const py = PAD_H
    b.block([FORECOURT.x1 - FORECOURT.x0 - 0.4, 0.012, 0.3], [(FORECOURT.x0 + FORECOURT.x1) / 2, py, FORECOURT.z1 - 0.35], '#E8C547')
    for (const x of [2.4, 3.8, 5.2, 6.6 - 0.1]) b.block([0.07, 0.012, 1.25], [x, py, FORECOURT.z1 - 1.25], WHITE)
    b.block([4.3, 0.012, 0.07], [4.45, py, FORECOURT.z1 - 1.9], WHITE)
    return b.build()
  }, [])

  const asphalt = useWetMaterial(ASPHALT, ASPHALT_WET, 0.95)
  const pad = useWetMaterial(PAD_COL, PAD_WET, 0.92)
  useEffect(() => () => { asphaltGeo.dispose(); padGeo.dispose(); markGeo.dispose() }, [asphaltGeo, padGeo, markGeo])

  return (
    <group>
      <mesh geometry={asphaltGeo} material={asphalt} receiveShadow />
      <mesh geometry={padGeo} material={pad} receiveShadow />
      <mesh geometry={markGeo} material={bodyMaterial()} receiveShadow castShadow />
    </group>
  )
}
