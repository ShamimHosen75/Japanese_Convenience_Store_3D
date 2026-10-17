import { Leva, useControls } from 'leva'
import { env } from '../../systems/dayNight'
import { cameraApi } from '../../systems/cameraRig'
import { useSceneStore } from '../../store/useSceneStore'

/** DEV only (leva): never part of the production bundle. */
export default function DebugPanel() {
  const hidden = new URLSearchParams(location.search).has('qa')
  const st = useSceneStore.getState()
  useControls('Time', {
    timeOfDay: { value: st.timeOfDay, min: 0, max: 1, step: 0.001, onChange: (v: number) => { if (v !== useSceneStore.getState().timeOfDay) { cameraApi.touch(); st.setTimeOfDay(v) } } },
  })
  useControls('Scene', {
    wind: { value: 1, min: 0, max: 3, step: 0.05, onChange: (v: number) => (env.windMul = v) },
    bloom: { value: 1, min: 0, max: 3, step: 0.05, onChange: (v: number) => (env.bloomMul = v) },
    quality: { value: st.quality, options: ['high', 'low'], onChange: (v: 'high' | 'low') => st.setQuality(v) },
    weather: { value: st.weather, options: ['auto', 'rain', 'clear'], onChange: (v: 'auto' | 'rain' | 'clear') => st.setWeather(v) },
  })
  return <Leva hidden={hidden} collapsed titleBar={{ title: 'debug' }} />
}
