import { cameraApi } from '../../systems/cameraRig'
import { useSceneStore } from '../../store/useSceneStore'
import { TimeSlider } from './TimeSlider'
import { WeatherToggle } from './WeatherToggle'

/** Minimal glassmorphism bar, bottom centre. */
export function Controls() {
  const playing = useSceneStore((s) => s.tourPlaying)
  const mode = useSceneStore((s) => s.cameraMode)
  const sound = useSceneStore((s) => s.soundOn)
  const setSound = useSceneStore((s) => s.setSound)
  const reduced = useSceneStore((s) => s.reducedMotion)
  const running = playing && mode === 'tour'
  return (
    <div className="dock">
      {mode === 'focus' && (
        <button type="button" className="btn btn--back" onClick={() => cameraApi.leaveFocus()} aria-label="Back to overview">
          ← Back
        </button>
      )}
      <div className="bar" role="group" aria-label="Scene controls">
        <button
          type="button"
          className="btn"
          data-active={running}
          disabled={reduced}
          onClick={() => cameraApi.setPlaying(!playing)}
          aria-label={playing ? 'Pause camera tour' : 'Play camera tour'}
          title={reduced ? 'Auto-tour is disabled because reduced motion is on' : undefined}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
          )}
          <span className="btn__text">{playing ? 'Pause' : 'Tour'}</span>
        </button>
        <TimeSlider />
        <WeatherToggle />
        <button
          type="button"
          className="btn"
          data-active={sound}
          onClick={() => setSound(!sound)}
          aria-label={sound ? 'Turn ambient sound off' : 'Turn ambient sound on'}
          aria-pressed={sound}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4Z" />
            {sound ? <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" d="M16 9a4 4 0 0 1 0 6m2.5-8.5a7.5 7.5 0 0 1 0 11" /> : <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="m16 9 5 6m0-6-5 6" />}
          </svg>
          <span className="btn__text">Sound</span>
        </button>
      </div>
    </div>
  )
}
