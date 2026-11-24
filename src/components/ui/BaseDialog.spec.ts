import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import BaseDialog from './BaseDialog.vue'

const mountDialog = (open: boolean) =>
  mount(BaseDialog, {
    props: { open, title: 'How it works' },
    slots: { default: '<p>Content</p>' },
    attachTo: document.body,
  })

describe('BaseDialog', () => {
  it('is closed until asked to open', () => {
    const wrapper = mountDialog(false)

    expect(wrapper.element.hasAttribute('open')).toBe(false)

    wrapper.unmount()
  })

  it('opens and closes with its model', async () => {
    const wrapper = mountDialog(false)

    await wrapper.setProps({ open: true })
    await nextTick()
    expect(wrapper.element.hasAttribute('open')).toBe(true)

    await wrapper.setProps({ open: false })
    await nextTick()
    expect(wrapper.element.hasAttribute('open')).toBe(false)

    wrapper.unmount()
  })

  it('is labelled by its title and shows its content', () => {
    const wrapper = mountDialog(true)

    expect(wrapper.attributes('aria-labelledby')).toBe(wrapper.get('h2').attributes('id'))
    expect(wrapper.get('h2').text()).toBe('How it works')
    expect(wrapper.get('.base-dialog__body').text()).toBe('Content')

    wrapper.unmount()
  })

  it('asks to close from its close button', async () => {
    const wrapper = mountDialog(true)

    await wrapper.get('[data-testid="dialog-close"]').trigger('click')

    expect(wrapper.emitted('update:open')).toEqual([[false]])

    wrapper.unmount()
  })

  it('asks to close when the backdrop is clicked, but not when the content is', async () => {
    const wrapper = mountDialog(true)

    await wrapper.get('.base-dialog__body').trigger('click')
    expect(wrapper.emitted('update:open')).toBeUndefined()

    await wrapper.trigger('click')
    expect(wrapper.emitted('update:open')).toEqual([[false]])

    wrapper.unmount()
  })

  it('reports a close that the browser started, such as Escape', async () => {
    const wrapper = mountDialog(true)

    await wrapper.trigger('close')

    expect(wrapper.emitted('update:open')).toEqual([[false]])

    wrapper.unmount()
  })
})
