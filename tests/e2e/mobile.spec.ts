import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { MeetingPage } from './support/meetingPage'

/**
 * The phone layout: the track and the controls come first, the three lists share the
 * space below behind tabs, and the page scrolls with the header and tabs kept in reach.
 */
let meeting: MeetingPage

test.beforeEach(async ({ page }) => {
  meeting = new MeetingPage(page)
  await meeting.open()
})

test('shows the controls and the track on the first screen', async ({ page }) => {
  await meeting.generate()

  const viewport = page.viewportSize()!
  for (const target of [
    meeting.generateButton,
    meeting.toggleButton,
    page.getByTestId('race-track'),
  ]) {
    const box = (await target.boundingBox())!

    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  }
})

test('scrolls down to the end of a long list, keeping the header and tabs in reach', async ({
  page,
}) => {
  await meeting.generate()
  await page.getByRole('tab', { name: 'Stable' }).click()

  await meeting.stableRows.last().scrollIntoViewIfNeeded()

  await expect(meeting.stableRows.last()).toBeInViewport()
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  await expect(meeting.toggleButton).toBeInViewport()
  await expect(page.getByRole('tablist')).toBeInViewport()
})

test('never scrolls sideways', async ({ page }) => {
  await meeting.generate()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test('fits the welcome card inside the track on a phone', async ({ page }) => {
  const card = (await page.getByTestId('welcome-card').boundingBox())!
  const track = (await page.getByTestId('race-track').boundingBox())!

  expect(card.x).toBeGreaterThanOrEqual(track.x)
  expect(card.x + card.width).toBeLessThanOrEqual(track.x + track.width)
  expect(card.y).toBeGreaterThanOrEqual(track.y)
  expect(card.y + card.height).toBeLessThanOrEqual(track.y + track.height)
  await expect(page.getByTestId('welcome-generate')).toBeVisible()
})

test('shows one list at a time and switches with the tabs', async ({ page }) => {
  await meeting.generate()

  await expect(page.getByTestId('programme-panel')).toBeVisible()
  await expect(page.getByTestId('stable-panel')).toBeHidden()
  await expect(page.getByTestId('results-panel')).toBeHidden()

  await page.getByRole('tab', { name: 'Stable' }).click()

  await expect(page.getByTestId('stable-panel')).toBeVisible()
  await expect(page.getByTestId('programme-panel')).toBeHidden()
  await expect(meeting.stableRows).toHaveCount(20)
})

test('turns to the results when the first round finishes and counts them on the tab', async ({
  page,
}) => {
  await meeting.generate()
  await meeting.start()
  await meeting.advanceUntilResults(1)

  await expect(page.getByTestId('results-panel')).toBeVisible()
  await expect(page.getByRole('tab', { name: /Results/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: /Results/ })).toContainText('1')
  await expect(meeting.resultRounds.first().locator('tbody tr').first()).toBeVisible()
})

test('stays on the tab the player picked', async ({ page }) => {
  await meeting.generate()
  await page.getByRole('tab', { name: 'Stable' }).click()
  await meeting.start()
  await meeting.advanceUntilResults(1)

  await expect(page.getByTestId('stable-panel')).toBeVisible()
})

test('has no serious accessibility issues in the tabbed layout', async ({ page }) => {
  await meeting.generate()
  await meeting.start()
  await meeting.advanceUntilResults(1)
  await meeting.advance(4000) // into the second round, where pausing is possible
  await meeting.toggleButton.click()
  await meeting.releaseClock()

  const { violations } = await new AxeBuilder({ page }).analyze()
  const blocking = violations
    .filter(({ impact }) => impact === 'serious' || impact === 'critical')
    .map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target.join(' ')).join(', ')}`)

  expect(blocking).toEqual([])
})
