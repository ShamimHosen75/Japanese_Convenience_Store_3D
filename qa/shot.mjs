// Usage: node qa/shot.mjs "<query>" out.png [waitMs] [width] [height]
import { chromium } from 'playwright-core'
const [, , query = '', out = 'qa/out/shot.png', wait = '6000', w = '1280', h = '800'] = process.argv
const base = process.env.BASE || 'http://localhost:5173/'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
})
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
const logs = []
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto(base + (query ? '?' + query : ''))
await page.waitForFunction(() => window.__store?.getState().ready, null, { timeout: 120000 }).catch(() => logs.push('[qa] never became ready'))
if (process.env.EVAL) await page.evaluate(process.env.EVAL)
await page.waitForTimeout(+wait)
const qa = await page.evaluate(() => window.__qa)
await page.screenshot({ path: out })
console.log(JSON.stringify({ qa, logs: [...new Set(logs)].slice(0, 20) }, null, 1))
await browser.close()
