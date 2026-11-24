// Fails the build when the shipped JavaScript or CSS grows past its budget.
// Run after `npm run build`: node scripts/check-bundle-size.mjs
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const ASSETS_DIR = 'dist/assets'

/** Budgets in kilobytes after gzip, the size that actually travels over the network. */
const BUDGETS = { js: 60, css: 10 }

const totals = { js: 0, css: 0 }

for (const file of readdirSync(ASSETS_DIR)) {
  const extension = file.split('.').pop()
  if (extension in totals) {
    totals[extension] += gzipSync(readFileSync(join(ASSETS_DIR, file))).length / 1024
  }
}

let overBudget = false

for (const [type, budget] of Object.entries(BUDGETS)) {
  const size = totals[type]
  const withinBudget = size <= budget
  overBudget ||= !withinBudget

  console.log(
    `${type.toUpperCase().padEnd(4)} ${size.toFixed(1).padStart(6)} kB gzip   budget ${budget} kB   ${withinBudget ? 'ok' : 'OVER BUDGET'}`,
  )
}

process.exit(overBudget ? 1 : 0)
