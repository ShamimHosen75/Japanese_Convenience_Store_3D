import { Suspense, lazy, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { STORE_NAME } from './config'
import { Scene } from './components/Scene'
import { Controls } from './components/ui/Controls'
import { Loader } from './components/ui/Loader'
import { cameraApi, TOUR_START } from './systems/cameraRig'
import { forcedQuality, useSceneStore } from './store/useSceneStore'

// dev-only tooling: stripped from production builds (import.meta.env.DEV is a build-time constant)
const DevTools = import.meta.env.DEV ? lazy(() => import('./components/DevTools')) : null
const DebugPanel = import.meta.env.DEV ? lazy(() => import('./components/ui/DebugPanel')) : null

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

export default function App() {
  const quality = useSceneStore((s) => s.quality)
  const mobile = useSceneStore((s) => s.mobile)
  const setQuality = useSceneStore((s) => s.setQuality)
  const webgl = useMemo(hasWebGL, [])

  if (!webgl) {
    return (
      <main className="fallback">
        <h1>{STORE_NAME}</h1>
        <p>This interactive 3D diorama needs WebGL, which isn’t available in this browser. Try opening the page in Chrome, Safari or Firefox.</p>
      </main>
    )
  }

  const dprMax = mobile ? 1.5 : 2
  const p = TOUR_START
  const start: [number, number, number] = [Math.sin(p.theta) * p.radius, p.height, Math.cos(p.theta) * p.radius]
  return (
    <main className="app">
      <h1 className="sr-only">{STORE_NAME} – interactive miniature 3D diorama of a Japanese convenience store</h1>
      <Canvas
        shadows="soft"
        flat
        dpr={quality === 'high' ? [1, dprMax] : [1, mobile ? 1.5 : 1.25]}
        gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false }}
        camera={{ fov: 38, near: 0.1, far: 400, position: start }}
        onPointerMissed={() => cameraApi.missed()}
        role="img"
        aria-label={`Interactive 3D miniature of the ${STORE_NAME} convenience store. Drag to orbit, scroll or pinch to zoom, click the store for a close-up.`}
      >
        {!forcedQuality && (
          <PerformanceMonitor
            flipflops={3}
            onDecline={() => setQuality('low')}
            onIncline={() => !mobile && setQuality('high')}
            onFallback={() => setQuality('low')}
          />
        )}
        <Scene />
        {DevTools && (
          <Suspense fallback={null}>
            <DevTools />
          </Suspense>
        )}
      </Canvas>
      <Controls />
      <Loader />
      {DebugPanel && (
        <Suspense fallback={null}>
          <DebugPanel />
        </Suspense>
      )}
    </main>
  )
}
