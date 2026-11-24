import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { MeetingPage } from './support/meetingPage'

/** Runs axe on the page and returns the violations that would block a user. */
async function blockingViolations(meeting: MeetingPage) {
  const { page } = meeting
  await meeting.releaseClock()

  const { violations } = await new AxeBuilder({ page }).analyze()

  return violations
    .filter(({ impact }) => impact === 'serious' || impact === 'critical')
    .map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

let meeting: MeetingPage

test.beforeEach(async ({ page }) => {
  meeting = new MeetingPage(page)
  await meeting.open()
})

test('has no serious accessibility issues before a programme exists', async () => {
  expect(await blockingViolations(meeting)).toEqual([])
})

test('has no serious accessibility issues with a programme ready', async () => {
  await meeting.generate()

  expect(await blockingViolations(meeting)).toEqual([])
})

test('has no serious accessibility issues while paused mid-race', async () => {
  await meeting.generate()
  await meeting.start()
  await meeting.advance(4000)
  await meeting.toggleButton.click()

  expect(await blockingViolations(meeting)).toEqual([])
})

test('has no serious accessibility issues once the meeting is over', async () => {
  await meeting.generate()
  await meeting.start()
  await meeting.advanceUntilResults(6)

  expect(await blockingViolations(meeting)).toEqual([])
})

test('has no serious accessibility issues with every round opened by hand', async () => {
  await meeting.generate()
  for (const toggle of await meeting.programmeRounds.getByRole('button').all()) {
    if ((await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click()
  }

  expect(await blockingViolations(meeting)).toEqual([])
})

test('has no serious accessibility issues while the result banner is shown', async () => {
  await meeting.generate()
  await meeting.start()
  await meeting.advanceUntilResults(1)

  // The break is counted down by the game clock, so the banner stays while axe runs.
  const { page } = meeting
  await expect(page.getByTestId('result-banner')).toBeVisible()

  expect(await blockingViolations(meeting)).toEqual([])
})

test('has no serious accessibility issues with the help dialog open', async () => {
  await meeting.page.getByTestId('help-button').click()
  await expect(meeting.page.getByTestId('help-dialog')).toBeVisible()

  expect(await blockingViolations(meeting)).toEqual([])
})
