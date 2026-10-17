import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferGeometry, Color, DoubleSide, Euler, Float32BufferAttribute, InstancedMesh, Matrix4, MeshLambertMaterial,
  Quaternion, Vector3,
} from 'three'
import vertSrc from '../../shaders/wheat.vert.glsl?raw'
import fragSrc from '../../shaders/wheat.frag.glsl?raw'
import { HALF, isWheatSpot } from '../../layout'
import { env } from '../../systems/dayNight'
import { useSceneStore } from '../../store/useSceneStore'
import { mulberry32 } from '../../utils/rng'

export const WHEAT_MAX = 34000
const WHEAT_COUNT = { high: 32000, low: 12000 }

/** pull a `#ifdef NAME ... #endif` block out of a snippet file */
function section(src: string, name: string) {
  const m = src.match(new RegExp(`#ifdef ${name}\\n([\\s\\S]*?)#endif`))
  return m ? m[1] : ''
}

/** One tapered, slightly bent blade: 3 quads + a tip. Height 1, width 0.06. */
function bladeGeometry() {
  const rows = [0, 0.34, 0.68]
  const pos: number[] = []
  const h: number[] = []
  const nor: number[] = []
  rows.forEach((y) => {
    const w = 0.03 * (1 - y * 0.75)
    const lean = y * y * 0.18
    pos.push(-w, y, lean, w, y, lean)
    h.push(y, y)
  })
  pos.push(0, 1, 0.34 * 0.7)
  h.push(1)
  for (let i = 0; i < pos.length / 3; i++) nor.push(0, 1, 0)
  const idx = [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6]
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3))
  g.setAttribute('aH', new Float32BufferAttribute(h, 1))
  g.setIndex(idx)
  return g
}

/** ONE InstancedMesh of golden wheat with a custom vertex shader for wind sway. */
export function Wheat() {
  const mesh = useRef<InstancedMesh>(null!)
  const quality = useSceneStore((s) => s.quality)
  const geo = useMemo(bladeGeometry, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWind: { value: 1 },
      uBase: { value: new Color('#C98A1C') },
      uTip: { value: new Color('#E8B33A') },
      uTint: { value: new Color('#ffffff') },
      uTintMix: { value: 0 },
    }),
    [],
  )
  const mat = useMemo(() => {
    const m = new MeshLambertMaterial({ side: DoubleSide })
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${section(vertSrc, 'WHEAT_VERT_HEAD')}`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>\n${section(vertSrc, 'WHEAT_VERT_BODY')}`)
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${section(fragSrc, 'WHEAT_FRAG_HEAD')}`)
        .replace('#include <color_fragment>', `#include <color_fragment>\n${section(fragSrc, 'WHEAT_FRAG_COLOR')}`)
        // blades are double sided but must always be lit as if facing up: skip the back-face normal flip
        .replace('#include <normal_fragment_begin>', 'vec3 normal = normalize( vNormal );\n vec3 nonPerturbedNormal = normal;')
    }
    m.customProgramCacheKey = () => 'konbini-wheat'
    return m
  }, [uniforms])

  useLayoutEffect(() => {
    const rnd = mulberry32(2024)
    const m = new Matrix4(), q = new Quaternion(), e = new Euler(), p = new Vector3(), s = new Vector3()
    let n = 0
    let guard = 0
    while (n < WHEAT_MAX && guard++ < WHEAT_MAX * 60) {
      const x = (rnd() * 2 - 1) * (HALF - 0.2)
      const z = (rnd() * 2 - 1) * (HALF - 0.2)
      if (!isWheatSpot(x, z)) continue
      const height = 0.75 + Math.pow(rnd(), 1.4) * 0.85
      const w = 0.8 + rnd() * 0.7
      e.set((rnd() - 0.5) * 0.35, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.35, 'YXZ')
      q.setFromEuler(e)
      p.set(x, 0, z)
      s.set(w, height, w)
      m.compose(p, q, s)
      mesh.current.setMatrixAt(n++, m)
    }
    mesh.current.count = Math.min(n, WHEAT_COUNT[useSceneStore.getState().quality])
    mesh.current.instanceMatrix.needsUpdate = true
  }, [])

  useEffect(() => {
    if (mesh.current) mesh.current.count = Math.min(mesh.current.instanceMatrix.count, WHEAT_COUNT[quality])
  }, [quality])

  useFrame(() => {
    uniforms.uTime.value = env.time
    uniforms.uWind.value = env.windMul
    uniforms.uTint.value.copy(env.palette.wheatTint)
    uniforms.uTintMix.value = env.palette.wheatMix
  })
  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])

  return <instancedMesh ref={mesh} args={[geo, mat, WHEAT_MAX]} frustumCulled={false} receiveShadow />
}
