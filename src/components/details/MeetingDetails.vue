<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import ProgrammePanel from '@/components/programme/ProgrammePanel.vue'
import ResultsPanel from '@/components/results/ResultsPanel.vue'
import StablePanel from '@/components/stable/StablePanel.vue'
import BaseTabs, { type TabItem } from '@/components/ui/BaseTabs.vue'
import { useMeetingStore } from '@/stores/meeting'

/**
 * The results, programme and stable, sharing one panel behind tabs. The tab follows the
 * meeting until the player picks one: the stable before anything is planned, the
 * programme once it is generated, the results from the first finished round.
 */
type SectionId = 'results' | 'programme' | 'stable'

const SECTION_PREFIX = 'section'

const meeting = useMeetingStore()

const activeSection = ref<SectionId>('stable')
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

function follow(section: SectionId) {
  if (!hasChosenSection.value) activeSection.value = section
}

watch(
  () => meeting.status,
  (status) => {
    if (status === 'ready') follow('programme')
  },
)

watch(
  () => meeting.results.length,
  (count, previous) => {
    if (count === 1 && previous === 0) follow('results')
  },
)

const sectionAttrs = (section: SectionId) => ({
  id: `${SECTION_PREFIX}-panel-${section}`,
  role: 'tabpanel',
  'aria-labelledby': `${SECTION_PREFIX}-tab-${section}`,
})
</script>

<template>
  <section class="meeting-details" aria-label="Meeting details">
    <BaseTabs
      class="meeting-details__tabs"
      :model-value="activeSection"
      :tabs="tabs"
      :id-prefix="SECTION_PREFIX"
      label="Meeting details"
      @update:model-value="chooseSection"
    />
    <ResultsPanel
      v-show="activeSection === 'results'"
      class="meeting-details__section"
      v-bind="sectionAttrs('results')"
    />
    <ProgrammePanel
      v-show="activeSection === 'programme'"
      class="meeting-details__section"
      v-bind="sectionAttrs('programme')"
    />
    <StablePanel
      v-show="activeSection === 'stable'"
      class="meeting-details__section"
      v-bind="sectionAttrs('stable')"
    />
  </section>
</template>

<style scoped lang="scss">
.meeting-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;

  // On a phone the page scrolls as a whole, and the tabs stay in reach under the header.
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

  // Wide screens: beside the track, filling the window, each list scrolling on its own.
  @media (min-width: 64rem) {
    min-height: 0;

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
