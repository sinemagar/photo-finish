import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import MeetingSummary, { type SummaryEntry } from './MeetingSummary.vue'

const entry = (id: number, name: string, wins: number, podiums: number): SummaryEntry => ({
  horse: { id, name, color: { name: 'Lime', hex: '#84cc16' }, condition: 50 },
  wins,
  podiums,
})

const leaders = [entry(1, 'Kestrel Song', 3, 4), entry(2, 'Rustic Arrow', 1, 1)]

describe('MeetingSummary', () => {
  it('lists the horses of the day with their record, in the given order', () => {
    const wrapper = mount(MeetingSummary, { props: { leaders } })
    const rows = wrapper.findAll('li').map((item) => item.text().replace(/\s+/g, ''))

    expect(wrapper.get('h3').text()).toBe('Meeting complete')
    // Compared without whitespace, which the template is free to lay out as it likes.
    expect(rows).toEqual(['1KestrelSong3wins,4podiums', '2RusticArrow1win,1podium'])
  })

  it('asks for a new programme when its button is pressed', async () => {
    const wrapper = mount(MeetingSummary, { props: { leaders } })

    await wrapper.get('[data-testid="restart-button"]').trigger('click')

    expect(wrapper.emitted('restart')).toHaveLength(1)
  })
})
