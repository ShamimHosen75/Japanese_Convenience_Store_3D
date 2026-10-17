import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Color, Float32BufferAttribute, LineSegments, ShaderMaterial } from 'three'
import vert from '../../shaders/rain.vert.glsl?raw'
import frag from '../../shaders/rain.frag.glsl?raw'
import { env } from '../../systems/dayNight'
import { useSceneStore } from '../../store/useSceneStore'
import { mulberry32 } from '../../utils/rng'

const MAX = 8000
const COUNTS = { high: 8000, low: 3500 }
const HEIGHT = 15
const WHITE = new Color('#ffffff')

/** ~8k GPU rain streaks (LineSegments, all motion in the vertex shader). */
export function Rain() {
  const ref = useRef<LineSegments>(null!)
  const quality = useSceneStore((s) => s.quality)

  const geo = useMemo(() => {
    const rnd = mulberry32(5)
    const seed = new Float32Array(MAX * 2 * 3)
    const end = new Float32Array(MAX * 2)
    for (let i = 0; i < MAX; i++) {
      const sx = rnd(), sy = rnd(), sz = rnd()
      for (let v = 0; v < 2; v++) {
        seed.set([sx, sy, sz], (i * 2 + v) * 3)
        end[i * 2 + v] = v
      }
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(new Float32Array(MAX * 2 * 3), 3))
    g.setAttribute('aSeed', new Float32BufferAttribute(seed, 3))
    g.setAttribute('aEnd', new Float32BufferAttribute(end, 1))
    return g
  }, [])

  const mat = useMemo(
    () => new ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false,
      uniforms: {
        uTime: { value: 0 }, uSpeed: { value: 17 }, uHeight: { value: HEIGHT }, uSlope: { value: 0.16 }, uLen: { value: 0.42 },
        uBox: { value: [26, 26] }, uColor: { value: new Color('#cfe3ff') }, uOpacity: { value: 0 },
      },
    }),
    [],
  )

  useEffect(() => { geo.setDrawRange(0, COUNTS[quality] * 2) }, [geo, quality])
  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])

  useFrame(() => {
    const on = env.rain > 0.01
    ref.current.visible = on
    if (!on) return
    mat.uniforms.uTime.value = env.time
    mat.uniforms.uOpacity.value = env.rain * (0.2 + 0.1 * env.night)
    mat.uniforms.uColor.value.copy(env.palette.skyBottom).lerp(WHITE, 0.55)
  })

  return <lineSegments ref={ref} geometry={geo} material={mat} frustumCulled={false} position={[0, 0, 0]} renderOrder={6} />
}
