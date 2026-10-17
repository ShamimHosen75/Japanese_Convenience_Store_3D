import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, CanvasTexture, DoubleSide, MeshLambertMaterial, PlaneGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { env } from '../../systems/dayNight'
import { posterAtlasTexture } from '../../utils/canvasTexture'

/** Lit, canvas-textured sign. At night the texture also drives the emissive channel (sign lights fade in 0.6–0.8). */
function useGlowTextureMaterial(texture: CanvasTexture, strength: number, side = 0) {
  const mat = useMemo(
    () => new MeshLambertMaterial({ map: texture, emissiveMap: texture, emissive: '#ffffff', emissiveIntensity: 0, side: side ? DoubleSide : 0 }),
    [texture, side],
  )
  useFrame(() => {
    mat.emissiveIntensity = env.glowN * strength
  })
  useEffect(() => () => mat.dispose(), [mat])
  return mat
}

interface SignProps {
  texture: CanvasTexture
  width: number
  height: number
  position: [number, number, number]
  rotation?: [number, number, number]
  strength?: number
  doubleSided?: boolean
}

export function Sign({ texture, width, height, position, rotation = [0, 0, 0], strength = 1.15, doubleSided }: SignProps) {
  const mat = useGlowTextureMaterial(texture, strength, doubleSided ? 1 : 0)
  return (
    <mesh position={position} rotation={rotation} material={mat}>
      <planeGeometry args={[width, height]} />
    </mesh>
  )
}

export interface PosterPlacement { cell: number; x: number; y: number; z: number; w: number; h: number; ry?: number }

/** All window posters share one atlas texture and one merged geometry = one draw call. */
export function PosterSet({ placements }: { placements: PosterPlacement[] }) {
  const tex = useMemo(() => posterAtlasTexture(), [])
  const mat = useGlowTextureMaterial(tex, 0.55)
  const geo = useMemo(() => {
    const parts: BufferGeometry[] = placements.map((p) => {
      const g = new PlaneGeometry(p.w, p.h)
      const uv = g.attributes.uv
      const col = p.cell % 2, row = Math.floor(p.cell / 2)
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, col * 0.5 + uv.getX(i) * 0.5, 1 - (row + 1) * 0.5 + uv.getY(i) * 0.5)
      }
      g.rotateY(p.ry ?? 0)
      g.translate(p.x, p.y, p.z)
      return g
    })
    const merged = mergeGeometries(parts, false)
    parts.forEach((g) => g.dispose())
    return merged
  }, [placements])
  useEffect(() => () => { tex.dispose(); geo.dispose() }, [tex, geo])
  return <mesh geometry={geo} material={mat} />
}
