// Mobile emulation: portrait + landscape screenshots, touch orbit, console check.
import { chromium, devices } from 'playwright-core'
const base = process.env.BASE || 'http://localhost:5173/'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
})
const ctx = await browser.newContext({ ...devices['Pixel 7'], hasTouch: true })
const page = await ctx.newPage()
const logs = []
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto(base + '?t=0.55&tour=0&qa=1')
await page.waitForFunction(() => window.__store?.getState().ready, null, { timeout: 120000 })
await page.waitForTimeout(3000)
const info = await page.evaluate(() => ({ q: window.__store.getState().quality, mobile: window.__store.getState().mobile, w: innerWidth, h: innerHeight, dpr: devicePixelRatio, canvas: [document.querySelector('canvas').width, document.querySelector('canvas').height] }))
await page.screenshot({ path: 'qa/out/mobile_portrait.png' })
await page.setViewportSize({ width: 844, height: 390 })
await page.waitForTimeout(2500)
const info2 = await page.evaluate(() => ({ w: innerWidth, h: innerHeight, canvas: [document.querySelector('canvas').width, document.querySelector('canvas').height] }))
await page.screenshot({ path: 'qa/out/mobile_landscape.png' })
console.log(JSON.stringify({ info, info2, qa: await page.evaluate(() => window.__qa), logs: [...new Set(logs)] }, null, 1))
await browser.close()
