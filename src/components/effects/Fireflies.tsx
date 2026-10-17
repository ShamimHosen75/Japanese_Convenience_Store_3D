import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial } from 'three'
import vert from '../../shaders/fireflies.vert.glsl?raw'
import frag from '../../shaders/fireflies.frag.glsl?raw'
import { HALF, isWheatSpot } from '../../layout'
import { env } from '../../systems/dayNight'
import { mulberry32 } from '../../utils/rng'

const COUNT = 60

/** ~60 additive glowing points drifting over the wheat, pulsing; visible only at dusk / night. */
export function Fireflies() {
  const ref = useRef<Points>(null!)
  const gl = useThree((s) => s.gl)

  const geo = useMemo(() => {
    const rnd = mulberry32(77)
    const pos = new Float32Array(COUNT * 3)
    const seed = new Float32Array(COUNT * 4)
    let n = 0
    while (n < COUNT) {
      const x = (rnd() * 2 - 1) * (HALF - 0.6), z = (rnd() * 2 - 1) * (HALF - 0.6)
      if (!isWheatSpot(x, z)) continue
      pos.set([x, 0.5 + rnd() * 1.6, z], n * 3)
      seed.set([rnd(), rnd(), rnd(), rnd()], n * 4)
      n++
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new Float32BufferAttribute(seed, 4))
    return g
  }, [])
  const mat = useMemo(
    () => new ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uVis: { value: 0 }, uSize: { value: 0.28 }, uScale: { value: 400 } },
    }),
    [],
  )
  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])

  useFrame(() => {
    const vis = env.fireflies
    ref.current.visible = vis > 0.01
    mat.uniforms.uTime.value = env.time
    mat.uniforms.uVis.value = vis
    mat.uniforms.uScale.value = gl.domElement.height * 0.5
  })

  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} renderOrder={7} />
}
