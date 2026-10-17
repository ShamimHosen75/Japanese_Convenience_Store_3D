import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useSceneStore } from '../store/useSceneStore'
import {
  CLOSEUP, IDLE_RESUME_MS, buildTourTimeline, cameraApi, fitFactor, overviewPose, tour,
} from '../systems/cameraRig'

const _p = new Vector3()
const _t = new Vector3()

/** Auto-tour, orbit controls, storefront fly-in and the 6 s idle-resume logic. */
export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null!)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const idle = useRef<number | undefined>(undefined)
  const flight = useRef<gsap.core.Tween | null>(null)
  // blend used to ease back into the tour after user interaction
  const blend = useRef({ v: 1, fromPos: new Vector3(), fromTarget: new Vector3(), fromTod: 0 })
  const lastTod = useRef(-1)
  const aspectRef = useRef(size.width / Math.max(1, size.height))
  aspectRef.current = size.width / Math.max(1, size.height)

  useEffect(() => {
    const st = useSceneStore.getState
    const c = controls.current
    const timeline = buildTourTimeline()
    tl.current = timeline
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__tour = timeline

    const clearIdle = () => {
      if (idle.current !== undefined) window.clearTimeout(idle.current)
      idle.current = undefined
    }
    const startTour = (smooth: boolean) => {
      if (st().reducedMotion) return
      clearIdle()
      if (smooth) {
        blend.current.fromPos.copy(camera.position)
        blend.current.fromTarget.copy(c.target)
        blend.current.fromTod = st().timeOfDay
        blend.current.v = 0
        gsap.to(blend.current, { v: 1, duration: 1.8, ease: 'power2.inOut', overwrite: true })
      } else blend.current.v = 1
      st().setCameraMode('tour')
      timeline.play()
    }
    const pauseTour = () => {
      timeline.pause()
      if (st().cameraMode === 'tour') st().setCameraMode('free')
    }
    const scheduleResume = () => {
      clearIdle()
      idle.current = window.setTimeout(() => {
        if (st().tourPlaying && st().cameraMode === 'free') startTour(true)
      }, IDLE_RESUME_MS)
    }
    const fly = (pos: readonly [number, number, number], target: readonly [number, number, number], done?: () => void) => {
      flight.current?.kill()
      c.enabled = false
      const tgt = { x: c.target.x, y: c.target.y, z: c.target.z, px: camera.position.x, py: camera.position.y, pz: camera.position.z }
      flight.current = gsap.to(tgt, {
        x: target[0], y: target[1], z: target[2], px: pos[0], py: pos[1], pz: pos[2], duration: 2.4, ease: 'power3.inOut',
        onUpdate: () => {
          c.target.set(tgt.x, tgt.y, tgt.z)
          camera.position.set(tgt.px, tgt.py, tgt.pz)
          camera.lookAt(c.target)
        },
        onComplete: () => {
          c.enabled = true
          flight.current = null
          done?.()
        },
      })
    }

    cameraApi.focusStore = () => {
      if (st().cameraMode === 'focus' && flight.current) return
      clearIdle()
      timeline.pause()
      blend.current.v = 1
      st().setCameraMode('focus')
      c.minDistance = 1.5
      fly(CLOSEUP.pos, CLOSEUP.target)
    }
    cameraApi.leaveFocus = () => {
      if (st().cameraMode !== 'focus') return
      st().setCameraMode('free')
      c.minDistance = 3
      const o = overviewPose(aspectRef.current)
      fly(o.pos, o.target, scheduleResume)
    }
    cameraApi.missed = () => {
      if (st().cameraMode === 'focus') cameraApi.leaveFocus()
    }
    cameraApi.touch = () => {
      if (st().cameraMode === 'tour') pauseTour()
      if (st().cameraMode === 'free') scheduleResume()
    }
    cameraApi.setPlaying = (v) => {
      st().setTourPlaying(v)
      if (v) {
        if (st().cameraMode === 'focus') cameraApi.leaveFocus()
        else startTour(true)
      } else {
        clearIdle()
        pauseTour()
      }
    }

    const onStart = () => {
      clearIdle()
      if (st().cameraMode === 'tour') pauseTour()
    }
    const onEnd = () => {
      if (st().cameraMode === 'free') scheduleResume()
    }
    c.addEventListener('start', onStart)
    c.addEventListener('end', onEnd)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cameraApi.leaveFocus()
    }
    window.addEventListener('keydown', onKey)

    if (st().reducedMotion || !st().tourPlaying) {
      st().setCameraMode('free')
      const o = overviewPose(aspectRef.current)
      camera.position.set(...o.pos)
      c.target.set(...o.target)
      camera.lookAt(c.target)
    } else startTour(false)

    return () => {
      c.removeEventListener('start', onStart)
      c.removeEventListener('end', onEnd)
      window.removeEventListener('keydown', onKey)
      clearIdle()
      flight.current?.kill()
      timeline.kill()
      cameraApi.focusStore = cameraApi.leaveFocus = cameraApi.missed = cameraApi.touch = () => {}
      cameraApi.setPlaying = () => {}
    }
  }, [camera])

  useFrame(() => {
    const st = useSceneStore.getState()
    if (st.cameraMode !== 'tour') return
    const c = controls.current
    // phones in portrait need to stand further back to keep the whole diorama in view
    const aspect = size.width / Math.max(1, size.height)
    const fit = fitFactor(aspect)
    const scale = 1 + (fit - 1) * MathUtils.smoothstep(tour.radius, 9, 28)
    _t.set(tour.tx, tour.ty, tour.tz)
    const r = tour.radius * scale
    _p.set(tour.tx + Math.sin(tour.theta) * r, tour.ty + (tour.height - tour.ty) * scale, tour.tz + Math.cos(tour.theta) * r)
    const b = blend.current
    let tod = tour.tod
    if (b.v < 1) {
      const k = b.v
      _p.lerpVectors(b.fromPos, _p, k)
      _t.lerpVectors(b.fromTarget, _t, k)
      tod = MathUtils.lerp(b.fromTod, tour.tod, k)
    }
    camera.position.copy(_p)
    c.target.copy(_t)
    camera.lookAt(_t)
    if (Math.abs(tod - lastTod.current) > 1e-4) {
      lastTod.current = tod
      st.setTimeOfDay(tod)
    }
  })

  return (
    <OrbitControls
      ref={controls as never}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      enablePan={false}
      minDistance={3}
      maxDistance={95}
      minPolarAngle={0.12}
      maxPolarAngle={1.55}
      target={[0, 0.6, 0]}
    />
  )
}
