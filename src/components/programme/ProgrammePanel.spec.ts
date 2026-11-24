import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { mountWithStores, tickUntilStatusChanges } from '@/test/mountWithStores'

import ProgrammePanel from './ProgrammePanel.vue'

const round = '[data-testid="programme-round"]'

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

    expect(rounds.map((table) => table.get('caption').text())).toEqual([
      'Round 1 · 1200 m',
      'Round 2 · 1400 m',
      'Round 3 · 1600 m',
      'Round 4 · 1800 m',
      'Round 5 · 2000 m',
      'Round 6 · 2200 m',
    ])

    rounds.forEach((table, index) => {
      const names = meeting.programme[index]?.runners.map(
        (runner) => stable.getHorse(runner.horseId)?.name,
      )

      expect(table.findAll('tbody tr').map((row) => row.get('.horse-badge').text())).toEqual(names)
    })
  })

  it('plays down the rounds that have been run', async () => {
    const { wrapper, meeting } = mountWithStores(ProgrammePanel)
    const mutedRounds = () =>
      wrapper.findAll('.round-table--muted').map((table) => table.attributes('data-round'))

    meeting.generateProgramme()
    meeting.start()
    await nextTick()
    expect(mutedRounds()).toEqual([])

    tickUntilStatusChanges(meeting) // round 1 finishes; it stays highlighted for the break
    await nextTick()
    expect(mutedRounds()).toEqual([])

    tickUntilStatusChanges(meeting) // round 2 starts
    await nextTick()
    expect(mutedRounds()).toEqual(['1'])
  })

  it('highlights only the round that is on the track', async () => {
    const { wrapper, meeting } = mountWithStores(ProgrammePanel)
    const activeRounds = () =>
      wrapper.findAll('.round-table--active').map((table) => table.get('caption').text())

    meeting.generateProgramme()
    await nextTick()
    expect(activeRounds()).toEqual([])

    meeting.start()
    await nextTick()
    expect(activeRounds()).toEqual(['Round 1 · 1200 m (current round)'])

    tickUntilStatusChanges(meeting) // round 1 finishes
    tickUntilStatusChanges(meeting) // intermission ends
    await nextTick()
    expect(activeRounds()).toEqual(['Round 2 · 1400 m (current round)'])
  })
})
