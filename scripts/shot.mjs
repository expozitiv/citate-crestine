/* Screenshot util pentru verificarea vizuală (folosește un Edge pornit cu
   --remote-debugging-port=9222). Utilizare:
   node scripts/shot.mjs <out.png> <url> [width] [height] */
import puppeteer from 'puppeteer-core'

const out = process.argv[2]
const url = process.argv[3]
const width = Number(process.argv[4] || 390)
const height = Number(process.argv[5] || 2400)

const browser = await puppeteer.connect({
  browserURL: 'http://127.0.0.1:9222',
  defaultViewport: null,
})
const page = await browser.newPage()
await page.setViewport({ width, height, deviceScaleFactor: 1 })
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
console.log('scrollWidth:', scrollW, 'viewport:', width)
await page.screenshot({ path: out })
await page.close()
browser.disconnect()
