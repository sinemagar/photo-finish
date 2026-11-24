import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { MeetingPage } from './support/meetingPage'

/**
 * The 3D track. Its pixels depend on the graphics stack, so these tests check that it
 * loads, follows the meeting and can be controlled, rather than comparing screenshots.
 */
// Machines without a GPU draw every frame in software, which makes these tests slower.
test.describe.configure({ timeout: 90_000 })

let meeting: MeetingPage
const pageErrors: string[] = []

const track3d = '[data-renderer="3d"]'

test.beforeEach(async ({ page }) => {
  pageErrors.length = 0
  page.on('pageerror', (error) => pageErrors.push(String(error)))
  meeting = new MeetingPage(page)
})

test.afterEach(() => {
  expect(pageErrors).toEqual([])
})

test('is the default view and loads the course and horses', async ({ page }) => {
  await meeting.open(7, { renderer: 'auto' })

  await expect(page.locator(track3d)).toHaveAttribute('data-ready', 'true', { timeout: 20_000 })
  await expect(page.locator(`${track3d} canvas`)).toHaveAttribute('aria-label', /racecourse/)
})

test('runs rounds one after another and records each result', async ({ page }) => {
  // Every frame is drawn in software on machines without a GPU, so this test covers two
  // rounds; the whole meeting is covered on the 2D track, with the same simulation.
  test.setTimeout(240_000)
  await meeting.open(7, { renderer: '3d', speed: 4 })
  await expect(page.locator(track3d)).toHaveAttribute('data-ready', 'true', { timeout: 20_000 })

  await meeting.generate()
  await meeting.start()
  await meeting.advanceUntilResults(2)

  await expect(meeting.resultRounds.getByTestId('round-heading')).toHaveText([
    'Round 1 · 1200 m',
    'Round 2 · 1400 m',
  ])
  await expect(page.locator(track3d)).toBeVisible()
})

test('switches between the TV, chase and aerial cameras', async ({ page }) => {
  await meeting.open(7, { renderer: '3d' })
  await meeting.generate()

  const pressed = page.locator('[data-testid^="camera-"][aria-pressed="true"]')
  await expect(pressed).toHaveText('TV')

  for (const [id, label] of [
    ['chase', 'Chase'],
    ['aerial', 'Aerial'],
    ['tv', 'TV'],
  ]) {
    await page.getByTestId(`camera-${id}`).click()
    await expect(pressed).toHaveText(label)
  }
})

test('switches to the 2D track and back without losing the meeting', async ({ page }) => {
  await meeting.open(7, { renderer: '3d' })
  await meeting.generate()
  await meeting.start()
  await meeting.advance(3000)
  await meeting.toggleButton.click()

  await page.getByTestId('renderer-2d').click()
  await expect(page.locator('[data-testid="race-track"]:not([data-renderer])')).toBeVisible()
  await expect(meeting.runners).toHaveCount(10)
  const offsets = await meeting.runnerOffsets()
  expect(offsets.every((offset) => offset > 0 && offset < 100)).toBe(true)

  await page.getByTestId('renderer-3d').click()
  await expect(page.locator(track3d)).toBeVisible()
  await expect(meeting.toggleButton).toHaveText('Resume')
})

test('starts on the 2D track for players who ask for less motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await meeting.open(7, { renderer: 'auto' })

  await expect(page.locator('[data-testid="race-track"]')).not.toHaveAttribute(
    'data-renderer',
    '3d',
  )
})

test('has no serious accessibility issues', async ({ page }) => {
  await meeting.open(7, { renderer: '3d' })
  await meeting.generate()
  await expect(page.locator(track3d)).toHaveAttribute('data-ready', 'true', { timeout: 20_000 })
  await meeting.releaseClock()

  const { violations } = await new AxeBuilder({ page }).analyze()
  const blocking = violations
    .filter(({ impact }) => impact === 'serious' || impact === 'critical')
    .map(({ id }) => id)

  expect(blocking).toEqual([])
})
