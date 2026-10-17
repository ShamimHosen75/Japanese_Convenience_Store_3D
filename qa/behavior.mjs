// Behaviour + memory QA: drag pauses tour / resumes after 6 s, click store -> close-up, click empty -> back, 5 tour loops.
import { chromium } from 'playwright-core'
const base = process.env.BASE || 'http://localhost:5173/'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--enable-precise-memory-info'],
})
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } })
const logs = []
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto(base + '?q=low&qa=1')
await page.waitForFunction(() => window.__store?.getState().ready, null, { timeout: 120000 })
const mode = () => page.evaluate(() => window.__store.getState().cameraMode)
const out = {}
await page.waitForTimeout(1500)
out.start = await mode()
await page.mouse.move(500, 300); await page.mouse.down(); await page.mouse.move(560, 320, { steps: 4 }); await page.mouse.up()
await page.waitForTimeout(800)
out.afterDrag = await mode()
await page.waitForTimeout(7500)
out.after7sIdle = await mode()
// click the store
await page.evaluate(() => window.__cam.focusStore())
await page.waitForTimeout(3500)
out.afterFocus = await mode()
await page.evaluate(() => window.__cam.missed())
await page.waitForTimeout(3500)
out.afterMissed = await mode()
// 5 loops
await page.evaluate(() => window.__cam.setPlaying(true))
await page.waitForTimeout(2500)
const snap = () => page.evaluate(() => ({ ...window.__qa, heapMB: Math.round(performance.memory.usedJSHeapSize / 1e6), tod: window.__store.getState().timeOfDay }))
out.before = await snap()
await page.evaluate(() => { window.__tour.timeScale(40) })
// let time fly: 5 loops x 50 s / 40
await page.waitForTimeout(9000)
const loops = await page.evaluate(() => Math.floor(window.__tour.totalTime() / 50))
await page.evaluate(() => window.__tour.timeScale(1))
await page.waitForTimeout(1500)
out.loops = loops
out.after = await snap()
console.log(JSON.stringify({ out, logs: [...new Set(logs)] }, null, 1))
await browser.close()
