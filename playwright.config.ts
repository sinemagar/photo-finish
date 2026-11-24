import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const isCI = Boolean(process.env.CI)

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',

  // Screenshots depend on the fonts and rendering of the machine that takes them, so the
  // baselines are produced in the CI container only. Elsewhere the comparison is skipped
  // and the visual tests still check that every state can be reached.
  ignoreSnapshots: !isCI,
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  expect: {
    toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.01 },
  },

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      // The flow is the same on a phone; only its appearance needs a second look.
      testMatch: /visual\.spec\.ts/,
    },
  ],

  // The tests run against the production build, exactly what gets deployed.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
  },
})
