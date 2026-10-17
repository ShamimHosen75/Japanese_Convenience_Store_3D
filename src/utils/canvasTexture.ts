import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three'

const FONT = '"Hiragino Sans","Noto Sans JP","Yu Gothic","Segoe UI",system-ui,sans-serif'

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d')! }
}

function toTexture(canvas: HTMLCanvasElement, aniso = 8) {
  const t = new CanvasTexture(canvas)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = aniso
  t.minFilter = LinearFilter
  t.generateMipmaps = false
  t.needsUpdate = true
  return t
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Front banner: shop name + "24H OPEN". */
export function bannerTexture(name: string, tagline: string, jp: string) {
  const { canvas, ctx } = makeCanvas(2048, 280)
  ctx.fillStyle = '#14663d'
  ctx.fillRect(0, 0, 2048, 280)
  // stripes
  ctx.fillStyle = '#1aa35b'
  ctx.fillRect(0, 0, 2048, 22)
  ctx.fillStyle = '#f58220'
  ctx.fillRect(0, 22, 2048, 12)
  ctx.fillStyle = '#1aa35b'
  ctx.fillRect(0, 246, 2048, 34)
  ctx.fillStyle = '#f58220'
  ctx.fillRect(0, 238, 2048, 8)
  // name
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 150px ${FONT}`
  ctx.textAlign = 'left'
  ctx.fillText(name.toUpperCase(), 90, 138)
  const nameW = ctx.measureText(name.toUpperCase()).width
  // tagline pill
  const px = 90 + nameW + 70
  const pw = 2048 - px - 90
  ctx.fillStyle = '#f58220'
  roundRect(ctx, px, 62, pw, 150, 75)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.font = `800 82px ${FONT}`
  ctx.fillText(tagline, px + pw / 2, 118)
  ctx.font = `600 38px ${FONT}`
  ctx.fillStyle = '#fff4e0'
  ctx.fillText(jp, px + pw / 2, 176)
  return toTexture(canvas)
}

/** Round orange logo for the tall pole sign (plus a rectangular name plate underneath). */
export function logoTexture(name: string) {
  const { canvas, ctx } = makeCanvas(512, 640)
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, 0, 0, 512, 640, 54)
  ctx.fill()
  ctx.fillStyle = '#1aa35b'
  roundRect(ctx, 14, 14, 484, 612, 44)
  ctx.fill()
  // circle logo
  ctx.fillStyle = '#f58220'
  ctx.beginPath(); ctx.arc(256, 238, 190, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.arc(256, 238, 150, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#f58220'
  ctx.font = `900 200px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name.charAt(0).toUpperCase(), 256, 252)
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 78px ${FONT}`
  ctx.fillText(name.toUpperCase(), 256, 545)
  return toTexture(canvas)
}

export interface PosterDef { title: string; sub: string; bg: string; fg: string; accent: string }
export const POSTERS: PosterDef[] = [
  { title: 'Fresh coffee', sub: '¥100', bg: '#fff3d6', fg: '#5a3418', accent: '#d9822b' },
  { title: 'おにぎり', sub: 'Rice balls ¥120', bg: '#e8f6ea', fg: '#14663d', accent: '#1aa35b' },
  { title: 'Hot snacks', sub: 'Fried chicken ¥180', bg: '#ffe4df', fg: '#a02a1e', accent: '#e8503a' },
  { title: 'ATM', sub: 'Open 24 hours', bg: '#e3effc', fg: '#1d4a86', accent: '#2f6fd6' },
]

/** 2x2 atlas of window posters. Each cell is 512x640. */
export function posterAtlasTexture() {
  const cw = 512, ch = 640
  const { canvas, ctx } = makeCanvas(cw * 2, ch * 2)
  POSTERS.forEach((p, i) => {
    const ox = (i % 2) * cw, oy = Math.floor(i / 2) * ch
    ctx.fillStyle = p.bg
    ctx.fillRect(ox, oy, cw, ch)
    ctx.fillStyle = p.accent
    ctx.fillRect(ox, oy, cw, 70)
    ctx.fillRect(ox, oy + ch - 40, cw, 40)
    ctx.strokeStyle = p.accent
    ctx.lineWidth = 14
    ctx.strokeRect(ox + 7, oy + 7, cw - 14, ch - 14)
    ctx.fillStyle = p.fg
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `800 ${p.title.length > 8 ? 78 : 96}px ${FONT}`
    ctx.fillText(p.title, ox + cw / 2, oy + 250)
    ctx.font = `700 54px ${FONT}`
    ctx.fillText(p.sub, ox + cw / 2, oy + 380)
    // little steam / cup motif
    ctx.fillStyle = p.accent
    ctx.beginPath(); ctx.arc(ox + cw / 2, oy + 500, 46, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = p.bg
    ctx.beginPath(); ctx.arc(ox + cw / 2, oy + 500, 26, 0, Math.PI * 2); ctx.fill()
  })
  return toTexture(canvas)
}

/** Soft radial blob used for the floating contact shadow and light pools. */
export function radialTexture(inner: string, outer: string, size = 256) {
  const { canvas, ctx } = makeCanvas(size, size)
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, inner)
  g.addColorStop(1, outer)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const t = toTexture(canvas, 1)
  return t
}

/** Octagonal red STOP sign with transparent corners (used with alphaTest). */
export function stopTexture() {
  const { canvas, ctx } = makeCanvas(256, 256)
  const oct = (r: number) => {
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i + Math.PI / 8
      const x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y)
    }
    ctx.closePath()
  }
  ctx.fillStyle = '#ffffff'; oct(126); ctx.fill()
  ctx.fillStyle = '#d4262c'; oct(110); ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 70px ${FONT}`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('STOP', 128, 112)
  ctx.font = `700 34px ${FONT}`
  ctx.fillText('止まれ', 128, 172)
  return toTexture(canvas)
}
