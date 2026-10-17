import { useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Base } from './scene/Base'
import { Roads } from './scene/Roads'
import { Wheat } from './scene/Wheat'
import { Store } from './scene/Store'
import { Props } from './scene/Props'
import { UtilityPoles } from './scene/UtilityPoles'
import { Clouds } from './scene/Clouds'
import { Lighting } from './scene/Lighting'
import { Sky } from './effects/Sky'
import { Rain } from './effects/Rain'
import { Puddles } from './effects/Puddles'
import { Fireflies } from './effects/Fireflies'
import { Effects } from './effects/Effects'
import { CameraRig } from './CameraRig'
import { useSceneStore } from '../store/useSceneStore'

/** Parts are mounted one per frame so the loader can show real progress while geometry is built. */
const STAGES = [Base, Roads, Wheat, Store, Props, UtilityPoles, Clouds, Rain, Puddles, Fireflies]

export function Scene() {
  const [n, setN] = useState(0)
  const [frames, setFrames] = useState(0)
  const setProgress = useSceneStore((s) => s.setProgress)
  const setReady = useSceneStore((s) => s.setReady)

  useEffect(() => {
    if (n >= STAGES.length) return
    const id = requestAnimationFrame(() => {
      setN(n + 1)
      setProgress((n + 1) / (STAGES.length + 1))
    })
    return () => cancelAnimationFrame(id)
  }, [n, setProgress])

  // a few frames after the last part: shaders compiled, first image on screen
  useFrame(() => {
    if (n >= STAGES.length && frames < 4) {
      setFrames(frames + 1)
      if (frames === 3) {
        setProgress(1)
        setReady()
      }
    }
  })

  return (
    <>
      <CameraRig />
      <Lighting />
      <Sky />
      {STAGES.slice(0, n).map((Part, i) => (
        <Part key={i} />
      ))}
      <Effects />
    </>
  )
}
