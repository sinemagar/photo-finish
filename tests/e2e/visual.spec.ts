import { expect, test } from '@playwright/test'

import { MeetingPage } from './support/meetingPage'

/**
 * Visual regression tests. A fixed seed and a controlled clock make every state
 * reproducible down to the pixel. The baselines live in `__screenshots__` and are
 * compared in CI only; see `playwright.config.ts`.
 */
let meeting: MeetingPage

test.beforeEach(async ({ page }) => {
  meeting = new MeetingPage(page)
  await meeting.open()
})

test('initial state', async ({ page }) => {
  await expect(meeting.stableRows).toHaveCount(20)

  await expect(page).toHaveScreenshot('initial.png', { fullPage: true })
})

test('how it works', async ({ page }) => {
  await page.getByTestId('help-button').click()
  await expect(page.getByTestId('help-dialog')).toBeVisible()

  await expect(page).toHaveScreenshot('how-it-works.png', { fullPage: true })
})

test('programme generated', async ({ page }) => {
  await meeting.generate()
  await expect(meeting.runners).toHaveCount(10)

  await expect(page).toHaveScreenshot('programme-generated.png', { fullPage: true })
})

test('paused in the middle of a round', async ({ page }) => {
  await meeting.generate()
  await meeting.start()
  await meeting.advance(5000)
  await meeting.toggleButton.click()
  await expect(meeting.statusBadge).toHaveText('Paused')

  await expect(page).toHaveScreenshot('mid-race.png', { fullPage: true })
})

test('first round finished', async ({ page }) => {
  await meeting.generate()
  await meeting.start()
  await meeting.advanceUntilResults(1)
  await expect(meeting.positions).toHaveCount(10)

  await expect(page).toHaveScreenshot('round-finished.png', { fullPage: true })
})

test('meeting finished', async ({ page }) => {
  await meeting.generate()
  await meeting.start()
  await meeting.advanceUntilResults(6)
  await expect(meeting.statusBadge).toHaveText('Finished')

  await expect(page).toHaveScreenshot('meeting-finished.png', { fullPage: true })
})
