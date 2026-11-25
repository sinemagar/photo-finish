<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

import RoundCard, {
  type RoundCardRow,
  type RoundCardState,
} from '@/components/shared/RoundCard.vue'
import BasePanel from '@/components/ui/BasePanel.vue'
import { useAutoExpand } from '@/composables/useAutoExpand'
import { useRevealInScroller } from '@/composables/useRevealInScroller'
import { useMeetingStore } from '@/stores/meeting'
import { useStableStore } from '@/stores/stable'
import { formatRoundHeading } from '@/utils/format'

const SUMMARIES: Record<RoundCardState, string | undefined> = {
  upcoming: undefined,
  active: 'On track',
  done: 'Done',
}

const meeting = useMeetingStore()
const stable = useStableStore()

/** The round the track is showing: the first one before the start, then the live one. */
const currentRoundNumber = computed(() => meeting.currentRound?.number ?? null)

const rounds = computed(() =>
  meeting.programme.map((round) => {
    const isDone = meeting.results.some((result) => result.roundNumber === round.number)
    const isOnTrack =
      round.number === currentRoundNumber.value &&
      meeting.status !== 'ready' &&
      meeting.status !== 'finished'
    const state: RoundCardState = isOnTrack ? 'active' : isDone ? 'done' : 'upcoming'

    return {
      number: round.number,
      heading: formatRoundHeading(round),
      state,
      summary: SUMMARIES[state],
      rows: round.runners.flatMap((runner): RoundCardRow[] => {
        const horse = stable.getHorse(runner.horseId)
        return horse ? [{ rank: runner.lane, horse }] : []
      }),
    }
  }),
)

// The list follows the meeting: the current round opens and comes into view by itself.
const { isExpanded, toggle } = useAutoExpand(currentRoundNumber)

const list = useTemplateRef<HTMLElement>('list')
useRevealInScroller(list, currentRoundNumber, () =>
  currentRoundNumber.value === null ? null : `[data-round="${currentRoundNumber.value}"]`,
)
</script>

<template>
  <BasePanel title="Programme" data-testid="programme-panel">
    <p v-if="rounds.length === 0" class="programme-panel__empty">
      No programme yet. Generate one to see the six rounds and their runners.
    </p>
    <div ref="list">
      <RoundCard
        v-for="round in rounds"
        :key="round.number"
        data-testid="programme-round"
        :data-round="round.number"
        :heading="round.heading"
        rank-label="Lane"
        :rows="round.rows"
        :state="round.state"
        :summary="round.summary"
        :expanded="isExpanded(round.number)"
        @toggle="toggle(round.number)"
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
