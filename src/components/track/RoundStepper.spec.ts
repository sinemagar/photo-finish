import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import RoundStepper from './RoundStepper.vue'

const describeSteps = (props: { total: number; completed: number; current: number | null }) =>
  mount(RoundStepper, { props })
    .findAll('li')
    .map((step) => step.get('.visually-hidden').text())

describe('RoundStepper', () => {
  it('shows every round as still to come before the meeting starts', () => {
    expect(describeSteps({ total: 3, completed: 0, current: null })).toEqual([
      'Round 1, to come',
      'Round 2, to come',
      'Round 3, to come',
    ])
  })

  it('tells finished, current and upcoming rounds apart in words', () => {
    expect(describeSteps({ total: 4, completed: 1, current: 2 })).toEqual([
      'Round 1, finished',
      'Round 2, on the track',
      'Round 3, to come',
      'Round 4, to come',
    ])
  })

  it('counts a round as finished as soon as its result is in, even during the break', () => {
    expect(describeSteps({ total: 2, completed: 1, current: 1 })).toEqual([
      'Round 1, finished',
      'Round 2, to come',
    ])
  })

  it('marks the current round for assistive technology', () => {
    const wrapper = mount(RoundStepper, { props: { total: 3, completed: 1, current: 2 } })

    expect(wrapper.findAll('li').map((step) => step.attributes('aria-current'))).toEqual([
      undefined,
      'step',
      undefined,
    ])
  })
})
