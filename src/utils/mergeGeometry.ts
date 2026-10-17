import {
  BoxGeometry, BufferGeometry, ColorRepresentation, Color, ConeGeometry, CylinderGeometry,
  Euler, Float32BufferAttribute, Matrix4, Quaternion, SphereGeometry, TorusGeometry, Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

type V3 = [number, number, number]

/**
 * Collects primitives, bakes their transform + a flat vertex colour and merges
 * everything into ONE BufferGeometry (= one draw call). All "block"/"cyl" positions are
 * bottom-centre based, which makes stacking things on the floor easy.
 */
export class GeoBuilder {
  private parts: BufferGeometry[] = []
  private m = new Matrix4()
  private q = new Quaternion()
  private e = new Euler()
  private c = new Color()

  add(src: BufferGeometry, color: ColorRepresentation, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], scale: V3 = [1, 1, 1], lift = 0) {
    const g = src.index ? src.toNonIndexed() : src.clone()
    src.dispose()
    g.deleteAttribute('uv')
    if (lift) g.translate(0, lift, 0)
    this.e.set(rot[0], rot[1], rot[2])
    this.q.setFromEuler(this.e)
    this.m.compose(new Vector3(pos[0], pos[1], pos[2]), this.q, new Vector3(scale[0], scale[1], scale[2]))
    g.applyMatrix4(this.m)
    const n = g.attributes.position.count
    const col = new Float32Array(n * 3)
    this.c.set(color)
    for (let i = 0; i < n; i++) { col[i * 3] = this.c.r; col[i * 3 + 1] = this.c.g; col[i * 3 + 2] = this.c.b }
    g.setAttribute('color', new Float32BufferAttribute(col, 3))
    this.parts.push(g)
    return this
  }

  /** Box, pos = bottom centre. */
  block(size: V3, pos: V3, color: ColorRepresentation, rot: V3 = [0, 0, 0]) {
    return this.add(new BoxGeometry(size[0], size[1], size[2]), color, pos, rot, [1, 1, 1], size[1] / 2)
  }
  /** Cylinder / cone-frustum, pos = bottom centre. */
  cyl(rTop: number, rBottom: number, h: number, pos: V3, color: ColorRepresentation, seg = 14, rot: V3 = [0, 0, 0]) {
    return this.add(new CylinderGeometry(rTop, rBottom, h, seg), color, pos, rot, [1, 1, 1], h / 2)
  }
  cone(r: number, h: number, pos: V3, color: ColorRepresentation, seg = 12, rot: V3 = [0, 0, 0]) {
    return this.add(new ConeGeometry(r, h, seg), color, pos, rot, [1, 1, 1], h / 2)
  }
  /** Sphere (optionally squashed), pos = centre. */
  sphere(r: number, pos: V3, color: ColorRepresentation, scale: V3 = [1, 1, 1], seg = 12) {
    return this.add(new SphereGeometry(r, seg, Math.max(6, Math.round(seg * 0.75))), color, pos, [0, 0, 0], scale)
  }
  torus(R: number, tube: number, pos: V3, color: ColorRepresentation, rot: V3 = [0, 0, 0], seg = 18) {
    return this.add(new TorusGeometry(R, tube, 6, seg), color, pos, rot)
  }

  /** Cylinder between two arbitrary points (frames, arms, poles…). */
  tube(a: V3, b: V3, r: number, color: ColorRepresentation, seg = 6, rTop = r) {
    const A = new Vector3(...a), B = new Vector3(...b)
    const dir = B.clone().sub(A)
    const len = dir.length()
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize())
    const e = new Euler().setFromQuaternion(q)
    const mid = A.add(B).multiplyScalar(0.5)
    return this.add(new CylinderGeometry(rTop, r, len, seg), color, [mid.x, mid.y, mid.z], [e.x, e.y, e.z])
  }

  build(): BufferGeometry {
    if (!this.parts.length) return new BufferGeometry()
    const g = mergeGeometries(this.parts, false)
    this.parts.forEach((p) => p.dispose())
    this.parts = []
    g.computeBoundingBox()
    g.computeBoundingSphere()
    return g
  }
}
