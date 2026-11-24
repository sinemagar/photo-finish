<script setup lang="ts">
import { computed } from 'vue'

import BasePanel from '@/components/ui/BasePanel.vue'
import { ROUND_DISTANCES, RUNNERS_PER_ROUND, type MeetingStatus } from '@/domain'
import { useMeetingStore } from '@/stores/meeting'
import { useSessionStore } from '@/stores/session'
import { formatDistance } from '@/utils/format'

import MeetingStatusBadge from './MeetingStatusBadge.vue'
import RaceTrack from './RaceTrack.vue'
import RoundStepper from './RoundStepper.vue'
import SpeedControl from './SpeedControl.vue'

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
const session = useSessionStore()

const title = computed(() => {
  const round = meeting.currentRound
  return round ? `Round ${round.number} · ${formatDistance(round.distance)}` : 'Track'
})

const speed = computed({
  get: () => session.speed,
  set: (value) => session.setSpeed(value),
})

const roundOnTrack = computed(() =>
  meeting.status === 'idle' || meeting.status === 'finished'
    ? null
    : (meeting.currentRound?.number ?? null),
)
</script>

<template>
  <BasePanel :title="title" data-testid="track-panel">
    <template #actions>
      <div class="track-panel__actions">
        <SpeedControl v-model="speed" />
        <MeetingStatusBadge :status="meeting.status" />
      </div>
    </template>
    <div class="track-panel__stage">
      <RaceTrack
        :runners="meeting.trackRunners"
        :lanes="RUNNERS_PER_ROUND"
        :distance="meeting.currentRound?.distance"
        :racing="meeting.status === 'running'"
      />
      <p
        v-if="SPOTLIGHT.includes(meeting.status)"
        class="track-panel__spotlight"
        data-testid="track-status"
      >
        {{ STATUS_MESSAGES[meeting.status] }}
      </p>
    </div>
    <div class="track-panel__footer">
      <RoundStepper
        :total="ROUND_DISTANCES.length"
        :completed="meeting.results.length"
        :current="roundOnTrack"
      />
      <p
        v-if="!SPOTLIGHT.includes(meeting.status)"
        class="track-panel__status"
        data-testid="track-status"
      >
        {{ STATUS_MESSAGES[meeting.status] }}
      </p>
    </div>
  </BasePanel>
</template>

<style scoped lang="scss">
.track-panel {
  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__stage {
    position: relative;
  }

  &__spotlight {
    position: absolute;
    top: 50%;
    left: 50%;
    width: max-content;
    max-width: calc(100% - var(--space-6) * 2);
    padding: var(--space-3) var(--space-6);
    transform: translate(-50%, -50%);
    border: 1px solid rgb(255 255 255 / 12%);
    border-radius: var(--radius);
    background: rgb(6 14 10 / 86%);
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 600;
    text-align: center;
  }

  &__footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-4);
    margin-top: var(--space-3);
  }

  &__status {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
}
</style>
