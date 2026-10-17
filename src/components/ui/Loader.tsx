import { useEffect, useState } from 'react'
import { STORE_NAME } from '../../config'
import { useSceneStore } from '../../store/useSceneStore'

export function Loader() {
  const progress = useSceneStore((s) => s.progress)
  const ready = useSceneStore((s) => s.ready)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    if (!ready) return
    const id = window.setTimeout(() => setGone(true), 900)
    return () => window.clearTimeout(id)
  }, [ready])
  if (gone) return null
  const pct = Math.round(progress * 100)
  return (
    <div className="loader" data-done={ready} role="progressbar" aria-label="Loading scene" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className="loader__logo" aria-hidden="true">{STORE_NAME.charAt(0).toUpperCase()}</div>
      <p className="loader__name">{STORE_NAME}</p>
      <div className="loader__track"><div className="loader__fill" style={{ transform: `scaleX(${progress})` }} /></div>
      <p className="loader__pct">{pct}%</p>
    </div>
  )
}
