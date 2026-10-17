import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Mesh, MeshBasicMaterial, PointLight } from 'three'
import { STORE_D, STORE_H, STORE_POS, STORE_W } from '../../layout'
import { STORE_NAME, STORE_NAME_JP, STORE_TAGLINE } from '../../config'
import { env } from '../../systems/dayNight'
import { cameraApi } from '../../systems/cameraRig'
import { bannerTexture, radialTexture } from '../../utils/canvasTexture'
import { bodyMaterial, glassMaterial, glowMaterial } from '../../utils/materials'
import { GeoBuilder } from '../../utils/mergeGeometry'
import { Sign, PosterSet, PosterPlacement } from './Sign'
import { StoreInterior } from './StoreInterior'

const W = STORE_W, D = STORE_D, H = STORE_H, T = 0.15
const CREAM = '#F4EBD6'
const GREEN = '#1aa35b'
const ORANGE = '#f58220'
const FZ = D / 2 - T / 2 // z of the glass plane

const POSTERS: PosterPlacement[] = [
  { cell: 0, x: -2.55, y: 1.45, z: FZ + 0.03, w: 0.72, h: 0.9 },
  { cell: 1, x: -1.6, y: 1.2, z: FZ + 0.03, w: 0.72, h: 0.9 },
  { cell: 2, x: 1.65, y: 1.3, z: FZ + 0.03, w: 0.72, h: 0.9 },
  { cell: 3, x: 2.55, y: 1.5, z: FZ + 0.03, w: 0.72, h: 0.9 },
]

/** The convenience store: shell, stripes, roof + AC units, awning, glass facade, banner, posters, light pool. */
export function Store() {
  const { body, glow, glassGeo } = useMemo(() => {
    const b = new GeoBuilder()
    const g = new GeoBuilder()

    // ---- shell ----------------------------------------------------------------------------
    b.block([W - 2 * T, 0.06, D - 2 * T], [0, 0, 0], '#E4DFD2') // floor
    b.block([W, H, T], [0, 0, -D / 2 + T / 2], CREAM) // back
    b.block([T, H, D - 2 * T], [-W / 2 + T / 2, 0, 0], CREAM) // left
    b.block([T, H, D - 2 * T], [W / 2 - T / 2, 0, 0], CREAM) // right
    b.block([W, 0.5, T], [0, 0, FZ], CREAM) // front sill
    b.block([W, H - 2.2, T], [0, 2.2, FZ], CREAM) // front lintel
    for (const s of [-1, 1]) b.block([0.5, 1.7, T], [s * 3.25, 0.5, FZ], CREAM) // pillars

    // ---- roof + parapet + AC units --------------------------------------------------------
    const RT = H + 0.12
    b.block([W + 0.3, 0.22, D + 0.3], [0, H - 0.1, 0], '#ECE6D8')
    const pw = W + 0.3, pd = D + 0.3
    b.block([pw, 0.14, 0.1], [0, RT, pd / 2 - 0.05], '#D9D2C0')
    b.block([pw, 0.14, 0.1], [0, RT, -pd / 2 + 0.05], '#D9D2C0')
    for (const s of [-1, 1]) b.block([0.1, 0.14, pd - 0.2], [s * (pw / 2 - 0.05), RT, 0], '#D9D2C0')
    const ac = (x: number, z: number) => {
      b.block([0.9, 0.16, 0.6], [x, RT, z], '#9AA1A8')
      b.block([1.0, 0.62, 0.72], [x, RT + 0.16, z], '#DDE2E7')
      b.cyl(0.25, 0.25, 0.05, [x, RT + 0.47, z + 0.37], '#56616b', 16, [Math.PI / 2, 0, 0])
      b.cyl(0.12, 0.12, 0.06, [x, RT + 0.47, z + 0.38], '#9AA1A8', 12, [Math.PI / 2, 0, 0])
      b.block([0.9, 0.05, 0.1], [x, RT + 0.78, z - 0.1], '#c4cad0')
    }
    ac(-2.1, -0.9)
    ac(-0.7, -0.9)
    ac(2.4, -0.9)
    b.cyl(0.1, 0.1, 0.5, [0.9, RT, -1.5], '#9AA1A8') // vent pipe
    b.cyl(0.16, 0.16, 0.05, [0.9, RT + 0.5, -1.5], '#7d868e')

    // ---- green + orange stripe band, wrapping the building ---------------------------------
    const band = (y: number, h: number, color: string) => {
      b.block([W + 0.06, h, 0.03], [0, y, D / 2 + 0.015], color)
      b.block([W + 0.06, h, 0.03], [0, y, -D / 2 - 0.015], color)
      for (const s of [-1, 1]) b.block([0.03, h, D], [s * (W / 2 + 0.015), y, 0], color)
    }
    band(3.3, 0.16, GREEN)
    band(3.46, 0.08, ORANGE)
    band(3.54, 0.14, GREEN)
    // base skirt
    b.block([W + 0.06, 0.18, 0.03], [0, 0, D / 2 + 0.015], '#CFC6AE')
    b.block([W + 0.06, 0.18, 0.03], [0, 0, -D / 2 - 0.015], '#CFC6AE')
    for (const s of [-1, 1]) b.block([0.03, 0.18, D], [s * (W / 2 + 0.015), 0, 0], '#CFC6AE')

    // ---- banner board -----------------------------------------------------------------------
    b.block([5.4, 0.8, 0.1], [0, 2.45, D / 2 + 0.05], '#14663d')

    // ---- glass frame: mullions, door, handles ---------------------------------------------
    const FR = '#3d4650'
    for (const x of [-2.05, -0.8, 0.8, 2.05]) b.block([0.05, 1.7, 0.06], [x, 0.5, FZ + 0.01], FR)
    b.block([6.0, 0.05, 0.06], [0, 1.95, FZ + 0.01], FR)
    b.block([6.0, 0.05, 0.06], [0, 0.5, FZ + 0.01], FR)
    for (const x of [-0.68, 0.68]) b.block([0.035, 0.55, 0.07], [x, 0.95, FZ + 0.05], '#C9CED6')
    b.block([1.8, 0.015, 0.9], [0, 0, D / 2 + 0.5], '#46604a') // door mat

    // ---- striped awning ---------------------------------------------------------------------
    for (let i = 0; i < 8; i++) {
      const x = -3.2 + 0.4 + i * 0.8
      const c = i % 2 ? '#F4F1EA' : GREEN
      b.block([0.8, 0.07, 1.15], [x, 2.34, D / 2 + 0.57], c, [0.22, 0, 0])
      b.block([0.8, 0.16, 0.03], [x, 2.05, D / 2 + 1.13], c)
    }
    for (const s of [-1, 1]) b.cyl(0.03, 0.03, 2.1, [s * 3.15, 0, D / 2 + 1.1], '#9AA1A8', 8)

    // ---- small emissive extras ----------------------------------------------------------------
    g.block([0.9, 0.12, 0.05], [0, 2.18, D / 2 + 0.03], '#fff3d6') // "welcome" light strip over the door
    g.block([5.2, 0.05, 0.14], [0, 2.4, D / 2 + 0.2], '#fff3d6', [0.22, 0, 0]) // awning underside lamp strip

    // glass pane (separate transparent material)
    const gl = new GeoBuilder()
    gl.block([6.0, 1.7, 0.02], [0, 0.5, FZ], '#ffffff')
    return { body: b.build(), glow: g.build(), glassGeo: gl.build() }
  }, [])

  const bannerTex = useMemo(() => bannerTexture(STORE_NAME, STORE_TAGLINE, STORE_NAME_JP), [])
  const poolTex = useMemo(() => radialTexture('rgba(255,214,150,1)', 'rgba(255,214,150,0)', 256), [])
  const poolMat = useMemo(
    () => new MeshBasicMaterial({ map: poolTex, transparent: true, blending: AdditiveBlending, depthWrite: false, fog: false, opacity: 0 }),
    [poolTex],
  )
  const frontLight = useRef<PointLight>(null!)
  const pool = useRef<Mesh>(null!)

  useFrame(() => {
    poolMat.opacity = env.lights * 0.55
    pool.current.visible = env.lights > 0.01
    frontLight.current.intensity = env.lights * 6
  })
  useEffect(() => () => { body.dispose(); glow.dispose(); glassGeo.dispose(); bannerTex.dispose(); poolTex.dispose(); poolMat.dispose() }, [body, glow, glassGeo, bannerTex, poolTex, poolMat])

  return (
    <group
      position={[STORE_POS.x, 0.05, STORE_POS.z]}
      onClick={(e) => {
        e.stopPropagation()
        cameraApi.focusStore()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
    >
      <mesh geometry={body} material={bodyMaterial()} castShadow receiveShadow />
      <mesh geometry={glow} material={glowMaterial()} />
      <mesh geometry={glassGeo} material={glassMaterial()} renderOrder={5} />
      <StoreInterior />
      <Sign texture={bannerTex} width={5.2} height={0.72} position={[0, 2.85, D / 2 + 0.103]} />
      <PosterSet placements={POSTERS} />
      <pointLight ref={frontLight} position={[0, 2.0, D / 2 + 1.0]} color="#FFD9A0" distance={8} decay={2} intensity={0} />
      <mesh ref={pool} material={poolMat} position={[0, 0.04, D / 2 + 2.4]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
        <planeGeometry args={[11, 7]} />
      </mesh>
    </group>
  )
}

