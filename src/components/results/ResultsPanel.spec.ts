import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { mountWithStores, runWholeMeeting, tickUntilStatusChanges } from '@/test/mountWithStores'
import { formatRaceTime } from '@/utils/format'

import ResultsPanel from './ResultsPanel.vue'

const round = '[data-testid="result-round"]'
const announcement = '[data-testid="results-announcement"]'

describe('ResultsPanel', () => {
  it('explains itself while there are no results', () => {
    const { wrapper } = mountWithStores(ResultsPanel)

    expect(wrapper.text()).toContain('Results appear here as each round finishes.')
    expect(wrapper.get(announcement).text()).toBe('')
  })

  it('adds a result as soon as a round finishes, and not before', async () => {
    const { wrapper, meeting, stable } = mountWithStores(ResultsPanel)

    meeting.generateProgramme()
    meeting.start()
    meeting.tick(16)
    await nextTick()
    expect(wrapper.findAll(round)).toHaveLength(0)

    tickUntilStatusChanges(meeting)
    await nextTick()

    const tables = wrapper.findAll(round)
    const placings = meeting.results[0]?.placings ?? []

    expect(tables).toHaveLength(1)
    expect(tables[0]?.get('caption').text()).toBe('Round 1 · 1200 m')
    expect(tables[0]?.findAll('tbody tr').map((row) => row.text())).toEqual(
      placings.map(
        (placing) =>
          `${placing.position}${stable.getHorse(placing.horseId)?.name}${formatRaceTime(placing.time)}`,
      ),
    )
  })

  it('announces the winner of the latest round politely', async () => {
    const { wrapper, meeting, stable } = mountWithStores(ResultsPanel)

    meeting.generateProgramme()
    meeting.start()
    tickUntilStatusChanges(meeting)
    await nextTick()

    const winner = stable.getHorse(meeting.results[0]?.placings[0]?.horseId ?? 0)

    expect(wrapper.get(announcement).attributes('aria-live')).toBe('polite')
    expect(wrapper.get(announcement).text()).toBe(`Round 1 finished. Winner: ${winner?.name}.`)
  })

  it('decorates the podium of every result', async () => {
    const { wrapper, meeting } = mountWithStores(ResultsPanel)

    meeting.generateProgramme()
    meeting.start()
    tickUntilStatusChanges(meeting)
    await nextTick()

    expect(wrapper.get(round).classes()).toContain('round-table--podium')
  })

  it('shows all six results in round order after the meeting', async () => {
    const { wrapper, meeting } = mountWithStores(ResultsPanel)

    runWholeMeeting(meeting)
    await nextTick()

    expect(wrapper.findAll(round).map((table) => table.get('caption').text())).toEqual([
      'Round 1 · 1200 m',
      'Round 2 · 1400 m',
      'Round 3 · 1600 m',
      'Round 4 · 1800 m',
      'Round 5 · 2000 m',
      'Round 6 · 2200 m',
    ])
  })

  it('is cleared by a new programme', async () => {
    const { wrapper, meeting } = mountWithStores(ResultsPanel)

    runWholeMeeting(meeting)
    meeting.generateProgramme()
    await nextTick()

    expect(wrapper.findAll(round)).toHaveLength(0)
  })
})
