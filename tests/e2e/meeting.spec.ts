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

test.describe('getting started', () => {
  test('welcomes a first-time visitor and starts from the card', async ({ page }) => {
    const welcome = page.getByTestId('welcome-card')

    await expect(welcome).toBeVisible()
    await expect(welcome.locator('li')).toHaveCount(3)

    await page.getByTestId('welcome-generate').click()

    await expect(welcome).toBeHidden()
    await expect(meeting.programmeRounds).toHaveCount(6)
    await expect(meeting.statusBadge).toHaveText('Ready')
  })

  test('explains the game in a dialog that traps focus and gives it back', async ({ page }) => {
    const dialog = page.getByTestId('help-dialog')
    const helpButton = page.getByTestId('help-button')

    await helpButton.click()

    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('A stable of 20 horses')
    await expect(page.getByTestId('session-seed')).toHaveText('7')
    await expect(page.getByTestId('replay-link')).toHaveAttribute('href', '?seed=7')

    // While the dialog is open the page behind it cannot be reached. Focus may pass to
    // the browser's own controls, as a native modal dialog allows, but never to the page.
    for (let presses = 0; presses < 8; presses++) {
      await page.keyboard.press('Tab')
      const focusStaysOffThePage = await dialog.evaluate((element) => {
        const active = document.activeElement
        return !active || active === document.body || element.contains(active)
      })
      expect(focusStaysOffThePage).toBe(true)
    }

    await page.keyboard.press('Escape')

    await expect(dialog).toBeHidden()
    await expect(helpButton).toBeFocused()
  })

  test('closes the dialog from its button and from the backdrop', async ({ page }) => {
    const dialog = page.getByTestId('help-dialog')

    await page.getByTestId('welcome-help').click()
    await page.getByTestId('dialog-close').click()
    await expect(dialog).toBeHidden()

    await page.getByTestId('help-button').click()
    await page.mouse.click(5, 5)
    await expect(dialog).toBeHidden()
  })
})

test.describe('generating a programme', () => {
  test('creates six rounds at the required distances with ten horses each', async () => {
    await meeting.generate()

    await expect(meeting.programmeRounds.getByTestId('round-heading')).toHaveText(ROUND_HEADINGS)
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
      await expect(meeting.resultRounds.getByTestId('round-heading')).toHaveText(
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
    await expect(meeting.resultRounds.first().locator('.round-card__rank-mark')).toHaveText([
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
    await expect(meeting.statusBadge).toHaveText('Break')

    await meeting.advance(3000)

    await expect(meeting.statusBadge).toHaveText('Racing')
    await expect(meeting.page.getByTestId('race-panel').locator('h2')).toHaveText(
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

test.describe('following the meeting', () => {
  test.beforeEach(async () => {
    await meeting.generate()
    await meeting.start()
  })

  test('keeps the latest result open and folds earlier ones to their winner', async () => {
    await meeting.advanceUntilResults(2)

    const [first, second] = await meeting.resultRounds.all()

    await expect(first!.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    await expect(first!.getByTestId('round-summary')).toContainText('Won by')
    await expect(second!.getByRole('button')).toHaveAttribute('aria-expanded', 'true')

    await first!.getByRole('button').click()
    await expect(first!.locator('tbody tr')).toHaveCount(10)
    await expect(first!.locator('tbody tr').first()).toBeVisible()
  })

  test('opens the round on the track in the programme', async () => {
    await meeting.advanceUntilResults(1)
    await meeting.advance(3000)

    const expanded = meeting.programmeRounds.locator('button[aria-expanded="true"]')

    await expect(expanded).toHaveCount(1)
    await expect(expanded.getByTestId('round-heading')).toHaveText('Round 2 · 1400 m')
    await expect(expanded.getByTestId('round-summary')).toHaveText('On track')
  })

  test('shows how far the meeting has got', async ({ page }) => {
    await meeting.advanceUntilResults(1)
    await meeting.advance(3000)

    await expect(page.getByTestId('round-stepper').locator('[aria-current="step"]')).toContainText(
      'Round 2',
    )
  })

  test('runs faster at a higher playback speed', async ({ page }) => {
    await meeting.advance(1000)
    const [normal = 0] = await meeting.runnerOffsets()

    await page.getByTestId('speed-control').getByText('4×').click()
    await meeting.advance(1000)
    const [fast = 0] = await meeting.runnerOffsets()

    // One second at 4× covers about four times the ground of one second at 1×.
    expect(fast - normal).toBeGreaterThan(normal * 3)
  })
})

test.describe('the race experience', () => {
  test.beforeEach(async () => {
    await meeting.generate()
    await meeting.start()
  })

  test('names the three leaders during a round, matching the ranks on the gates', async ({
    page,
  }) => {
    await meeting.advance(3000)

    const leaders = await page
      .getByTestId('live-leaders')
      .locator('.horse-badge__name')
      .allTextContents()
    const gates = await page.getByTestId('track-lane').evaluateAll((lanes) =>
      lanes.map((lane) => ({
        name: lane.querySelector('.track-lane__name')?.textContent?.trim() ?? '',
        rank: Number(lane.querySelector('[data-testid="track-rank"]')?.textContent),
      })),
    )
    const byRank = gates.sort((a, b) => a.rank - b.rank).map((gate) => gate.name)

    expect(leaders).toHaveLength(3)
    expect(leaders).toEqual(byRank.slice(0, 3))
    expect(gates.map((gate) => gate.rank).sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])
  })

  test('shows the podium and counts down to the next round during the break', async ({ page }) => {
    await meeting.advanceUntilResults(1)

    const banner = page.getByTestId('result-banner')
    const winner = (await meeting.horseNames(meeting.resultRounds.first()))[0]!

    await expect(banner).toBeVisible()
    await expect(banner.locator('li').first()).toContainText(winner)
    await expect(page.getByTestId('next-round')).toContainText('Round 2 · 1400 m')
    await expect(page.getByTestId('countdown')).toHaveText('3')

    await meeting.advance(1000)
    await expect(page.getByTestId('countdown')).toHaveText('2')

    await meeting.advance(2000)
    await expect(banner).toBeHidden()
  })

  test('sums the meeting up at the end and starts over from the summary', async ({ page }) => {
    await meeting.advanceUntilResults(6)

    const summary = page.getByTestId('meeting-summary')

    await expect(summary).toBeVisible()
    await expect(summary.locator('li')).toHaveCount(3)
    await expect(summary.locator('li').first()).toContainText(/\d wins?/)

    await page.getByTestId('restart-button').click()

    await expect(summary).toBeHidden()
    await expect(meeting.statusBadge).toHaveText('Ready')
    await expect(meeting.resultRounds).toHaveCount(0)
  })
})

test('can be played with the keyboard alone', async ({ page }) => {
  await page.keyboard.press('Tab')
  await expect(page.getByTestId('theme-toggle')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByTestId('help-button')).toBeFocused()
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

test('keeps the controls under the track on screen on a short laptop display', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 600 })
  await meeting.generate()

  for (const testId of ['view-control', 'speed-control', 'round-stepper']) {
    await expect(page.getByTestId(testId)).toBeInViewport({ ratio: 1 })
  }
  const pageScrolls = await page.evaluate(
    () => document.documentElement.scrollHeight > window.innerHeight,
  )
  expect(pageScrolls).toBe(false)
})
