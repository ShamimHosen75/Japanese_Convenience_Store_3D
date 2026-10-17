import { Color, MathUtils, Vector3 } from 'three'

/**
 * Day / night palette system. timeOfDay: 0 day · 0.35 golden hour · 0.5 sunset · 0.7 dusk · 1 night.
 * Every value is interpolated between keyframes with a smoothstep so there are no "jumps"
 * (zero slope at each keyframe = continuous first derivative).
 */
export interface Palette {
  skyTop: Color
  skyBottom: Color
  fog: Color
  sun: Color
  sunIntensity: number
  sunElevation: number // degrees
  sunAzimuth: number // degrees
  ambient: Color
  ambientIntensity: number
  hemiSky: Color
  hemiGround: Color
  hemiIntensity: number
  wheatTint: Color
  wheatMix: number
  cloud: Color
  cloudOpacity: number
  emissive: number
  bloom: number
  stars: number
}

type KeyDef = {
  t: number
  skyTop: string; skyBottom: string; fog: string
  sun: string; sunIntensity: number; sunElevation: number; sunAzimuth: number
  ambient: string; ambientIntensity: number
  hemiSky: string; hemiGround: string; hemiIntensity: number
  wheatTint: string; wheatMix: number
  cloud: string; cloudOpacity: number
  emissive: number; bloom: number; stars: number
}

const KEYS: KeyDef[] = [
  { // day
    t: 0, skyTop: '#86C9F2', skyBottom: '#F3E9D2', fog: '#F3E9D2',
    sun: '#FFF0CC', sunIntensity: 2.7, sunElevation: 58, sunAzimuth: 35,
    ambient: '#FFF6E5', ambientIntensity: 0.22, hemiSky: '#CBE8FF', hemiGround: '#E9D6A6', hemiIntensity: 0.95,
    wheatTint: '#FFFFFF', wheatMix: 0, cloud: '#FFFFFF', cloudOpacity: 1, emissive: 0, bloom: 0, stars: 0,
  },
  { // golden hour
    t: 0.35, skyTop: '#7FB2DE', skyBottom: '#F8D9A2', fog: '#F8D9A2',
    sun: '#FFC27A', sunIntensity: 2.5, sunElevation: 28, sunAzimuth: 55,
    ambient: '#FFE2C0', ambientIntensity: 0.22, hemiSky: '#C9D8F0', hemiGround: '#E8B878', hemiIntensity: 0.8,
    wheatTint: '#FFD9A0', wheatMix: 0.2, cloud: '#FFE3C2', cloudOpacity: 1, emissive: 0, bloom: 0, stars: 0,
  },
  { // sunset
    t: 0.5, skyTop: '#D97A8C', skyBottom: '#F2A97E', fog: '#F2A97E',
    sun: '#FF8F52', sunIntensity: 1.9, sunElevation: 11, sunAzimuth: 68,
    ambient: '#FFB89A', ambientIntensity: 0.3, hemiSky: '#E4A0AE', hemiGround: '#D69A68', hemiIntensity: 0.9,
    wheatTint: '#FFB27A', wheatMix: 0.3, cloud: '#FF9E8A', cloudOpacity: 1, emissive: 0.25, bloom: 0.15, stars: 0,
  },
  { // dusk
    t: 0.7, skyTop: '#3A2B6B', skyBottom: '#6E4378', fog: '#5B3A6E',
    sun: '#A89AE0', sunIntensity: 0.8, sunElevation: 24, sunAzimuth: 95,
    ambient: '#7A6AB0', ambientIntensity: 0.3, hemiSky: '#6A58A8', hemiGround: '#4A3560', hemiIntensity: 0.6,
    wheatTint: '#7A68B0', wheatMix: 0.55, cloud: '#6A4A8A', cloudOpacity: 0.6, emissive: 0.85, bloom: 0.65, stars: 0.35,
  },
  { // night
    t: 1, skyTop: '#0B0D2A', skyBottom: '#1B1F5E', fog: '#14184A',
    sun: '#9FB4FF', sunIntensity: 0.7, sunElevation: 52, sunAzimuth: 130,
    ambient: '#4A55A0', ambientIntensity: 0.24, hemiSky: '#3B4A9A', hemiGround: '#1A1A3A', hemiIntensity: 0.42,
    wheatTint: '#4A4A9A', wheatMix: 0.78, cloud: '#2A2F6A', cloudOpacity: 0, emissive: 1, bloom: 1, stars: 1,
  },
]

const COLOR_KEYS = ['skyTop', 'skyBottom', 'fog', 'sun', 'ambient', 'hemiSky', 'hemiGround', 'wheatTint', 'cloud'] as const
const NUM_KEYS = [
  'sunIntensity', 'sunElevation', 'sunAzimuth', 'ambientIntensity', 'hemiIntensity',
  'wheatMix', 'cloudOpacity', 'emissive', 'bloom', 'stars',
] as const

const KEY_COLORS = KEYS.map((k) => {
  const o: Record<string, Color> = {}
  COLOR_KEYS.forEach((c) => (o[c] = new Color(k[c])))
  return o
})

export function createPalette(): Palette {
  const p = {} as Palette
  COLOR_KEYS.forEach((c) => ((p as unknown as Record<string, Color>)[c] = new Color()))
  NUM_KEYS.forEach((n) => ((p as unknown as Record<string, number>)[n] = 0))
  return p
}

export function samplePalette(t: number, out: Palette): Palette {
  const tt = MathUtils.clamp(t, 0, 1)
  let i = 0
  while (i < KEYS.length - 2 && tt > KEYS[i + 1].t) i++
  const a = KEYS[i], b = KEYS[i + 1]
  const k = MathUtils.smoothstep((tt - a.t) / (b.t - a.t), 0, 1)
  const o = out as unknown as Record<string, Color | number>
  COLOR_KEYS.forEach((c) => (o[c] as Color).lerpColors(KEY_COLORS[i][c], KEY_COLORS[i + 1][c], k))
  NUM_KEYS.forEach((n) => (o[n] = MathUtils.lerp(a[n], b[n], k)))
  return out
}

/** Shared, mutable per-frame state. Scene components read it inside useFrame (no React re-renders). */
export const env = {
  t: 0,
  time: 0,
  palette: createPalette(),
  sunDir: new Vector3(0, 1, 0),
  /** 0..1 store / sign lights – fades in between t = 0.6 and 0.8 */
  lights: 0,
  /** 0..1 night factor */
  night: 0,
  fireflies: 0,
  rain: 0,
  /** 0..1 how wet the ground is (rises quickly with rain, dries slowly) */
  wet: 0,
  /** lights * palette.emissive (0..1) */
  glowN: 0,
  /** uniform shared by every emissive material */
  glow: { value: 0 },
  windMul: 1,
  bloomMul: 1,
}

const GLOW_MAX = 2.6

export function updateEnv(t: number, rainTarget: number, dt: number, time: number) {
  env.t = t
  env.time = time
  samplePalette(t, env.palette)
  const p = env.palette
  const el = MathUtils.degToRad(p.sunElevation)
  const az = MathUtils.degToRad(p.sunAzimuth)
  env.sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize()
  env.lights = MathUtils.smoothstep(t, 0.6, 0.8)
  env.night = MathUtils.smoothstep(t, 0.55, 0.95)
  env.fireflies = MathUtils.smoothstep(t, 0.62, 0.82)
  env.rain += (rainTarget - env.rain) * (1 - Math.exp(-dt * 1.2))
  const wetTarget = env.rain
  const rate = wetTarget > env.wet ? 0.9 : 0.12
  env.wet += (wetTarget - env.wet) * (1 - Math.exp(-dt * rate))
  env.glowN = env.lights * p.emissive
  env.glow.value = env.glowN * GLOW_MAX
}

/** Ground wetness boosted at night (rain on dark asphalt reads glossier). */
export const wetLook = () => env.wet * (0.6 + 0.4 * env.night)

export const PHASE_LABELS: [number, string][] = [
  [0.17, 'Day'], [0.42, 'Golden hour'], [0.6, 'Sunset'], [0.85, 'Dusk'], [1.01, 'Night'],
]
export function phaseLabel(t: number): string {
  for (const [lim, name] of PHASE_LABELS) if (t < lim) return name
  return 'Night'
}
