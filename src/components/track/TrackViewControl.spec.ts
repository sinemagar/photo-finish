import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import type { CameraMode } from '@/scene/cameras'

import TrackViewControl from './TrackViewControl.vue'

const mountControl = (renderer: '2d' | '3d', camera: CameraMode = 'tv') =>
  mount(TrackViewControl, { props: { renderer, camera } })

const pressed = (wrapper: ReturnType<typeof mountControl>) =>
  wrapper
    .findAll('button')
    .filter((button) => button.attributes('aria-pressed') === 'true')
    .map((button) => button.text())

describe('TrackViewControl', () => {
  it('offers the three cameras and the 2D track as one labelled choice', () => {
    const wrapper = mountControl('3d')

    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.attributes('aria-label')).toBe('View')
    expect(wrapper.findAll('button').map((button) => button.text())).toEqual([
      'TV',
      'Chase',
      'Aerial',
      '2D',
    ])
  })

  it('marks the camera in use in 3D, and 2D on the flat track', () => {
    expect(pressed(mountControl('3d', 'chase'))).toEqual(['Chase'])
    expect(pressed(mountControl('2d', 'chase'))).toEqual(['2D'])
  })

  it('switches to another camera', async () => {
    const wrapper = mountControl('3d')

    await wrapper.get('[data-testid="camera-aerial"]').trigger('click')

    expect(wrapper.emitted('update:camera')).toEqual([['aerial']])
  })

  it('switches to the 2D track', async () => {
    const wrapper = mountControl('3d')

    await wrapper.get('[data-testid="renderer-2d"]').trigger('click')

    expect(wrapper.emitted('update:renderer')).toEqual([['2d']])
  })

  it('returns to 3D with the camera chosen', async () => {
    const wrapper = mountControl('2d', 'tv')

    await wrapper.get('[data-testid="camera-chase"]').trigger('click')

    expect(wrapper.emitted('update:renderer')).toEqual([['3d']])
    expect(wrapper.emitted('update:camera')).toEqual([['chase']])
  })
})
