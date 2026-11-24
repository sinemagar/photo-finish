<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import HowItWorksDialog from '@/components/help/HowItWorksDialog.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import ProgrammePanel from '@/components/programme/ProgrammePanel.vue'
import ResultsPanel from '@/components/results/ResultsPanel.vue'
import StablePanel from '@/components/stable/StablePanel.vue'
import TrackPanel from '@/components/track/TrackPanel.vue'
import BaseTabs, { type TabItem } from '@/components/ui/BaseTabs.vue'
import { useFrameLoop } from '@/composables/useFrameLoop'
import { useTheme } from '@/composables/useTheme'
import { useMeetingStore } from '@/stores/meeting'

type SectionId = 'results' | 'programme' | 'stable'

const SECTION_PREFIX = 'section'

const meeting = useMeetingStore()

// The only place where real time enters the game.
useFrameLoop(meeting.tick, () => meeting.isClockRunning)

const isHelpOpen = ref(false)
const { theme, toggle: toggleTheme } = useTheme()

/**
 * The results, programme and stable share one panel behind tabs: next to the track on a
 * wide screen, below it on a phone. The track always gets most of the room.
 */
const activeSection = ref<SectionId>('programme')
const hasChosenSection = ref(false)

const tabs = computed<TabItem<SectionId>[]>(() => [
  { id: 'results', label: 'Results', count: meeting.results.length },
  { id: 'programme', label: 'Programme' },
  { id: 'stable', label: 'Stable' },
])

function chooseSection(section: SectionId) {
  hasChosenSection.value = true
  activeSection.value = section
}

// The first result is what the player is waiting for: show it, unless they have already
// picked a tab themselves.
watch(
  () => meeting.results.length,
  (count, previous) => {
    if (count === 1 && previous === 0 && !hasChosenSection.value) activeSection.value = 'results'
  },
)

const sectionAttrs = (section: SectionId) => ({
  id: `${SECTION_PREFIX}-panel-${section}`,
  role: 'tabpanel',
  'aria-labelledby': `${SECTION_PREFIX}-tab-${section}`,
})
</script>

<template>
  <div class="app">
    <AppHeader
      :can-generate="meeting.canGenerate"
      :can-toggle="meeting.canToggle"
      :toggle-label="meeting.toggleLabel"
      :theme="theme"
      @toggle-theme="toggleTheme"
      @generate="meeting.generateProgramme"
      @toggle="meeting.toggle"
      @help="isHelpOpen = true"
    />
    <main class="app__main">
      <TrackPanel class="app__track" @help="isHelpOpen = true" />
      <section class="app__details" aria-label="Meeting details">
        <BaseTabs
          class="app__tabs"
          :model-value="activeSection"
          :tabs="tabs"
          :id-prefix="SECTION_PREFIX"
          label="Meeting details"
          @update:model-value="chooseSection"
        />
        <ResultsPanel
          v-show="activeSection === 'results'"
          class="app__section"
          v-bind="sectionAttrs('results')"
        />
        <ProgrammePanel
          v-show="activeSection === 'programme'"
          class="app__section"
          v-bind="sectionAttrs('programme')"
        />
        <StablePanel
          v-show="activeSection === 'stable'"
          class="app__section"
          v-bind="sectionAttrs('stable')"
        />
      </section>
    </main>
    <HowItWorksDialog v-model:open="isHelpOpen" />
  </div>
</template>

<style scoped lang="scss">
.app {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  &__main {
    display: grid;
    gap: var(--space-3);
    width: 100%;
    max-width: 90rem;
    margin: 0 auto;
    padding: var(--space-3);
  }

  &__details {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }

  // Phones and tablets: the page scrolls as a whole, and the tabs stay in reach at the top.
  &__tabs {
    position: sticky;
    top: 3.75rem;
    z-index: 5;
    box-shadow: 0 -0.5rem 0 var(--color-bg);
  }

  // The tab already names the list, so a panel's own heading is kept for assistive
  // technology only.
  &__section :deep(.base-panel__header) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  @media (max-width: 63.9375rem) {
    &__section :deep(.base-panel__body) {
      overflow: visible;
    }
  }

  // Wide screens: the track on the left, the details next to it, both filling the window.
  @media (min-width: 64rem) {
    height: 100vh;

    &__main {
      flex: 1;
      grid-template-columns: minmax(0, 1fr) 23rem;
      min-height: 0;
      padding: var(--space-4);
    }

    &__details {
      min-height: 0;
    }

    &__tabs {
      position: static;
    }

    &__section {
      flex: 1;
      min-height: 0;
    }
  }
}
</style>
