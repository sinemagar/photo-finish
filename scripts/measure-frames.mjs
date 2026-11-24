// Measures how smoothly a race is drawn in a real browser, at normal speed.
// Usage: npm run build && npm run preview, then: node scripts/measure-frames.mjs [url]
import { chromium } from '@playwright/test'

const url = process.argv[2] ?? 'http://localhost:4173/'
const SAMPLE_MS = 6000
/** A frame is "long" when it takes more than two refresh intervals at 60 Hz. */
const LONG_FRAME_MS = 1000 / 30

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

await page.goto(`${url}?seed=7`)
await page.getByTestId('generate-button').click()
await page.getByTestId('toggle-button').click()

const frames = await page.evaluate(
  (duration) =>
    new Promise((resolve) => {
      const deltas = []
      const start = performance.now()
      let previous = start

      requestAnimationFrame(function sample(now) {
        deltas.push(now - previous)
        previous = now
        if (now - start < duration) requestAnimationFrame(sample)
        else resolve(deltas.slice(1))
      })
    }),
  SAMPLE_MS,
)

await browser.close()

const sorted = [...frames].sort((a, b) => a - b)
const average = frames.reduce((total, frame) => total + frame, 0) / frames.length
const percentile = (share) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * share))]
const longFrames = frames.filter((frame) => frame > LONG_FRAME_MS).length

console.log(`frames sampled   ${frames.length} over ${SAMPLE_MS / 1000} s`)
console.log(`average frame    ${average.toFixed(1)} ms (${(1000 / average).toFixed(0)} fps)`)
console.log(`95th percentile  ${percentile(0.95).toFixed(1)} ms`)
console.log(`slowest frame    ${sorted[sorted.length - 1].toFixed(1)} ms`)
console.log(`long frames      ${longFrames} (over ${LONG_FRAME_MS.toFixed(0)} ms)`)

process.exit(longFrames > frames.length * 0.01 ? 1 : 0)
