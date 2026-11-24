<script setup lang="ts">
import HorseBadge from '@/components/shared/HorseBadge.vue'
import BasePanel from '@/components/ui/BasePanel.vue'
import { CONDITION_RANGE } from '@/domain'
import { useStableStore } from '@/stores/stable'

const stable = useStableStore()

const conditionShare = (condition: number) => `${(condition * 100) / CONDITION_RANGE.max}%`
</script>

<template>
  <BasePanel :title="`Stable (${stable.horses.length} horses)`" data-testid="stable-panel">
    <table class="stable-table">
      <thead>
        <tr>
          <th scope="col">Horse</th>
          <th scope="col">Colour</th>
          <th scope="col" class="stable-table__condition">Condition</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="horse in stable.horses" :key="horse.id" data-testid="stable-row">
          <td><HorseBadge :horse="horse" /></td>
          <td class="stable-table__colour">{{ horse.color.name }}</td>
          <td class="stable-table__condition">
            <span class="stable-table__meter" aria-hidden="true">
              <span
                class="stable-table__meter-fill"
                :style="{ width: conditionShare(horse.condition) }"
              />
            </span>
            <span class="stable-table__value">{{ horse.condition }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </BasePanel>
</template>

<style scoped lang="scss">
.stable-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);

  th,
  td {
    padding: 0.3125rem var(--space-2);
    text-align: start;
    white-space: nowrap;
  }

  th {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 500;
  }

  tbody tr + tr {
    border-top: 1px solid var(--color-border);
  }

  &__colour {
    color: var(--color-text-muted);
  }

  &__condition {
    text-align: end !important;
  }

  &__meter {
    display: inline-block;
    width: 2.25rem;
    height: 0.375rem;
    margin-right: var(--space-2);
    overflow: hidden;
    border-radius: 1rem;
    background: var(--color-surface-muted);
    vertical-align: middle;
  }

  &__meter-fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--color-primary);
  }

  &__value {
    display: inline-block;
    min-width: 1.75rem;
    font-variant-numeric: tabular-nums;
  }
}
</style>
