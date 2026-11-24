<script setup lang="ts">
import { computed } from 'vue'

import HorseBadge from '@/components/shared/HorseBadge.vue'
import type { TrackRunner } from '@/stores/meeting'

const props = withDefaults(
  defineProps<{
    runners: TrackRunner[]
    /** How many of the leading horses to show. */
    size?: number
  }>(),
  { size: 3 },
)

const leaders = computed(() =>
  props.runners
    .filter((runner) => runner.rank !== null && runner.rank <= props.size)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)),
)
</script>

<template>
  <!-- Not a live region: the order changes many times a second and would flood a screen reader. -->
  <ol
    v-if="leaders.length > 0"
    class="live-leaders"
    aria-label="Leading horses"
    data-testid="live-leaders"
  >
    <li v-for="runner in leaders" :key="runner.lane" class="live-leaders__item">
      <span class="live-leaders__rank" :data-rank="runner.rank">{{ runner.rank }}</span>
      <HorseBadge :horse="runner.horse" />
    </li>
  </ol>
</template>

<style scoped lang="scss">
.live-leaders {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-4);
  min-width: 0;
  margin: 0;
  padding: 0;
  font-size: var(--font-size-sm);
  list-style: none;

  &__item {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__rank {
    display: grid;
    place-items: center;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    color: var(--color-podium-contrast);
    font-size: var(--font-size-xs);
    font-weight: 700;

    &[data-rank='1'] {
      background: var(--color-gold);
    }

    &[data-rank='2'] {
      background: var(--color-silver);
    }

    &[data-rank='3'] {
      background: var(--color-bronze);
    }
  }

  // On a phone three names do not fit on one line, so the leader alone is named.
  @media (max-width: 40rem) {
    &__item:not(:first-child) :deep(.horse-badge__name) {
      display: none;
    }
  }
}
</style>
