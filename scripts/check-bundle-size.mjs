// Fails the build when the shipped JavaScript or CSS grows past its budget.
// Run after `npm run build`: node scripts/check-bundle-size.mjs
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const ASSETS_DIR = 'dist/assets'

/**
 * Budgets in kilobytes after gzip, the size that actually travels over the network.
 * The initial load is everything the first screen needs; the 3D track (three.js and its
 * scene) is downloaded separately, only when it is shown.
 */
const BUDGETS = [
  {
    name: 'Initial JS',
    budget: 60,
    match: (file) => file.startsWith('index-') && file.endsWith('.js'),
  },
  { name: 'Initial CSS', budget: 10, match: (file) => file.endsWith('.css') },
  {
    name: '3D track JS',
    budget: 200,
    match: (file) => !file.startsWith('index-') && file.endsWith('.js'),
  },
]

const gzipSize = (file) => gzipSync(readFileSync(join(ASSETS_DIR, file))).length / 1024
const files = readdirSync(ASSETS_DIR)

let overBudget = false

for (const { name, budget, match } of BUDGETS) {
  const size = files.filter(match).reduce((total, file) => total + gzipSize(file), 0)
  const withinBudget = size <= budget
  overBudget ||= !withinBudget

  console.log(
    `${name.padEnd(12)} ${size.toFixed(1).padStart(6)} kB gzip   budget ${budget} kB   ${withinBudget ? 'ok' : 'OVER BUDGET'}`,
  )
}

process.exit(overBudget ? 1 : 0)
