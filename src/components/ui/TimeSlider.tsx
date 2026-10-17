import { phaseLabel } from '../../systems/dayNight'
import { cameraApi } from '../../systems/cameraRig'
import { useSceneStore } from '../../store/useSceneStore'

function Icon({ t }: { t: number }) {
  // sun → sunset → moon
  if (t > 0.78)
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
    )
  if (t > 0.3)
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 9a5 5 0 0 0-5 5h10a5 5 0 0 0-5-5Zm-9 7h18v2H3v-2Zm8-13h2v3h-2V3ZM4.2 8.6l1.4-1.4 2.1 2.1-1.4 1.4-2.1-2.1Zm15.6 0-2.1 2.1-1.4-1.4 2.1-2.1 1.4 1.4Z" /></svg>
    )
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor" /><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></svg>
  )
}

export function TimeSlider() {
  const t = useSceneStore((s) => s.timeOfDay)
  const set = useSceneStore((s) => s.setTimeOfDay)
  return (
    <label className="time">
      <span className="time__label">
        <Icon t={t} />
        <span>{phaseLabel(t)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={1000}
        value={Math.round(t * 1000)}
        aria-label="Time of day"
        aria-valuetext={phaseLabel(t)}
        onChange={(e) => {
          cameraApi.touch()
          set(Number(e.target.value) / 1000)
        }}
      />
    </label>
  )
}
