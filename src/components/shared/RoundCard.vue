<script setup lang="ts">
import { useId } from 'vue'

import type { Horse } from '@/domain'

import HorseBadge from './HorseBadge.vue'

export interface RoundCardRow {
  /** Lane number in the programme, finishing position in the results. */
  rank: number
  horse: Horse
  /** Optional trailing value, such as the finish time. */
  detail?: string
}

export type RoundCardState = 'upcoming' | 'active' | 'done'

withDefaults(
  defineProps<{
    heading: string
    rankLabel: string
    rows: RoundCardRow[]
    detailLabel?: string
    /** One line shown next to the heading, readable while the card is collapsed. */
    summary?: string
    state?: RoundCardState
    /** Decorates ranks 1 to 3 as gold, silver and bronze. */
    podium?: boolean
    expanded?: boolean
  }>(),
  { detailLabel: undefined, summary: undefined, state: 'upcoming', podium: false, expanded: true },
)

defineEmits<{
  toggle: []
}>()

const tableId = useId()
</script>

<template>
  <section class="round-card" :class="[`round-card--${state}`, { 'round-card--podium': podium }]">
    <h3 class="round-card__header">
      <button
        type="button"
        class="round-card__toggle"
        :aria-expanded="expanded"
        :aria-controls="tableId"
        @click="$emit('toggle')"
      >
        <span class="round-card__heading" data-testid="round-heading">{{ heading }}</span>
        <span v-if="summary" class="round-card__summary" data-testid="round-summary">
          {{ summary }}
        </span>
        <svg class="round-card__chevron" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
    </h3>
    <table v-show="expanded" :id="tableId" class="round-card__table" :aria-label="heading">
      <thead>
        <tr>
          <th scope="col" class="round-card__rank">{{ rankLabel }}</th>
          <th scope="col">Horse</th>
          <th v-if="detailLabel" scope="col" class="round-card__detail">{{ detailLabel }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.horse.id">
          <td class="round-card__rank">
            <span class="round-card__rank-mark" :data-rank="row.rank">{{ row.rank }}</span>
          </td>
          <td><HorseBadge :horse="row.horse" /></td>
          <td v-if="detailLabel" class="round-card__detail">{{ row.detail }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped lang="scss">
.round-card {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-raised);

  & + & {
    margin-top: var(--space-2);
  }

  &--active {
    border-color: var(--color-primary);
  }

  &__header {
    font: inherit;
  }

  &__toggle {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;

    &:hover {
      background: var(--color-hover);
    }

    &:focus-visible {
      outline-offset: -2px;
    }
  }

  &__heading {
    flex: none;
    font-size: var(--font-size-sm);
    font-weight: 700;
  }

  &__summary {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    text-align: end;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &--active &__summary {
    color: var(--color-primary);
    font-weight: 600;
  }

  &__chevron {
    flex: none;
    width: 1rem;
    height: 1rem;
    margin-left: auto;
    fill: none;
    stroke: var(--color-text-muted);
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform var(--duration-fast);
  }

  &__summary + &__chevron {
    margin-left: 0;
  }

  &__toggle[aria-expanded='true'] &__chevron {
    transform: rotate(180deg);
  }

  &__table {
    width: 100%;
    border-top: 1px solid var(--color-border);
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  th,
  td {
    padding: 0.1875rem var(--space-2);
    text-align: start;

    &:first-child {
      padding-left: var(--space-3);
    }

    &:last-child {
      padding-right: var(--space-3);
    }
  }

  th {
    padding-top: var(--space-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 500;
  }

  tbody tr:last-child td {
    padding-bottom: var(--space-2);
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
    &[data-rank='1'],
    &[data-rank='2'],
    &[data-rank='3'] {
      color: var(--color-podium-contrast);
      font-weight: 700;
    }

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

  &__detail {
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
    text-align: end !important;
  }

  @media (prefers-reduced-motion: reduce) {
    &__chevron {
      transition: none;
    }
  }
}
</style>
