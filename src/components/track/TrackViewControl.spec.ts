import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import TrackViewControl from './TrackViewControl.vue'

const mountControl = (renderer: '2d' | '3d', camera = 'tv' as const) =>
  mount(TrackViewControl, { props: { renderer, camera } })

describe('TrackViewControl', () => {
  it('offers the three cameras in 3D and marks the current one', () => {
    const wrapper = mountControl('3d')
    const cameras = wrapper.findAll('[data-testid^="camera-"]')

    expect(cameras.map((button) => button.text())).toEqual(['TV', 'Chase', 'Overhead'])
    expect(cameras.map((button) => button.attributes('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
    ])
  })

  it('asks for another camera when one is chosen', async () => {
    const wrapper = mountControl('3d')

    await wrapper.get('[data-testid="camera-overhead"]').trigger('click')

    expect(wrapper.emitted('update:camera')).toEqual([['overhead']])
  })

  it('hides the cameras on the 2D track', () => {
    expect(mountControl('2d').find('[data-testid^="camera-"]').exists()).toBe(false)
  })

  it('switches between 2D and 3D, saying what the button will do', async () => {
    const wrapper = mountControl('3d')
    const toggle = wrapper.get('[data-testid="renderer-toggle"]')

    expect(toggle.text()).toBe('2D')
    expect(toggle.attributes('aria-label')).toBe('Show the 2D track')

    await toggle.trigger('click')
    expect(wrapper.emitted('update:renderer')).toEqual([['2d']])

    await wrapper.setProps({ renderer: '2d' })
    expect(toggle.attributes('aria-label')).toBe('Show the 3D track')
  })
})
