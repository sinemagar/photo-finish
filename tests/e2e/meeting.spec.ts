import { expect, test } from '@playwright/test'

import { MeetingPage } from './support/meetingPage'

const ROUND_HEADINGS = [
  'Round 1 · 1200 m',
  'Round 2 · 1400 m',
  'Round 3 · 1600 m',
  'Round 4 · 1800 m',
  'Round 5 · 2000 m',
  'Round 6 · 2200 m',
]

let meeting: MeetingPage

test.beforeEach(async ({ page }) => {
  meeting = new MeetingPage(page)
  await meeting.open()
})

test.describe('before a programme exists', () => {
  test('lists 20 horses and offers only Generate', async () => {
    await expect(meeting.stableRows).toHaveCount(20)
    await expect(meeting.generateButton).toBeEnabled()
    await expect(meeting.toggleButton).toBeDisabled()
    await expect(meeting.statusBadge).toHaveText('No programme')
    await expect(meeting.programmeRounds).toHaveCount(0)
    await expect(meeting.resultRounds).toHaveCount(0)
  })
})

test.describe('generating a programme', () => {
  test('creates six rounds at the required distances with ten horses each', async () => {
    await meeting.generate()

    await expect(meeting.programmeRounds.locator('caption')).toHaveText(ROUND_HEADINGS)
    for (const round of await meeting.programmeRounds.all()) {
      const names = await meeting.horseNames(round)

      expect(names).toHaveLength(10)
      expect(new Set(names).size).toBe(10)
    }
  })

  test('lines the first round up on the starting line and enables Start', async () => {
    await meeting.generate()

    await expect(meeting.runners).toHaveCount(10)
    expect(await meeting.runnerOffsets()).toEqual(Array(10).fill(0))
    await expect(meeting.toggleButton).toBeEnabled()
    await expect(meeting.statusBadge).toHaveText('Ready')
  })

  test('gives the same programme for the same seed and another one for another seed', async ({
    browser,
  }) => {
    await meeting.generate()
    const programme = await meeting.programmeRounds.allTextContents()

    const programmeFor = async (seed: number) => {
      const other = new MeetingPage(await browser.newPage())
      await other.open(seed)
      await other.generate()
      const text = await other.programmeRounds.allTextContents()
      await other.page.close()
      return text
    }

    expect(await programmeFor(7)).toEqual(programme)
    expect(await programmeFor(8)).not.toEqual(programme)
  })
})

test.describe('racing', () => {
  test.beforeEach(async () => {
    await meeting.generate()
    await meeting.start()
  })

  test('moves every horse along its lane', async () => {
    await meeting.advance(2000)

    const offsets = await meeting.runnerOffsets()

    expect(offsets).toHaveLength(10)
    for (const offset of offsets) {
      expect(offset).toBeGreaterThan(0)
      expect(offset).toBeLessThan(100)
    }
    await expect(meeting.statusBadge).toHaveText('Racing')
  })

  test('locks Generate while a round is running', async () => {
    await expect(meeting.generateButton).toBeDisabled()
    await expect(meeting.toggleButton).toHaveText('Pause')
  })

  test('pauses in place and resumes from the same positions', async () => {
    await meeting.advance(2000)
    await meeting.toggleButton.click()
    const paused = await meeting.runnerOffsets()

    await expect(meeting.toggleButton).toHaveText('Resume')
    await expect(meeting.trackStatus).toHaveText('Paused.')

    await meeting.advance(5000)
    expect(await meeting.runnerOffsets()).toEqual(paused)

    await meeting.toggleButton.click()
    await meeting.advance(1000)
    const resumed = await meeting.runnerOffsets()

    resumed.forEach((offset, index) => expect(offset).toBeGreaterThan(paused[index] ?? 0))
  })

  test('shows each result as soon as its round finishes, one round at a time', async () => {
    for (let round = 1; round <= 6; round++) {
      await meeting.advanceUntilResults(round)

      // Never more than one new result at a time, and always in round order.
      await expect(meeting.resultRounds.locator('caption')).toHaveText(
        ROUND_HEADINGS.slice(0, round),
      )
      await expect(meeting.positions).toHaveCount(10)
    }

    await expect(meeting.statusBadge).toHaveText('Finished')
    await expect(meeting.toggleButton).toBeDisabled()
    await expect(meeting.generateButton).toBeEnabled()
  })

  test('ranks exactly the ten horses that ran in the round', async () => {
    await meeting.advanceUntilResults(1)

    const entered = await meeting.horseNames(meeting.programmeRounds.first())
    const ranked = await meeting.horseNames(meeting.resultRounds.first())

    expect([...ranked].sort()).toEqual([...entered].sort())
    await expect(meeting.resultRounds.first().locator('.round-table__rank-mark')).toHaveText([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ])
  })

  test('starts the next round by itself after a short break', async () => {
    await meeting.advanceUntilResults(1)
    await expect(meeting.statusBadge).toHaveText('Next round soon')

    await meeting.advance(3000)

    await expect(meeting.statusBadge).toHaveText('Racing')
    await expect(meeting.page.getByTestId('track-panel').locator('h2')).toHaveText(
      'Round 2 · 1400 m',
    )
  })

  test('clears the results when a new programme is generated afterwards', async () => {
    await meeting.advanceUntilResults(6)
    await meeting.generate()

    await expect(meeting.resultRounds).toHaveCount(0)
    await expect(meeting.programmeRounds).toHaveCount(6)
    await expect(meeting.statusBadge).toHaveText('Ready')
  })
})

test('can be played with the keyboard alone', async ({ page }) => {
  await page.keyboard.press('Tab')
  await expect(meeting.generateButton).toBeFocused()
  await page.keyboard.press('Enter')

  await page.keyboard.press('Tab')
  await expect(meeting.toggleButton).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(meeting.statusBadge).toHaveText('Racing')

  await page.keyboard.press('Space')
  await expect(meeting.statusBadge).toHaveText('Paused')
})
