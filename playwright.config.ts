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
    // A full-page capture of the finished meeting can take a while on a busy CI machine.
    timeout: 20_000,
    toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.01 },
  },

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // Software WebGL, so the 3D track can be drawn on machines without a GPU, as in CI.
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      // The rules are the same on a phone, so only its own layout and its appearance are
      // tested again.
      testMatch: /(visual|mobile)\.spec\.ts/,
    },
  ],

  // The tests run against the production build, exactly what gets deployed.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
  },
})
