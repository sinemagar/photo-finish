<script setup lang="ts">
import type { Horse } from '@/domain'

import HorseBadge from './HorseBadge.vue'

export interface RoundTableRow {
  /** Lane number in the programme, finishing position in the results. */
  rank: number
  horse: Horse
  /** Optional trailing value, such as the finish time. */
  detail?: string
}

withDefaults(
  defineProps<{
    heading: string
    rankLabel: string
    rows: RoundTableRow[]
    detailLabel?: string
    /** Marks the round that is currently on the track. */
    active?: boolean
    /** Plays the round down, for example once it has been run. */
    muted?: boolean
    /** Decorates ranks 1 to 3 as gold, silver and bronze. */
    podium?: boolean
  }>(),
  { detailLabel: undefined, active: false, muted: false, podium: false },
)
</script>

<template>
  <table
    class="round-table"
    :class="{
      'round-table--active': active,
      'round-table--muted': muted,
      'round-table--podium': podium,
    }"
  >
    <caption class="round-table__caption">
      {{
        heading
      }}
      <span v-if="active" class="visually-hidden">(current round)</span>
    </caption>
    <thead>
      <tr>
        <th scope="col" class="round-table__rank">{{ rankLabel }}</th>
        <th scope="col">Horse</th>
        <th v-if="detailLabel" scope="col" class="round-table__detail">{{ detailLabel }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.horse.id">
        <td class="round-table__rank">
          <span class="round-table__rank-mark" :data-rank="row.rank">{{ row.rank }}</span>
        </td>
        <td><HorseBadge :horse="row.horse" /></td>
        <td v-if="detailLabel" class="round-table__detail">{{ row.detail }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped lang="scss">
.round-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
  transition: opacity var(--duration-fast);

  & + & {
    margin-top: var(--space-4);
  }

  &__caption {
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    background: var(--color-surface-muted);
    font-weight: 650;
    text-align: start;
  }

  &--active &__caption {
    background: var(--color-primary);
    color: var(--color-primary-contrast);
  }

  &--muted {
    opacity: 0.55;
  }

  th,
  td {
    padding: 0.1875rem var(--space-2);
    text-align: start;
  }

  th {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 500;
  }

  &__rank {
    width: 2.75rem;
  }

  &__rank-mark {
    display: inline-grid;
    place-items: center;
    min-width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    font-variant-numeric: tabular-nums;
  }

  &--podium &__rank-mark {
    &[data-rank='1'] {
      background: var(--color-gold);
      font-weight: 700;
    }

    &[data-rank='2'] {
      background: var(--color-silver);
      font-weight: 700;
    }

    &[data-rank='3'] {
      background: var(--color-bronze);
      font-weight: 700;
    }
  }

  &__detail {
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
    text-align: end !important;
  }
}
</style>
