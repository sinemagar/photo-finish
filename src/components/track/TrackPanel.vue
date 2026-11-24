<script setup lang="ts">
import { computed } from 'vue'

import BasePanel from '@/components/ui/BasePanel.vue'
import { RUNNERS_PER_ROUND, type MeetingStatus } from '@/domain'
import { useMeetingStore } from '@/stores/meeting'
import { formatDistance } from '@/utils/format'

import MeetingStatusBadge from './MeetingStatusBadge.vue'
import RaceTrack from './RaceTrack.vue'

const STATUS_MESSAGES: Record<MeetingStatus, string> = {
  idle: 'Generate a programme to set up the meeting.',
  ready: 'The field is at the start. Press Start to begin.',
  running: 'The race is on.',
  paused: 'Paused.',
  intermission: 'Round finished. The next round starts shortly.',
  finished: 'The meeting is over. Generate a new programme to race again.',
}

/**
 * States in which the message is shown over the track. The finished state is left out on
 * purpose: the final positions on the finish line should stay readable.
 */
const SPOTLIGHT: readonly MeetingStatus[] = ['idle', 'paused']

const meeting = useMeetingStore()

const title = computed(() => {
  const round = meeting.currentRound
  return round ? `Round ${round.number} · ${formatDistance(round.distance)}` : 'Track'
})
</script>

<template>
  <BasePanel :title="title" data-testid="track-panel">
    <template #actions>
      <MeetingStatusBadge :status="meeting.status" />
    </template>
    <div class="track-panel__stage">
      <RaceTrack
        :runners="meeting.trackRunners"
        :lanes="RUNNERS_PER_ROUND"
        :distance="meeting.currentRound?.distance"
        :racing="meeting.status === 'running'"
      />
      <p
        class="track-panel__status"
        :class="{ 'track-panel__status--spotlight': SPOTLIGHT.includes(meeting.status) }"
        data-testid="track-status"
      >
        {{ STATUS_MESSAGES[meeting.status] }}
      </p>
    </div>
  </BasePanel>
</template>

<style scoped lang="scss">
.track-panel {
  &__stage {
    position: relative;
  }

  &__status {
    margin-top: var(--space-3);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);

    &--spotlight {
      position: absolute;
      top: 50%;
      left: 50%;
      width: max-content;
      max-width: calc(100% - var(--space-6) * 2);
      margin: 0;
      padding: var(--space-3) var(--space-6);
      transform: translate(-50%, -50%);
      border-radius: var(--radius);
      background: rgb(12 30 20 / 82%);
      color: var(--color-primary-contrast);
      font-size: 1rem;
      font-weight: 600;
      text-align: center;
    }
  }
}
</style>
