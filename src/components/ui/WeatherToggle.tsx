import { useSceneStore, WeatherMode } from '../../store/useSceneStore'

const NEXT: Record<WeatherMode, WeatherMode> = { auto: 'rain', rain: 'clear', clear: 'auto' }
const LABEL: Record<WeatherMode, string> = { auto: 'Auto', rain: 'On', clear: 'Off' }

export function WeatherToggle() {
  const weather = useSceneStore((s) => s.weather)
  const set = useSceneStore((s) => s.setWeather)
  const reduced = useSceneStore((s) => s.reducedMotion)
  return (
    <button
      type="button"
      className="btn"
      data-active={weather === 'rain'}
      disabled={reduced}
      onClick={() => set(NEXT[weather])}
      aria-label={`Rain: ${LABEL[weather]}. Press to change.`}
      title={reduced ? 'Rain is disabled because reduced motion is on' : 'Rain: auto (at night) / on / off'}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path fill="currentColor" d="M7 15a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 17 7.5a3.75 3.75 0 0 1 0 7.5H7Z" />
        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="m8 18-1 3m5-3-1 3m5-3-1 3" />
      </svg>
      <span>Rain {LABEL[weather]}</span>
    </button>
  )
}
