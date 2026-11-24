import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import type { CameraMode } from '@/scene/cameras'

import TrackViewControl from './TrackViewControl.vue'

const mountControl = (renderer: '2d' | '3d', camera: CameraMode = 'tv') =>
  mount(TrackViewControl, { props: { renderer, camera } })

const pressed = (wrapper: ReturnType<typeof mountControl>, prefix: string) =>
  wrapper
    .findAll(`[data-testid^="${prefix}-"]`)
    .filter((button) => button.attributes('aria-pressed') === 'true')
    .map((button) => button.text())

describe('TrackViewControl', () => {
  it('offers the three cameras in 3D and marks the current one', () => {
    const wrapper = mountControl('3d')

    expect(wrapper.findAll('[data-testid^="camera-"]').map((button) => button.text())).toEqual([
      'TV',
      'Chase',
      'Aerial',
    ])
    expect(pressed(wrapper, 'camera')).toEqual(['TV'])
  })

  it('asks for another camera when one is chosen', async () => {
    const wrapper = mountControl('3d')

    await wrapper.get('[data-testid="camera-aerial"]').trigger('click')

    expect(wrapper.emitted('update:camera')).toEqual([['aerial']])
  })

  it('hides the cameras on the 2D track', () => {
    expect(mountControl('2d').find('[data-testid^="camera-"]').exists()).toBe(false)
  })

  it('shows both views, marks the current one and switches between them', async () => {
    const wrapper = mountControl('3d')

    expect(pressed(wrapper, 'renderer')).toEqual(['3D'])

    await wrapper.get('[data-testid="renderer-2d"]').trigger('click')
    expect(wrapper.emitted('update:renderer')).toEqual([['2d']])
  })

  it('labels both groups for assistive technology', () => {
    const groups = mountControl('3d').findAll('[role="group"]')

    expect(groups.map((group) => group.attributes('aria-label'))).toEqual(['View', 'Camera'])
  })
})
