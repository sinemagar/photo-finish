<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import ProgrammePanel from '@/components/programme/ProgrammePanel.vue'
import ResultsPanel from '@/components/results/ResultsPanel.vue'
import StablePanel from '@/components/stable/StablePanel.vue'
import TrackPanel from '@/components/track/TrackPanel.vue'
import { useFrameLoop } from '@/composables/useFrameLoop'
import { useMeetingStore } from '@/stores/meeting'

const meeting = useMeetingStore()

// The only place where real time enters the game.
useFrameLoop(meeting.tick, () => meeting.isClockRunning)
</script>

<template>
  <div class="app">
    <AppHeader
      :can-generate="meeting.canGenerate"
      :can-toggle="meeting.canToggle"
      :toggle-label="meeting.toggleLabel"
      @generate="meeting.generateProgramme"
      @toggle="meeting.toggle"
    />
    <main class="app__main">
      <StablePanel class="app__stable" />
      <TrackPanel class="app__track" />
      <ProgrammePanel class="app__programme" />
      <ResultsPanel class="app__results" />
    </main>
  </div>
</template>

<style scoped lang="scss">
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  &__main {
    display: grid;
    flex: 1;
    gap: var(--space-4);
    padding: var(--space-4);
    // Narrow screens: one column, with the track first.
    grid-template-areas: 'track' 'programme' 'results' 'stable';
  }

  &__stable {
    grid-area: stable;
  }

  &__track {
    grid-area: track;
  }

  &__programme {
    grid-area: programme;
  }

  &__results {
    grid-area: results;
  }

  @media (min-width: 48rem) {
    &__main {
      grid-template-columns: 1fr 1fr;
      grid-template-areas:
        'track track'
        'programme results'
        'stable stable';
    }
  }

  @media (min-width: 80rem) {
    height: 100vh;

    &__main {
      min-height: 0;
      grid-template-columns: 20rem minmax(0, 1fr) 15rem 17rem;
      grid-template-areas: 'stable track programme results';
    }
  }
}
</style>
