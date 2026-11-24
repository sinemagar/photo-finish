import { expect, type Locator, type Page } from '@playwright/test'

const START_TIME = new Date('2026-01-01T12:00:00Z')

/**
 * Page object for the game. It also takes over the browser clock: time only moves when a
 * test calls `advance`, so every run of a given seed is frame-for-frame identical and no
 * test ever waits for an animation in real time.
 */
export class MeetingPage {
  readonly generateButton: Locator
  readonly toggleButton: Locator
  readonly statusBadge: Locator
  readonly trackStatus: Locator
  readonly stableRows: Locator
  readonly programmeRounds: Locator
  readonly resultRounds: Locator
  readonly runners: Locator
  readonly positions: Locator

  constructor(readonly page: Page) {
    this.generateButton = page.getByTestId('generate-button')
    this.toggleButton = page.getByTestId('toggle-button')
    this.statusBadge = page.getByTestId('status-badge')
    this.trackStatus = page.getByTestId('track-status')
    this.stableRows = page.getByTestId('stable-row')
    this.programmeRounds = page.getByTestId('programme-round')
    this.resultRounds = page.getByTestId('result-round')
    this.runners = page.getByTestId('track-runner')
    this.positions = page.getByTestId('track-position')
  }

  /**
   * Opens the game with a fixed seed. Flow tests use the 2D track, which exposes every
   * horse's position in the DOM; the 3D track has tests of its own.
   */
  async open(
    seed = 7,
    { renderer = '2d', speed }: { renderer?: '2d' | '3d' | 'auto'; speed?: number } = {},
  ) {
    await this.page.clock.install({ time: START_TIME })
    const params = new URLSearchParams({ seed: String(seed) })
    if (renderer !== 'auto') params.set('renderer', renderer)
    if (speed) params.set('speed', String(speed))
    await this.page.goto(`/?${params}`)

    // Stop the clock shortly after the page has loaded, however long loading took.
    const loadedAt = await this.page.evaluate(() => Date.now())
    await this.page.clock.pauseAt(new Date(loadedAt + 500))
  }

  /** Moves the game clock forward, running every animation frame on the way. */
  async advance(milliseconds: number) {
    await this.page.clock.runFor(milliseconds)
  }

  /**
   * Lets time flow normally again. Needed by tools that wait on real timers inside the
   * page, such as axe; only use it in a state where the game itself is not moving.
   */
  async releaseClock() {
    await this.page.clock.resume()
  }

  async generate() {
    await this.generateButton.click()
  }

  async start() {
    await expect(this.toggleButton).toHaveText('Start')
    await this.toggleButton.click()
  }

  /** Advances in small steps until the given number of results is on screen. */
  async advanceUntilResults(count: number) {
    // A whole meeting lasts about 85 seconds of game time; this allows for twice that.
    for (let step = 0; step < 700; step++) {
      if ((await this.resultRounds.count()) >= count) return
      await this.advance(250)
    }

    throw new Error(`Result ${count} did not appear`)
  }

  /** Horizontal offset of every horse, as the percentage its lane has been covered. */
  async runnerOffsets(): Promise<number[]> {
    const styles = await this.runners.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('style') ?? ''),
    )

    return styles.map((style) => Number(/translateX\((.+)%\)/.exec(style)?.[1]))
  }

  horseNames(round: Locator): Promise<string[]> {
    return round.locator('tbody .horse-badge__name').allTextContents()
  }
}
