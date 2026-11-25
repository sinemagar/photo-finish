<script setup lang="ts">
import { computed, ref } from 'vue'

import BasePanel from '@/components/ui/BasePanel.vue'
import { ROUND_DISTANCES } from '@/domain'
import type { CameraMode } from '@/renderers/3d/geometry/cameras'
import { useMeetingStore } from '@/stores/meeting'
import { useSessionStore } from '@/stores/session'
import { formatRoundHeading } from '@/utils/format'

import SpeedControl from './controls/SpeedControl.vue'
import ViewControl from './controls/ViewControl.vue'
import RaceOverlay from './overlays/RaceOverlay.vue'
import RaceStage from './RaceStage.vue'
import LiveLeaders from './status/LiveLeaders.vue'
import MeetingStatusBadge from './status/MeetingStatusBadge.vue'
import RoundStepper from './status/RoundStepper.vue'
import { STATUS_MESSAGES } from './statusMessages'

/**
 * The race: a title with the round and its status, the track with its overlay, the view
 * and speed controls, and the progress of the meeting underneath.
 */
defineEmits<{
  /** The player asked how the game works. */
  help: []
}>()

const meeting = useMeetingStore()
const session = useSessionStore()

const title = computed(() => {
  const round = meeting.currentRound
  return round ? formatRoundHeading(round) : 'Track'
})

const speed = computed({
  get: () => session.speed,
  set: (value) => session.setSpeed(value),
})

const renderer = computed({
  get: () => session.renderer,
  set: (value) => session.setRenderer(value),
})

const camera = ref<CameraMode>('tv')

const roundOnTrack = computed(() =>
  meeting.status === 'idle' || meeting.status === 'finished'
    ? null
    : (meeting.currentRound?.number ?? null),
)
</script>

<template>
  <BasePanel :title="title" data-testid="race-panel">
    <template #actions>
      <MeetingStatusBadge :status="meeting.status" />
    </template>
    <RaceStage :camera="camera">
      <RaceOverlay @help="$emit('help')" />
    </RaceStage>
    <div class="race-panel__toolbar">
      <ViewControl v-model:camera="camera" v-model:renderer="renderer" />
      <SpeedControl v-model="speed" />
    </div>
    <div class="race-panel__footer">
      <RoundStepper
        :total="ROUND_DISTANCES.length"
        :completed="meeting.results.length"
        :current="roundOnTrack"
      />
      <LiveLeaders v-if="meeting.status === 'running'" :runners="meeting.trackRunners" />
      <!-- Announced to screen readers; the paused notice is shown over the track instead. -->
      <p
        v-if="meeting.status !== 'idle' && meeting.status !== 'paused'"
        class="visually-hidden"
        data-testid="track-status"
      >
        {{ STATUS_MESSAGES[meeting.status] }}
      </p>
    </div>
  </BasePanel>
</template>

<style scoped lang="scss">
.race-panel {
  &__toolbar {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    margin-top: var(--space-3);
    overflow-x: auto;
  }

  &__footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-4);
    min-height: 1.75rem;
    margin-top: var(--space-3);
  }
}
</style>
