<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

import RoundCard, { type RoundCardRow } from '@/components/shared/RoundCard.vue'
import BasePanel from '@/components/ui/BasePanel.vue'
import { useAutoExpand } from '@/composables/useAutoExpand'
import { useRevealInScroller } from '@/composables/useRevealInScroller'
import { useMeetingStore } from '@/stores/meeting'
import { useStableStore } from '@/stores/stable'
import { formatDistance, formatRaceTime } from '@/utils/format'

const meeting = useMeetingStore()
const stable = useStableStore()

const rounds = computed(() =>
  meeting.results.map((result) => {
    const rows = result.placings.flatMap((placing): RoundCardRow[] => {
      const horse = stable.getHorse(placing.horseId)
      return horse ? [{ rank: placing.position, horse, detail: formatRaceTime(placing.time) }] : []
    })
    const winner = rows[0]

    return {
      number: result.roundNumber,
      heading: `Round ${result.roundNumber} · ${formatDistance(result.distance)}`,
      winner,
      // Readable while collapsed, so earlier rounds stay useful at a glance.
      summary: winner ? `Won by ${winner.horse.name}` : undefined,
      rows,
    }
  }),
)

const latest = computed(() => rounds.value[rounds.value.length - 1])
const latestNumber = computed(() => latest.value?.number ?? null)

/** Spoken summary of the most recent result, for screen-reader users. */
const announcement = computed(() => {
  const winner = latest.value?.winner
  if (!latest.value || !winner) return ''

  return `Round ${latest.value.number} finished. Winner: ${winner.horse.name}.`
})

// Each new result opens and comes into view; the previous one folds to its winner.
const { isExpanded, toggle } = useAutoExpand(latestNumber)

const list = useTemplateRef<HTMLElement>('list')
useRevealInScroller(list, latestNumber, () =>
  latestNumber.value === null ? null : `[data-round="${latestNumber.value}"]`,
)
</script>

<template>
  <BasePanel title="Results" data-testid="results-panel">
    <p class="visually-hidden" aria-live="polite" data-testid="results-announcement">
      {{ announcement }}
    </p>
    <p v-if="rounds.length === 0" class="results-panel__empty">
      Results appear here as each round finishes.
    </p>
    <div ref="list">
      <RoundCard
        v-for="round in rounds"
        :key="round.number"
        data-testid="result-round"
        :data-round="round.number"
        :heading="round.heading"
        rank-label="Pos"
        detail-label="Time"
        :rows="round.rows"
        :summary="round.summary"
        state="done"
        podium
        :expanded="isExpanded(round.number)"
        @toggle="toggle(round.number)"
      />
    </div>
  </BasePanel>
</template>

<style scoped lang="scss">
.results-panel__empty {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
