<script setup lang="ts">
import { computed } from 'vue'

import RoundTable, { type RoundTableRow } from '@/components/shared/RoundTable.vue'
import BasePanel from '@/components/ui/BasePanel.vue'
import { useMeetingStore } from '@/stores/meeting'
import { useStableStore } from '@/stores/stable'
import { formatDistance } from '@/utils/format'

const meeting = useMeetingStore()
const stable = useStableStore()

const rounds = computed(() =>
  meeting.programme.map((round) => ({
    number: round.number,
    heading: `Round ${round.number} · ${formatDistance(round.distance)}`,
    active: meeting.currentRound?.number === round.number && meeting.status !== 'ready',
    rows: round.runners.flatMap((runner): RoundTableRow[] => {
      const horse = stable.getHorse(runner.horseId)
      return horse ? [{ rank: runner.lane, horse }] : []
    }),
  })),
)
</script>

<template>
  <BasePanel title="Programme" data-testid="programme-panel">
    <p v-if="rounds.length === 0" class="programme-panel__empty">No programme yet.</p>
    <RoundTable
      v-for="round in rounds"
      :key="round.number"
      data-testid="programme-round"
      :heading="round.heading"
      rank-label="Lane"
      :rows="round.rows"
      :active="round.active"
    />
  </BasePanel>
</template>

<style scoped lang="scss">
.programme-panel__empty {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
