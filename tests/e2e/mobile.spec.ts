import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { MeetingPage } from './support/meetingPage'

/**
 * The phone layout: the track and the controls stay on screen, and the three lists share
 * the space below behind tabs.
 */
let meeting: MeetingPage

test.beforeEach(async ({ page }) => {
  meeting = new MeetingPage(page)
  await meeting.open()
})

test('fits the track, the controls and a list on one screen without scrolling the page', async ({
  page,
}) => {
  await meeting.generate()

  const viewport = page.viewportSize()!
  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollHeight <= window.innerHeight,
  )

  expect(fitsViewport).toBe(true)
  for (const target of [
    meeting.generateButton,
    meeting.toggleButton,
    page.getByTestId('race-track'),
    page.getByRole('tablist'),
    meeting.programmeRounds.first().getByTestId('round-heading'),
  ]) {
    const box = await target.boundingBox()

    expect(box).not.toBeNull()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
  }
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

test('keeps the track in view while a long list is scrolled', async ({ page }) => {
  await meeting.generate()
  await page.getByRole('tab', { name: 'Stable' }).click()
  const before = await page.getByTestId('race-track').boundingBox()

  await meeting.stableRows.last().scrollIntoViewIfNeeded()

  await expect(meeting.stableRows.last()).toBeInViewport()
  expect(await page.getByTestId('race-track').boundingBox()).toEqual(before)
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
