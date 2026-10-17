import { DoubleSide, MeshLambertMaterial, MeshStandardMaterial } from 'three'
import { env } from '../systems/dayNight'

/**
 * Shared singleton materials. All merged geometry uses vertex colours, so a handful of
 * materials covers the whole diorama (keeps draw calls + shader programs low).
 */
let body: MeshLambertMaterial | null = null
let glow: MeshLambertMaterial | null = null
let glass: MeshStandardMaterial | null = null

/** Flat, toy-like, soft-shaded vertex-colour material. */
export function bodyMaterial() {
  if (!body) body = new MeshLambertMaterial({ vertexColors: true })
  return body
}

/**
 * Same as body, but vertex colour is ALSO added as emissive light, scaled by the shared
 * `env.glow` uniform – so every lamp, screen, vending front and fridge door in the
 * diorama fades in together between t = 0.6 and 0.8 and feeds the bloom pass.
 */
export function glowMaterial() {
  if (!glow) {
    glow = new MeshLambertMaterial({ vertexColors: true })
    glow.onBeforeCompile = (shader) => {
      shader.uniforms.uGlow = env.glow
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uGlow;')
        .replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor.rgb * uGlow;',
        )
    }
    glow.customProgramCacheKey = () => 'konbini-glow'
  }
  return glow
}

export function glassMaterial() {
  if (!glass) {
    glass = new MeshStandardMaterial({
      color: '#bfe6ff', roughness: 0.08, metalness: 0.0, transparent: true, opacity: 0.12,
      depthWrite: false, side: DoubleSide,
    })
  }
  return glass
}
