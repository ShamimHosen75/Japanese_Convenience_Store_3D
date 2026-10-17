import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AmbientLight, Color, DirectionalLight, Fog, HemisphereLight } from 'three'
import { env, updateEnv } from '../../systems/dayNight'
import { useSceneStore, wantsRain } from '../../store/useSceneStore'
import { setAmbience } from '../../utils/ambience'

const SUN_DISTANCE = 45

/**
 * Drives the whole day/night system: each frame it advances `env` (palette, lights, rain,
 * wetness) from the store and applies it to the sun/moon, ambient, hemisphere and fog.
 */
export function Lighting() {
  const sun = useRef<DirectionalLight>(null!)
  const hemi = useRef<HemisphereLight>(null!)
  const amb = useRef<AmbientLight>(null!)
  const scene = useThree((s) => s.scene)
  const quality = useSceneStore((s) => s.quality)
  const soundTimer = useRef(0)

  useEffect(() => {
    scene.fog = new Fog(new Color('#ffffff'), 42, 130)
    scene.background = new Color('#F3E9D2')
    return () => {
      scene.fog = null
      scene.background = null
    }
  }, [scene])

  useFrame((state, delta) => {
    const st = useSceneStore.getState()
    const dt = Math.min(delta, 0.1)
    const rainTarget = wantsRain(st.weather, st.timeOfDay, st.reducedMotion) ? 1 : 0
    updateEnv(st.timeOfDay, rainTarget, dt, state.clock.elapsedTime)
    const p = env.palette

    sun.current.color.copy(p.sun)
    sun.current.intensity = p.sunIntensity
    sun.current.position.copy(env.sunDir).multiplyScalar(SUN_DISTANCE)
    hemi.current.color.copy(p.hemiSky)
    hemi.current.groundColor.copy(p.hemiGround)
    hemi.current.intensity = p.hemiIntensity
    amb.current.color.copy(p.ambient)
    amb.current.intensity = p.ambientIntensity

    const fog = scene.fog as Fog
    fog.color.copy(p.fog)
    ;(scene.background as Color).copy(p.skyBottom)

    soundTimer.current += dt
    if (soundTimer.current > 0.25) {
      soundTimer.current = 0
      setAmbience(st.soundOn, env.rain, env.night)
    }
  }, -10)

  const mapSize = quality === 'high' ? 2048 : 1024
  return (
    <>
      <ambientLight ref={amb} />
      <hemisphereLight ref={hemi} />
      <directionalLight
        key={mapSize}
        ref={sun}
        castShadow
        shadow-mapSize={[mapSize, mapSize]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={4}
        shadow-camera-far={110}
        shadow-bias={-0.0006}
        shadow-normalBias={0.05}
        shadow-radius={3}
      />
    </>
  )
}
