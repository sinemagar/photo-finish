import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { MeetingPage } from './support/meetingPage'

const theme = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.dataset.theme)

test('follows the device setting on a first visit', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await new MeetingPage(page).open()

  expect(await theme(page)).toBe('dark')
})

test('switches theme from the header and remembers it on the next visit', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  const meeting = new MeetingPage(page)
  await meeting.open()

  await page.getByTestId('theme-toggle').click()
  expect(await theme(page)).toBe('dark')
  await expect(page.getByTestId('theme-toggle')).toHaveAttribute(
    'aria-label',
    'Switch to light mode',
  )

  await meeting.open()
  expect(await theme(page)).toBe('dark')
})

test('has no serious accessibility issues in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  const meeting = new MeetingPage(page)
  await meeting.open()
  await meeting.generate()
  await meeting.start()
  await meeting.advanceUntilResults(1)
  await meeting.releaseClock()

  const { violations } = await new AxeBuilder({ page }).analyze()
  const blocking = violations
    .filter(({ impact }) => impact === 'serious' || impact === 'critical')
    .map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target.join(' ')).join(', ')}`)

  expect(blocking).toEqual([])
})
