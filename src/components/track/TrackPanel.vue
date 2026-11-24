<script setup lang="ts">
import { computed } from 'vue'

import BasePanel from '@/components/ui/BasePanel.vue'
import { RUNNERS_PER_ROUND, type MeetingStatus } from '@/domain'
import { useMeetingStore } from '@/stores/meeting'
import { formatDistance } from '@/utils/format'

import RaceTrack from './RaceTrack.vue'

const STATUS_MESSAGES: Record<MeetingStatus, string> = {
  idle: 'Generate a programme to set up the meeting.',
  ready: 'The field is at the start. Press Start to begin.',
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
    <RaceTrack
      :runners="meeting.trackRunners"
      :lanes="RUNNERS_PER_ROUND"
      :racing="meeting.status === 'running'"
    />
  </BasePanel>
</template>

<style scoped lang="scss">
.track-panel__status {
  margin-bottom: var(--space-3);
  color: var(--color-text-muted);
}
</style>
