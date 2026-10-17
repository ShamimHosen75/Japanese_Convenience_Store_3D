import gsap from 'gsap'
import { STORE_D, STORE_POS } from '../layout'

/**
 * Camera choreography. The ~50 s loopable tour is a single gsap timeline that animates the
 * plain `tour` object (orbit angle, radius, height, look-at target) AND the time of day, so
 * camera and light stay perfectly in sync. CameraRig.tsx applies it to the real camera.
 */
export const TOUR_DURATION = 50
export const IDLE_RESUME_MS = 6000

export interface TourState {
  theta: number // azimuth, 0 = looking from +z (the store's front)
  radius: number // horizontal distance from the target
  height: number // absolute camera height
  tx: number
  ty: number
  tz: number
  tod: number // time of day driven by the tour
}

export const TOUR_START: TourState = { theta: -0.9, radius: 34, height: 15, tx: 0, ty: 0.6, tz: 0, tod: 0 }
export const tour: TourState = { ...TOUR_START }

/** Centre of the glass facade, where the dolly-in ends. */
export const STORE_FRONT = { x: STORE_POS.x, y: 1.9, z: STORE_POS.z + STORE_D / 2 - 0.6 }

/** Default 3/4 overview pose, used by "click empty space → back". */
export const OVERVIEW = { pos: [19.5, 15.5, 27.5] as [number, number, number], target: [0, 0.5, 0] as [number, number, number] }
/** Storefront close-up used by "click the store". */
export const CLOSEUP = {
  pos: [STORE_POS.x + 2.2, 2.3, STORE_POS.z + STORE_D / 2 + 6.6] as [number, number, number],
  target: [STORE_POS.x, 1.9, STORE_POS.z + STORE_D / 2 - 0.9] as [number, number, number],
}

/** Phones in portrait must stand further back to keep the whole diorama in view. */
export function fitFactor(aspect: number) {
  return Math.min(2.1, Math.max(1, Math.sqrt(2.1 / aspect)))
}

/** OVERVIEW pose pushed back for narrow screens. */
export function overviewPose(aspect: number) {
  const f = fitFactor(aspect)
  const [tx, ty, tz] = OVERVIEW.target
  const [x, y, z] = OVERVIEW.pos
  return { pos: [tx + (x - tx) * f, ty + (y - ty) * f, tz + (z - tz) * f] as [number, number, number], target: OVERVIEW.target }
}

export function buildTourTimeline(): gsap.core.Timeline {
  Object.assign(tour, TOUR_START)
  const T = tour
  const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: 'none' } })

  // 0–34 s: continuous orbit while the day turns to sunset, dusk and rainy night
  tl.to(T, { theta: 4.4, duration: 34 }, 0)
  tl.to(T, { radius: 30, height: 12.5, duration: 17, ease: 'sine.inOut' }, 0)
  tl.to(T, { radius: 34, height: 15, duration: 17, ease: 'sine.inOut' }, 17)
  tl.to(T, { tod: 0.35, duration: 11, ease: 'sine.inOut' }, 0)
  tl.to(T, { tod: 0.55, duration: 10, ease: 'sine.inOut' }, 11)
  tl.to(T, { tod: 1, duration: 12, ease: 'sine.inOut' }, 21)

  // 34–41 s: dolly in to the storefront glass, 41–43.5 s hold with a slow drift
  tl.to(T, { theta: 6.4, radius: 8.5, height: 2.3, tx: STORE_FRONT.x, ty: STORE_FRONT.y, tz: STORE_FRONT.z, duration: 7, ease: 'power2.inOut' }, 34)
  tl.to(T, { theta: 6.52, duration: 2.5, ease: 'sine.inOut' }, 41)

  // 43.5–50 s: pull back out, dawn returns so the loop restarts in daylight.
  // 5.38 - 2π ≈ -0.90, so the orbit angle is seamless across the loop point.
  tl.to(T, { theta: 5.38, radius: 34, height: 15, tx: 0, ty: 0.6, tz: 0, tod: 0, duration: 6.5, ease: 'power2.inOut' }, 43.5)
  return tl
}

/** Imperative hooks the scene/UI call; assigned by <CameraRig/> once it mounts. */
export const cameraApi = {
  focusStore: () => {},
  leaveFocus: () => {},
  /** click on empty canvas */
  missed: () => {},
  /** the user touched something else that should pause the tour (e.g. the time slider) */
  touch: () => {},
  setPlaying: (_v: boolean) => {},
}
