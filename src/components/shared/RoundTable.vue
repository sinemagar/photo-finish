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
  }>(),
  { detailLabel: undefined, active: false },
)
</script>

<template>
  <table class="round-table" :class="{ 'round-table--active': active }">
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
        <td class="round-table__rank">{{ row.rank }}</td>
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

  & + & {
    margin-top: var(--space-4);
  }

  &__caption {
    padding: var(--space-1) var(--space-2);
    border-radius: var(--space-1);
    background: var(--color-bg);
    font-weight: 600;
    text-align: start;
  }

  &--active &__caption {
    background: var(--color-primary);
    color: var(--color-primary-contrast);
  }

  th,
  td {
    padding: var(--space-1) var(--space-2);
    text-align: start;
  }

  th {
    color: var(--color-text-muted);
    font-weight: 500;
  }

  &__rank {
    width: 3rem;
  }

  &__detail {
    font-variant-numeric: tabular-nums;
    text-align: end !important;
  }
}
</style>
