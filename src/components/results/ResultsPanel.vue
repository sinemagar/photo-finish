<script setup lang="ts">
import { computed } from 'vue'

import RoundTable, { type RoundTableRow } from '@/components/shared/RoundTable.vue'
import BasePanel from '@/components/ui/BasePanel.vue'
import { useMeetingStore } from '@/stores/meeting'
import { useStableStore } from '@/stores/stable'
import { formatDistance, formatRaceTime } from '@/utils/format'

const meeting = useMeetingStore()
const stable = useStableStore()

const rounds = computed(() =>
  meeting.results.map((result) => ({
    number: result.roundNumber,
    heading: `Round ${result.roundNumber} · ${formatDistance(result.distance)}`,
    rows: result.placings.flatMap((placing): RoundTableRow[] => {
      const horse = stable.getHorse(placing.horseId)
      return horse ? [{ rank: placing.position, horse, detail: formatRaceTime(placing.time) }] : []
    }),
  })),
)

/** Spoken summary of the most recent result, for screen-reader users. */
const announcement = computed(() => {
  const latest = rounds.value[rounds.value.length - 1]
  const winner = latest?.rows[0]
  if (!latest || !winner) return ''

  return `Round ${latest.number} finished. Winner: ${winner.horse.name}.`
})
</script>

<template>
  <BasePanel title="Results" data-testid="results-panel">
    <p class="visually-hidden" aria-live="polite" data-testid="results-announcement">
      {{ announcement }}
    </p>
    <p v-if="rounds.length === 0" class="results-panel__empty">
      Results appear here as each round finishes.
    </p>
    <RoundTable
      v-for="round in rounds"
      :key="round.number"
      data-testid="result-round"
      :heading="round.heading"
      rank-label="Pos"
      detail-label="Time"
      :rows="round.rows"
    />
  </BasePanel>
</template>

<style scoped lang="scss">
.results-panel__empty {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
