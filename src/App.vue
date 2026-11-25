<script setup lang="ts">
import { ref } from 'vue'

import MeetingDetails from '@/components/details/MeetingDetails.vue'
import HowItWorksDialog from '@/components/help/HowItWorksDialog.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import RacePanel from '@/components/race/RacePanel.vue'
import { useFrameLoop } from '@/composables/useFrameLoop'
import { useTheme } from '@/composables/useTheme'
import { useMeetingStore } from '@/stores/meeting'

/**
 * The page: the header with the main actions, the race, and the details of the meeting.
 * Also the only place where real time enters the game.
 */
const meeting = useMeetingStore()
useFrameLoop(meeting.tick, () => meeting.isClockRunning)

const isHelpOpen = ref(false)
const { theme, toggle: toggleTheme } = useTheme()
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
      <RacePanel @help="isHelpOpen = true" />
      <MeetingDetails />
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

  // Wide screens: the track on the left, the details beside it, both filling the window.
  @media (min-width: 64rem) {
    height: 100vh;

    &__main {
      flex: 1;
      grid-template-columns: minmax(0, 1fr) 23rem;
      grid-template-rows: minmax(0, 1fr);
      min-height: 0;
      padding: var(--space-4);
    }
  }
}
</style>
