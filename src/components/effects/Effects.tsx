import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { env } from '../../systems/dayNight'

/**
 * Bloom (strength follows the palette → effectively night only; threshold keeps it on the
 * HDR emissives), subtle vignette, ACES filmic tone mapping and SMAA. Output is sRGB.
 */
export function Effects() {
  const bloom = useRef<{ intensity: number } | null>(null)
  useFrame(() => {
    if (bloom.current) bloom.current.intensity = env.palette.bloom * 1.25 * env.bloomMul
  })
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom ref={bloom as never} mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} radius={0.72} intensity={0} />
      <Vignette offset={0.3} darkness={0.5} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
    </EffectComposer>
  )
}
