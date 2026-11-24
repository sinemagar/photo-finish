import { describe, expect, it } from 'vitest'

import { mountWithStores } from '@/test/mountWithStores'

import HowItWorksDialog from './HowItWorksDialog.vue'

const mountDialog = (seed = 42) =>
  mountWithStores(HowItWorksDialog, { seed }, { props: { open: true }, attachTo: document.body })

describe('HowItWorksDialog', () => {
  it('explains the meeting with the figures the game is configured with', () => {
    const { wrapper } = mountDialog()
    const text = wrapper.text().replace(/\s+/g, ' ')

    expect(text).toContain('A stable of 20 horses')
    expect(text).toContain('condition score from 1 to 100')
    expect(text).toContain('6 rounds, from 1200 m up to 2200 m')
    expect(text).toContain('draws 10 horses at random')
    expect(text).toContain('between 15 and 17 metres per second')
    expect(text).toContain('by up to 6% either way')

    wrapper.unmount()
  })

  it('shows the seed of the session and a link that replays it', () => {
    const { wrapper } = mountDialog(42)

    expect(wrapper.get('[data-testid="session-seed"]').text()).toBe('42')
    expect(wrapper.get('[data-testid="replay-link"]').attributes('href')).toBe('?seed=42')

    wrapper.unmount()
  })

  it('links to the source without handing the new tab a reference to this one', () => {
    const { wrapper } = mountDialog()
    const link = wrapper.get('a[target="_blank"]')

    expect(link.attributes('href')).toContain('github.com')
    expect(link.attributes('rel')).toContain('noopener')

    wrapper.unmount()
  })

  it('passes a request to close on to its owner', async () => {
    const { wrapper } = mountDialog()

    await wrapper.get('[data-testid="dialog-close"]').trigger('click')

    expect(wrapper.emitted('update:open')).toEqual([[false]])

    wrapper.unmount()
  })
})
