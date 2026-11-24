<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

import RoundTable, { type RoundTableRow } from '@/components/shared/RoundTable.vue'
import BasePanel from '@/components/ui/BasePanel.vue'
import { useRevealInScroller } from '@/composables/useRevealInScroller'
import { useMeetingStore } from '@/stores/meeting'
import { useStableStore } from '@/stores/stable'
import { formatDistance } from '@/utils/format'

const meeting = useMeetingStore()
const stable = useStableStore()

const activeRoundNumber = computed(() =>
  meeting.status === 'ready' ? null : (meeting.currentRound?.number ?? null),
)

const rounds = computed(() =>
  meeting.programme.map((round) => ({
    number: round.number,
    heading: `Round ${round.number} · ${formatDistance(round.distance)}`,
    active: round.number === activeRoundNumber.value && meeting.status !== 'finished',
    done: meeting.results.some((result) => result.roundNumber === round.number),
    rows: round.runners.flatMap((runner): RoundTableRow[] => {
      const horse = stable.getHorse(runner.horseId)
      return horse ? [{ rank: runner.lane, horse }] : []
    }),
  })),
)

// Keep the round that is on the track in view while the meeting moves through the list.
const list = useTemplateRef<HTMLElement>('list')
useRevealInScroller(list, activeRoundNumber, () =>
  activeRoundNumber.value === null ? null : `[data-round="${activeRoundNumber.value}"]`,
)
</script>

<template>
  <BasePanel title="Programme" data-testid="programme-panel">
    <p v-if="rounds.length === 0" class="programme-panel__empty">
      No programme yet. Generate one to see the six rounds and their runners.
    </p>
    <div ref="list">
      <RoundTable
        v-for="round in rounds"
        :key="round.number"
        data-testid="programme-round"
        :data-round="round.number"
        :heading="round.heading"
        rank-label="Lane"
        :rows="round.rows"
        :active="round.active"
        :muted="round.done && !round.active"
      />
    </div>
  </BasePanel>
</template>

<style scoped lang="scss">
.programme-panel__empty {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
