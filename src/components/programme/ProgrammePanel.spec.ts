import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { mountWithStores, tickUntilStatusChanges } from '@/test/mountWithStores'

import ProgrammePanel from './ProgrammePanel.vue'

const round = '[data-testid="programme-round"]'
const heading = '[data-testid="round-heading"]'
const summary = '[data-testid="round-summary"]'

describe('ProgrammePanel', () => {
  it('shows a hint before a programme exists', () => {
    const { wrapper } = mountWithStores(ProgrammePanel)

    expect(wrapper.text()).toContain('No programme yet.')
    expect(wrapper.findAll(round)).toHaveLength(0)
  })

  it('lists six rounds with their distances and ten runners each', async () => {
    const { wrapper, meeting, stable } = mountWithStores(ProgrammePanel)

    meeting.generateProgramme()
    await nextTick()

    const rounds = wrapper.findAll(round)

    expect(rounds.map((card) => card.get(heading).text())).toEqual([
      'Round 1 · 1200 m',
      'Round 2 · 1400 m',
      'Round 3 · 1600 m',
      'Round 4 · 1800 m',
      'Round 5 · 2000 m',
      'Round 6 · 2200 m',
    ])

    rounds.forEach((card, index) => {
      const names = meeting.programme[index]?.runners.map(
        (runner) => stable.getHorse(runner.horseId)?.name,
      )

      expect(card.findAll('tbody tr').map((row) => row.get('.horse-badge').text())).toEqual(names)
    })
  })

  it('marks each round as to come, on the track or done, in words', async () => {
    const { wrapper, meeting } = mountWithStores(ProgrammePanel)
    const summaries = () =>
      wrapper
        .findAll(round)
        .map((card) => (card.find(summary).exists() ? card.get(summary).text() : null))

    meeting.generateProgramme()
    await nextTick()
    expect(summaries()).toEqual([null, null, null, null, null, null])

    meeting.start()
    await nextTick()
    expect(summaries()).toEqual(['On track', null, null, null, null, null])

    tickUntilStatusChanges(meeting) // round 1 finishes; it stays on the track for the break
    await nextTick()
    expect(summaries()).toEqual(['On track', null, null, null, null, null])

    tickUntilStatusChanges(meeting) // round 2 starts
    await nextTick()
    expect(summaries()).toEqual(['Done', 'On track', null, null, null, null])
    expect(wrapper.findAll('.round-card--active')).toHaveLength(1)
  })

  it('opens the current round and folds the others, following the meeting', async () => {
    const { wrapper, meeting } = mountWithStores(ProgrammePanel)
    const openRounds = () =>
      wrapper
        .findAll(round)
        .filter((card) => card.get('button').attributes('aria-expanded') === 'true')
        .map((card) => card.attributes('data-round'))

    meeting.generateProgramme()
    await nextTick()
    expect(openRounds()).toEqual(['1'])

    meeting.start()
    tickUntilStatusChanges(meeting)
    tickUntilStatusChanges(meeting)
    await nextTick()
    expect(openRounds()).toEqual(['2'])
  })

  it('lets the reader open another round by hand', async () => {
    const { wrapper, meeting } = mountWithStores(ProgrammePanel)

    meeting.generateProgramme()
    await nextTick()
    const fourth = wrapper.findAll(round)[3]

    await fourth?.get('button').trigger('click')

    expect(fourth?.get('button').attributes('aria-expanded')).toBe('true')
  })
})
