import { useEffect, useMemo } from 'react'
import { CylinderGeometry, SphereGeometry, DoubleSide, MeshLambertMaterial, CanvasTexture } from 'three'
import { MIRROR, PAD_H, SCARECROW } from '../../layout'
import { bodyMaterial, glowMaterial } from '../../utils/materials'
import { GeoBuilder } from '../../utils/mergeGeometry'
import { logoTexture, stopTexture } from '../../utils/canvasTexture'
import { STORE_NAME } from '../../config'
import { Sign } from './Sign'

const P = PAD_H
const CANS = ['#E8503A', '#F5B83D', '#3AA7E8', '#6FCB6F', '#FFFFFF', '#B45FD1']

type B = GeoBuilder

function vending(b: B, g: B, x: number, z: number, color: string, lamp: string) {
  b.block([0.78, 1.75, 0.72], [x, P, z], color)
  b.block([0.82, 0.08, 0.76], [x, P + 1.75, z], '#3d4650')
  g.block([0.6, 0.2, 0.03], [x, P + 1.5, z + 0.37], lamp) // lit header panel
  g.block([0.58, 0.82, 0.03], [x, P + 0.62, z + 0.37], '#FFF3D2') // drinks window
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    b.block([0.09, 0.2, 0.06], [x - 0.22 + c * 0.145, P + 0.7 + r * 0.25, z + 0.41], CANS[(r * 4 + c) % CANS.length])
  }
  b.block([0.58, 0.02, 0.07], [x, P + 0.66, z + 0.4], '#9AA1A8')
  b.block([0.58, 0.02, 0.07], [x, P + 0.91, z + 0.4], '#9AA1A8')
  b.block([0.58, 0.02, 0.07], [x, P + 1.16, z + 0.4], '#9AA1A8')
  b.block([0.58, 0.16, 0.05], [x, P + 0.38, z + 0.38], '#2b2f36') // drop slot
  b.block([0.16, 0.2, 0.04], [x + 0.26, P + 0.12, z + 0.37], '#2b2f36')
  g.block([0.05, 0.05, 0.03], [x + 0.26, P + 0.24, z + 0.38], '#7CFF9B') // coin light
}

function bike(b: B, cx: number, cz: number, yaw: number, frame: string) {
  const c = Math.cos(yaw), s = Math.sin(yaw)
  const W = (x: number, y: number, z: number): [number, number, number] => [cx + x * c + z * s, P + y, cz - x * s + z * c]
  const wheel = (x: number) => {
    b.torus(0.31, 0.028, W(x, 0.32, 0), '#2b2f36', [0, yaw, 0], 20)
    b.torus(0.2, 0.01, W(x, 0.32, 0), '#9AA1A8', [0, yaw, 0], 14)
    b.tube(W(x, 0.32, -0.05), W(x, 0.32, 0.05), 0.03, '#9AA1A8')
  }
  wheel(-0.46); wheel(0.46)
  const bb = W(0, 0.3, 0), seat = W(-0.2, 0.76, 0), head = W(0.34, 0.74, 0)
  b.tube(bb, seat, 0.022, frame)
  b.tube(bb, head, 0.022, frame)
  b.tube(seat, head, 0.022, frame)
  b.tube(seat, W(-0.46, 0.32, 0), 0.016, frame)
  b.tube(bb, W(-0.46, 0.32, 0), 0.016, frame)
  b.tube(head, W(0.46, 0.32, 0.03), 0.018, '#9AA1A8')
  b.tube(head, W(0.32, 0.86, 0), 0.015, '#9AA1A8')
  b.tube(W(0.3, 0.88, -0.26), W(0.3, 0.88, 0.26), 0.015, '#2b2f36')
  b.block([0.2, 0.04, 0.1], W(-0.22, 0.78, 0), '#2b2f36', [0, yaw, 0])
  b.block([0.22, 0.14, 0.3], W(0.55, 0.78, 0), '#B0B7BE', [0, yaw, 0]) // basket
  b.block([0.04, 0.2, 0.06], W(0.02, 0.2, 0.2), '#2b2f36', [0, yaw, 0]) // kickstand-ish
}

function umbrellaStand(b: B, x: number, z: number) {
  b.cyl(0.19, 0.17, 0.5, [x, P, z], '#3d6fb5', 14)
  const cols = ['#e8503a', '#f5b83d', '#2f9e6a', '#7a4fc9', '#2b2f36']
  cols.forEach((col, i) => {
    const a = (i / cols.length) * Math.PI * 2
    const dx = Math.cos(a) * 0.07, dz = Math.sin(a) * 0.07
    b.tube([x + dx, P + 0.2, z + dz], [x + dx * 2.4, P + 1.0, z + dz * 2.4], 0.012, '#555')
    b.tube([x + dx * 1.9, P + 0.78, z + dz * 1.9], [x + dx * 2.4, P + 1.02, z + dz * 2.4], 0.045, col, 8, 0.0)
  })
}

function postBox(b: B, x: number, z: number) {
  b.cyl(0.26, 0.28, 0.95, [x, P, z], '#D8322B', 18)
  b.sphere(0.26, [x, P + 0.95, z], '#D8322B', [1, 0.7, 1], 18)
  b.cyl(0.285, 0.285, 0.05, [x, P + 0.55, z], '#E8C547', 18)
  b.block([0.04, 0.2, 0.2], [x - 0.27, P + 0.62, z], '#2b2f36')
  b.cyl(0.3, 0.3, 0.04, [x, P, z], '#7d868e', 18)
}

function bin(b: B, x: number, z: number, color: string) {
  b.block([0.4, 0.7, 0.4], [x, P, z], color)
  b.block([0.44, 0.06, 0.44], [x, P + 0.7, z], '#2b2f36')
  b.block([0.22, 0.04, 0.03], [x, P + 0.5, z + 0.205], '#1a1d22')
}

function scarecrow(b: B, x: number, z: number) {
  const s = '#7a5a3a'
  b.cyl(0.05, 0.06, 2.0, [x, 0, z], s, 8)
  b.tube([x - 0.72, 1.5, z], [x + 0.72, 1.5, z], 0.04, s, 6)
  b.cyl(0.2, 0.26, 0.72, [x, 0.82, z], '#C0463A', 12) // shirt
  b.block([0.18, 0.18, 0.04], [x + 0.02, 1.1, z + 0.24], '#4a6fa5') // patch
  b.sphere(0.2, [x, 1.78, z], '#E8D3A2', [1, 1.05, 1], 12)
  b.block([0.05, 0.05, 0.03], [x - 0.07, 1.82, z + 0.19], '#2b2f36')
  b.block([0.05, 0.05, 0.03], [x + 0.07, 1.82, z + 0.19], '#2b2f36')
  b.block([0.12, 0.025, 0.03], [x, 1.7, z + 0.19], '#2b2f36')
  b.cyl(0.5, 0.5, 0.04, [x, 1.93, z], '#C8963E', 18) // hat brim
  b.cyl(0.2, 0.26, 0.2, [x, 1.96, z], '#A0742E', 14)
  b.cyl(0.21, 0.21, 0.05, [x, 2.0, z], '#C0463A', 14)
  for (const sx of [-1, 1]) {
    b.block([0.16, 0.14, 0.05], [x + sx * 0.78, 1.43, z], '#E8B33A')
    b.block([0.12, 0.14, 0.04], [x + sx * 0.78, 1.28, z], '#E8B33A')
  }
  b.block([0.3, 0.16, 0.05], [x, 0.7, z + 0.1], '#E8B33A') // straw at the hem
}

function mirror(b: B, x: number, z: number) {
  const yaw = Math.PI / 4
  b.cyl(0.04, 0.045, 2.4, [x, 0, z], '#E9E9E9', 8)
  b.block([0.04, 0.5, 0.04], [x, 0.4, z], '#D8322B') // red band
  const top: [number, number, number] = [x, 2.45, z]
  b.add(new SphereGeometry(0.38, 18, 12), '#CFE3F0', [x + Math.sin(yaw) * 0.06, 2.45, z + Math.cos(yaw) * 0.06], [0, yaw, 0], [1, 1, 0.3])
  b.torus(0.37, 0.045, [top[0], top[1], top[2]], '#F2812B', [0, yaw, 0], 24)
  b.cyl(0.36, 0.36, 0.06, [x - Math.sin(yaw) * 0.04, 2.45 - 0.03, z - Math.cos(yaw) * 0.04], '#8a8f96', 18, [Math.PI / 2, yaw, 0])
}

/** Vending machines, bikes, umbrella stand, post box, bins, scarecrow, road mirror, pole sign, stop sign – 2 draw calls + 3 sign quads. */
export function Props() {
  const { body, glow } = useMemo(() => {
    const b = new GeoBuilder()
    const g = new GeoBuilder()
    vending(b, g, -3.55, -1.75, '#D93A3A', '#FF6A5A')
    vending(b, g, -2.72, -1.75, '#2F6FD6', '#6AA8FF')
    bike(b, 5.15, 0.55, 0.12, '#E85A5A')
    bike(b, 5.25, 1.45, -0.1, '#35B6B0')
    umbrellaStand(b, 3.45, -0.62)
    postBox(b, 6.1, 3.6)
    bin(b, -3.5, -3.0, '#4a8f5a')
    bin(b, -2.9, -3.0, '#3b78c4')
    scarecrow(b, SCARECROW[0], SCARECROW[1])
    mirror(b, MIRROR[0], MIRROR[1])

    // tall pole sign with the round orange logo
    b.cyl(0.055, 0.07, 4.4, [-3.7, P, 4.2], '#9AA1A8', 10)
    b.block([1.08, 1.34, 0.08], [-3.7, P + 3.3, 4.2], '#14663d')
    b.block([0.9, 0.12, 0.1], [-3.7, P + 3.1, 4.2], '#f58220')
    g.block([0.7, 0.06, 0.1], [-3.7, P + 4.68, 4.2], '#fff3d6') // top lamp
    // stop sign on road B approach
    b.cyl(0.03, 0.03, 1.9, [-4.7, 0, 3.0], '#9AA1A8', 8)
    const octBack = new CylinderGeometry(0.29, 0.29, 0.025, 8)
    octBack.rotateY(Math.PI / 8)
    b.add(octBack, '#8a8f96', [-4.7 + 0.02, 1.75, 3.0], [0, 0, Math.PI / 2])
    return { body: b.build(), glow: g.build() }
  }, [])

  const logo = useMemo(() => logoTexture(STORE_NAME), [])
  const stop = useMemo(() => stopTexture(), [])
  const stopMat = useMemo(() => new MeshLambertMaterial({ map: stop, alphaTest: 0.5, side: DoubleSide }), [stop])
  useEffect(() => () => { body.dispose(); glow.dispose(); logo.dispose(); stop.dispose(); stopMat.dispose() }, [body, glow, logo, stop, stopMat])

  const P3: [number, number, number] = [-3.7, P + 3.35, 4.2]
  return (
    <group>
      <mesh geometry={body} material={bodyMaterial()} castShadow receiveShadow />
      <mesh geometry={glow} material={glowMaterial()} />
      <Sign texture={logo as CanvasTexture} width={0.96} height={1.2} position={[P3[0], P3[1], P3[2] + 0.045]} strength={1.3} />
      <Sign texture={logo as CanvasTexture} width={0.96} height={1.2} position={[P3[0], P3[1], P3[2] - 0.045]} rotation={[0, Math.PI, 0]} strength={1.3} />
      <mesh position={[-4.7 + 0.04, 1.75, 3.0]} rotation={[0, -Math.PI / 2, 0]} material={stopMat}>
        <planeGeometry args={[0.6, 0.6]} />
      </mesh>
    </group>
  )
}
