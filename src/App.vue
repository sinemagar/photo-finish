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
    // Phones: one column in order of importance while a meeting is on.
    grid-template-areas: 'track' 'results' 'programme' 'stable';
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

  // Tablets: the track across the top, the two lists side by side.
  @media (min-width: 48rem) {
    &__main {
      grid-template-columns: 1fr 1fr;
      grid-template-areas:
        'track track'
        'programme results'
        'stable stable';
    }
  }

  // Laptops: the track keeps most of the width, the stable moves below it. When the
  // window is tall enough everything fits one screen and each panel scrolls on its own.
  @media (min-width: 64rem) {
    &__main {
      grid-template-columns: minmax(0, 1fr) 15rem 17rem;
      grid-template-rows: auto minmax(0, 1fr);
      grid-template-areas:
        'track programme results'
        'stable programme results';
    }
  }

  @media (min-width: 64rem) and (min-height: 44rem) {
    height: 100vh;

    &__main {
      min-height: 0;
    }
  }

  // Wide screens: four columns side by side.
  @media (min-width: 90rem) {
    &__main {
      grid-template-columns: 21.5rem minmax(0, 1fr) 14.5rem 16.5rem;
      grid-template-rows: minmax(0, 1fr);
      grid-template-areas: 'stable track programme results';
    }
  }
}
</style>
