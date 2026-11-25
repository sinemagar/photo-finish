<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

import { RUNNERS_PER_ROUND } from '@/domain'
import Track2D from '@/renderers/2d/Track2D.vue'
import type { CameraMode } from '@/renderers/3d/geometry/cameras'
import { useMeetingStore } from '@/stores/meeting'
import { useSessionStore } from '@/stores/session'

/**
 * The track itself, drawn by whichever renderer the session asks for, with room on top
 * for an overlay. Both renderers take the same runners from the meeting store.
 */
defineProps<{
  camera: CameraMode
}>()

const meeting = useMeetingStore()
const session = useSessionStore()

/**
 * The 3D track is a separate download (three.js and the horse model). If it cannot be
 * loaded or drawn, the 2D track takes its place.
 */
const Track3D = defineAsyncComponent({
  loader: () => import('@/renderers/3d/Track3D.vue'),
  onError: (_error, _retry, fail) => {
    session.setRenderer('2d')
    fail()
  },
})
</script>

<template>
  <div class="race-stage" :class="{ 'race-stage--3d': session.renderer === '3d' }">
    <Track3D
      v-if="session.renderer === '3d'"
      :runners="meeting.trackRunners"
      :distance="meeting.currentRound?.distance"
      :paused="meeting.status === 'paused'"
      :camera="camera"
      @error="session.setRenderer('2d')"
    />
    <Track2D
      v-else
      :runners="meeting.trackRunners"
      :lanes="RUNNERS_PER_ROUND"
      :distance="meeting.currentRound?.distance"
      :racing="meeting.status === 'running'"
    />
    <slot />
  </div>
</template>

<style scoped lang="scss">
.race-stage {
  position: relative;

  // The 3D track arrives a moment after the page; holding its space avoids a jump.
  &--3d {
    aspect-ratio: 16 / 9;
    border-radius: var(--radius-sm);
    background: linear-gradient(#bcd6e6, #3f8f4a);

    @media (max-width: 40rem) {
      aspect-ratio: 4 / 3;
    }
  }
}
</style>
