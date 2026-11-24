<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AppHeader from '@/components/layout/AppHeader.vue'
import ProgrammePanel from '@/components/programme/ProgrammePanel.vue'
import ResultsPanel from '@/components/results/ResultsPanel.vue'
import StablePanel from '@/components/stable/StablePanel.vue'
import TrackPanel from '@/components/track/TrackPanel.vue'
import BaseTabs, { type TabItem } from '@/components/ui/BaseTabs.vue'
import { useFrameLoop } from '@/composables/useFrameLoop'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useMeetingStore } from '@/stores/meeting'

type SectionId = 'results' | 'programme' | 'stable'

const SECTION_PREFIX = 'section'

const meeting = useMeetingStore()

// The only place where real time enters the game.
useFrameLoop(meeting.tick, () => meeting.isClockRunning)

/**
 * Below 1024 px the three lists share one area behind tabs, so the track and the controls
 * stay in view. On wider screens all three are shown side by side and the tabs disappear.
 */
const isCompact = useMediaQuery('(max-width: 63.9375rem)')

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

function sectionAttrs(section: SectionId) {
  if (!isCompact.value) return {}

  return {
    id: `${SECTION_PREFIX}-panel-${section}`,
    role: 'tabpanel',
    'aria-labelledby': `${SECTION_PREFIX}-tab-${section}`,
  }
}

const isShown = (section: SectionId) => !isCompact.value || activeSection.value === section
</script>

<template>
  <div class="app" :class="{ 'app--compact': isCompact }">
    <AppHeader
      :can-generate="meeting.canGenerate"
      :can-toggle="meeting.canToggle"
      :toggle-label="meeting.toggleLabel"
      @generate="meeting.generateProgramme"
      @toggle="meeting.toggle"
    />
    <main class="app__main">
      <div class="app__slot app__slot--track">
        <TrackPanel />
      </div>
      <BaseTabs
        v-if="isCompact"
        class="app__tabs"
        :model-value="activeSection"
        :tabs="tabs"
        :id-prefix="SECTION_PREFIX"
        label="Meeting details"
        @update:model-value="chooseSection"
      />
      <div
        v-show="isShown('stable')"
        class="app__slot app__slot--stable"
        v-bind="sectionAttrs('stable')"
      >
        <StablePanel />
      </div>
      <div
        v-show="isShown('programme')"
        class="app__slot app__slot--programme"
        v-bind="sectionAttrs('programme')"
      >
        <ProgrammePanel />
      </div>
      <div
        v-show="isShown('results')"
        class="app__slot app__slot--results"
        v-bind="sectionAttrs('results')"
      >
        <ResultsPanel />
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 34rem;

  &__main {
    display: grid;
    flex: 1;
    gap: var(--space-4);
    min-height: 0;
    padding: var(--space-4);
    // Laptops: the track keeps most of the width, the stable sits below it.
    grid-template-columns: minmax(0, 1fr) 15.5rem 19.5rem;
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-areas:
      'track programme results'
      'stable programme results';
  }

  &__slot {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;

    > * {
      flex: 1;
    }

    &--track {
      grid-area: track;
    }

    &--stable {
      grid-area: stable;
    }

    &--programme {
      grid-area: programme;
    }

    &--results {
      grid-area: results;
    }
  }

  // Wide screens: four columns side by side.
  @media (min-width: 90rem) {
    &__main {
      grid-template-columns: 21rem minmax(0, 1fr) 15.5rem 19.5rem;
      grid-template-rows: minmax(0, 1fr);
      grid-template-areas: 'stable track programme results';
    }
  }

  // Phones and tablets: track on top, one list at a time below it, nothing off screen.
  &--compact &__main {
    gap: var(--space-2);
    padding: var(--space-2);
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto minmax(0, 1fr);
    grid-template-areas: 'track' 'tabs' 'section';
  }

  &--compact &__tabs {
    grid-area: tabs;
  }

  &--compact &__slot:not(&__slot--track) {
    grid-area: section;

    // The tab already names the list, so its own heading is kept for assistive
    // technology only.
    :deep(.base-panel__header) {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  }
}
</style>
