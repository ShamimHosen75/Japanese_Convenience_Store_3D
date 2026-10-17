import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, MeshLambertMaterial, Shape } from 'three'
import { BASE_SIZE } from '../../layout'
import { env } from '../../systems/dayNight'
import { radialTexture } from '../../utils/canvasTexture'

const THICK = 1.5
const BEVEL = 0.12
const TOP = new Color('#A47E3C')
const SIDE_A = new Color('#8B5A2B')
const SIDE_B = new Color('#6B4423')

/** 20 x 20 floating slab, 1.5 thick, bevelled, warm brown sides, soft shadow underneath. */
export function Base() {
  const geo = useMemo(() => {
    const h = BASE_SIZE / 2 - BEVEL
    const s = new Shape()
    s.moveTo(-h, -h); s.lineTo(h, -h); s.lineTo(h, h); s.lineTo(-h, h); s.closePath()
    const g = new ExtrudeGeometry(s, {
      depth: THICK - BEVEL * 2, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 3, curveSegments: 1,
    })
    g.rotateX(-Math.PI / 2) // extrusion (z) -> up (y)
    g.computeBoundingBox()
    g.translate(0, -g.boundingBox!.max.y, 0) // top surface sits at y = 0
    const pos = g.attributes.position
    const nor = g.attributes.normal
    const col = new Float32Array(pos.count * 3)
    const c = new Color()
    for (let i = 0; i < pos.count; i++) {
      if (nor.getY(i) > 0.85) c.copy(TOP)
      else c.lerpColors(SIDE_A, SIDE_B, Math.min(1, Math.max(0, -pos.getY(i) / THICK)))
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
    }
    g.setAttribute('color', new Float32BufferAttribute(col, 3))
    return g
  }, [])
  const mat = useMemo(() => new MeshLambertMaterial({ vertexColors: true }), [])

  const shadowTex = useMemo(() => radialTexture('rgba(0,0,0,0.55)', 'rgba(0,0,0,0)', 256), [])
  const shadowMat = useMemo(
    () => new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, fog: false, side: DoubleSide }),
    [shadowTex],
  )
  const shadow = useRef<Mesh>(null!)
  useFrame(() => {
    shadowMat.opacity = 0.55 + env.night * 0.2
  })
  useEffect(() => () => { geo.dispose(); mat.dispose(); shadowTex.dispose(); shadowMat.dispose() }, [geo, mat, shadowTex, shadowMat])

  return (
    <group>
      <mesh geometry={geo} material={mat} receiveShadow />
      {/* soft contact shadow cast on the "air" below the floating base */}
      <mesh ref={shadow} material={shadowMat} position={[0, -5.2, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-5}>
        <planeGeometry args={[34, 34]} />
      </mesh>
    </group>
  )
}
