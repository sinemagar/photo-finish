<script setup lang="ts">
import { computed } from 'vue'

import HorseBadge from '@/components/shared/HorseBadge.vue'
import BasePanel from '@/components/ui/BasePanel.vue'
import type { MeetingStatus } from '@/domain'
import { useMeetingStore } from '@/stores/meeting'
import { formatDistance } from '@/utils/format'

const STATUS_MESSAGES: Record<MeetingStatus, string> = {
  idle: 'Generate a programme to set up the meeting.',
  ready: 'The programme is ready. Press Start to begin.',
  running: 'The race is on.',
  paused: 'Paused.',
  intermission: 'Round finished. The next round starts shortly.',
  finished: 'The meeting is over. Generate a new programme to race again.',
}

const meeting = useMeetingStore()

const title = computed(() => {
  const round = meeting.currentRound
  return round ? `Round ${round.number} · ${formatDistance(round.distance)}` : 'Track'
})
</script>

<template>
  <BasePanel :title="title" data-testid="track-panel">
    <p class="track-panel__status" data-testid="track-status">
      {{ STATUS_MESSAGES[meeting.status] }}
    </p>
    <ol v-if="meeting.trackRunners.length > 0" class="track-panel__lanes">
      <li
        v-for="runner in meeting.trackRunners"
        :key="runner.lane"
        class="track-panel__lane"
        data-testid="track-lane"
      >
        <span class="track-panel__lane-number">{{ runner.lane }}</span>
        <HorseBadge :horse="runner.horse" />
        <progress
          class="track-panel__progress"
          max="1"
          :value="runner.progress"
          :aria-label="`${runner.horse.name} progress`"
        />
      </li>
    </ol>
  </BasePanel>
</template>

<style scoped lang="scss">
.track-panel {
  &__status {
    color: var(--color-text-muted);
  }

  &__lanes {
    display: grid;
    gap: var(--space-2);
    margin: var(--space-4) 0 0;
    padding: 0;
    list-style: none;
  }

  &__lane {
    display: grid;
    grid-template-columns: 1.5rem 10rem 1fr;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
  }

  &__lane-number {
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
    text-align: end;
  }

  &__progress {
    width: 100%;
    accent-color: var(--color-primary);
  }
}
</style>
