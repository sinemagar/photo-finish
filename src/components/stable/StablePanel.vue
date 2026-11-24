<script setup lang="ts">
import HorseBadge from '@/components/shared/HorseBadge.vue'
import BasePanel from '@/components/ui/BasePanel.vue'
import { useStableStore } from '@/stores/stable'

const stable = useStableStore()
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
          <td>{{ horse.color.name }}</td>
          <td class="stable-table__condition">{{ horse.condition }}</td>
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
    padding: var(--space-1) var(--space-2);
    text-align: start;
  }

  th {
    color: var(--color-text-muted);
    font-weight: 500;
  }

  tbody tr + tr {
    border-top: 1px solid var(--color-border);
  }

  &__condition {
    font-variant-numeric: tabular-nums;
    text-align: end !important;
  }
}
</style>
