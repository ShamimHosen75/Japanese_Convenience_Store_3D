import { Suspense, lazy, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useFrame, useThree } from '@react-three/fiber'
import { env } from '../systems/dayNight'
import { useSceneStore } from '../store/useSceneStore'
import { cameraApi } from '../systems/cameraRig'

const Perf = lazy(() => import('r3f-perf').then((m) => ({ default: () => <m.Perf position="top-left" minimal /> })))

/** DEV only: exposes live stats (fps, draw calls, GPU memory) on window.__qa for the QA scripts. */
export default function DevTools() {
  const { gl } = useThree()
  const acc = useRef({ frames: 0, t0: performance.now() })
  useEffect(() => {
    gl.info.autoReset = false
    const w = window as unknown as Record<string, unknown>
    w.__store = useSceneStore
    w.__env = env
    w.__gl = gl
    w.__cam = cameraApi
    // headless/software rendering can be ~1 fps: let gsap keep real time so tweens still finish
    if (new URLSearchParams(location.search).has('qa')) gsap.ticker.lagSmoothing(0)
    return () => { gl.info.autoReset = true }
  }, [gl])
  useFrame(() => {
    const w = window as unknown as { __qa?: Record<string, number> }
    const a = acc.current
    // the previous frame's totals (composer passes + shadow + reflector are all included)
    const info = gl.info
    w.__qa = {
      ...(w.__qa ?? {}),
      calls: info.render.calls, triangles: info.render.triangles,
      geometries: info.memory.geometries, textures: info.memory.textures, programs: info.programs?.length ?? 0,
    }
    info.reset()
    a.frames++
    const now = performance.now()
    if (now - a.t0 >= 1000) {
      w.__qa!.fps = Math.round((a.frames * 1000) / (now - a.t0))
      a.frames = 0
      a.t0 = now
    }
  }, -100)
  // r3f-perf overlay (fps / draw calls / memory): add ?perf to the URL
  return new URLSearchParams(location.search).has('perf') ? (
    <Suspense fallback={null}>
      <Perf />
    </Suspense>
  ) : null
}
