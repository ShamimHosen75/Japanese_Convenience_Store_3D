import { create } from 'zustand'

export type WeatherMode = 'auto' | 'rain' | 'clear'
export type CameraMode = 'tour' | 'free' | 'focus'
export type Quality = 'high' | 'low'

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
export const isMobile =
  typeof navigator !== 'undefined' &&
  (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches))

/** Deep-link / QA params: ?t=0.8&rain=1&q=low&tour=0 */
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
export const forcedQuality = (params.get('q') as Quality | null) === 'high' || params.get('q') === 'low' ? (params.get('q') as Quality) : null
const initialT = params.has('t') ? Math.min(1, Math.max(0, Number(params.get('t')) || 0)) : 0
const initialRain: WeatherMode = params.get('rain') === '1' ? 'rain' : params.get('rain') === '0' ? 'clear' : 'auto'
const tourOff = params.get('tour') === '0' || params.has('t')

interface SceneState {
  /** 0 = day, 0.35 golden hour, 0.5 sunset, 0.7 dusk, 1 = night */
  timeOfDay: number
  weather: WeatherMode
  cameraMode: CameraMode
  /** the user's wish: is the cinematic tour running (or allowed to resume)? */
  tourPlaying: boolean
  soundOn: boolean
  quality: Quality
  reducedMotion: boolean
  mobile: boolean
  /** loader progress 0..1 and "first frame drawn" flag */
  progress: number
  ready: boolean
  setTimeOfDay: (t: number) => void
  setWeather: (w: WeatherMode) => void
  setCameraMode: (m: CameraMode) => void
  setTourPlaying: (v: boolean) => void
  setSound: (v: boolean) => void
  setQuality: (q: Quality) => void
  setProgress: (p: number) => void
  setReady: () => void
}

export const useSceneStore = create<SceneState>((set) => ({
  timeOfDay: initialT,
  weather: initialRain,
  cameraMode: 'tour',
  tourPlaying: !prefersReducedMotion && !tourOff,
  soundOn: false,
  quality: forcedQuality ?? (isMobile ? 'low' : 'high'),
  reducedMotion: !!prefersReducedMotion,
  mobile: isMobile,
  progress: 0,
  ready: false,
  setTimeOfDay: (t) => set({ timeOfDay: Math.min(1, Math.max(0, t)) }),
  setWeather: (weather) => set({ weather }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  setTourPlaying: (tourPlaying) => set({ tourPlaying }),
  setSound: (soundOn) => set({ soundOn }),
  setQuality: (quality) => set({ quality }),
  setProgress: (progress) => set({ progress }),
  setReady: () => set({ ready: true }),
}))

/** Rain is on if forced, or in "auto" once night has fallen. */
export function wantsRain(weather: WeatherMode, t: number, reduced: boolean): boolean {
  if (reduced) return false
  if (weather === 'rain') return true
  if (weather === 'auto') return t > 0.72
  return false
}
