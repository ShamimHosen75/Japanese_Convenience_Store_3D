/**
 * World layout shared by roads, wheat placement, ripples and props.
 * Units are scene units. The base is 20 x 20 centred on the origin, top surface at y = 0.
 * +z is the "front" (towards the default camera), the store faces +z.
 */
export const BASE_SIZE = 20
export const HALF = BASE_SIZE / 2

export interface Rect { x0: number; x1: number; z0: number; z1: number }

/** Road A runs east-west along the front, road B north-south on the left (an L corner). */
export const ROAD_A: Rect = { x0: -8, x1: 10, z0: 5, z1: 8 }
export const ROAD_B: Rect = { x0: -8, x1: -5, z0: -10, z1: 8 }
export const ROAD_H = 0.04

/** Concrete pad the store and its forecourt stand on. */
export const PAD: Rect = { x0: -4.5, x1: 6.7, z0: -6.4, z1: 4.88 }
export const PAD_H = 0.05
/** Front part of the pad (in front of the glass) – gets the mirror-like wet reflector. */
export const FORECOURT: Rect = { x0: -4.5, x1: 6.7, z0: -1.1, z1: 4.88 }

export const STORE_POS = { x: 1.2, z: -3.4 }
export const STORE_W = 7
export const STORE_D = 4.6
export const STORE_H = 3.8

/** Utility pole footprints (x, z) – wires run through them in this order. */
export const POLES: [number, number][] = [
  [-9.1, -6.5], [-9.1, -0.8], [-9.2, 6.0], [-3.2, 9.15], [3.4, 9.15], [9.2, 9.15],
]
/** Indices of poles that carry a street light. */
export const LIGHT_POLES = [1, 4]
export const SCARECROW: [number, number] = [8.2, -3.5]
export const MIRROR: [number, number] = [-8.5, 4.0]

/** Where props must keep the wheat out (circles: x, z, radius). */
export const WHEAT_CLEAR: [number, number, number][] = [
  [SCARECROW[0], SCARECROW[1], 0.75],
  [MIRROR[0], MIRROR[1], 0.4],
  ...POLES.map(([x, z]) => [x, z, 0.35] as [number, number, number]),
]

const inRect = (r: Rect, x: number, z: number, m = 0) =>
  x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m

export function isWheatSpot(x: number, z: number): boolean {
  const lim = HALF - 0.25
  if (Math.abs(x) > lim || Math.abs(z) > lim) return false
  if (inRect(ROAD_A, x, z, 0.28) || inRect(ROAD_B, x, z, 0.28)) return false
  if (inRect(PAD, x, z, 0.15)) return false
  for (const [cx, cz, r] of WHEAT_CLEAR) if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return false
  return true
}
export { inRect }
