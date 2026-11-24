import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import SpeedControl from './SpeedControl.vue'

describe('SpeedControl', () => {
  it('offers 1, 2 and 4 times by default as one labelled radio group', () => {
    const wrapper = mount(SpeedControl, { props: { modelValue: 1 } })
    const radios = wrapper.findAll('input[type="radio"]')

    expect(wrapper.get('legend').text()).toBe('Playback speed')
    expect(radios.map((radio) => radio.attributes('value'))).toEqual(['1', '2', '4'])
    expect(new Set(radios.map((radio) => radio.attributes('name'))).size).toBe(1)
  })

  it('marks the current speed', () => {
    const wrapper = mount(SpeedControl, { props: { modelValue: 2 } })
    const checked = wrapper
      .findAll('input')
      .map((radio) => (radio.element as HTMLInputElement).checked)

    expect(checked).toEqual([false, true, false])
    expect(wrapper.get('.speed-control__option--selected').text()).toContain('2×')
  })

  it('emits the chosen speed as a number', async () => {
    const wrapper = mount(SpeedControl, { props: { modelValue: 1 } })

    await wrapper.get('[data-testid="speed-4"]').setValue(true)

    expect(wrapper.emitted('update:modelValue')).toEqual([[4]])
  })

  it('accepts other options', () => {
    const wrapper = mount(SpeedControl, { props: { modelValue: 1, options: [1, 8] } })

    expect(wrapper.findAll('input')).toHaveLength(2)
  })
})
