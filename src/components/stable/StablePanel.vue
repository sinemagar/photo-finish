<script setup lang="ts">
import BasePanel from '@/components/ui/BasePanel.vue'
import { CONDITION_RANGE } from '@/domain'
import { useStableStore } from '@/stores/stable'

const stable = useStableStore()

const conditionShare = (condition: number) => `${(condition * 100) / CONDITION_RANGE.max}%`
</script>

<template>
  <BasePanel :title="`Stable (${stable.horses.length} horses)`" data-testid="stable-panel">
    <ul class="stable-grid">
      <li
        v-for="horse in stable.horses"
        :key="horse.id"
        class="stable-grid__horse"
        data-testid="stable-row"
      >
        <span
          class="stable-grid__swatch"
          :style="{ backgroundColor: horse.color.hex }"
          aria-hidden="true"
        />
        <span class="stable-grid__text">
          <span class="stable-grid__name">{{ horse.name }}</span>
          <span class="stable-grid__colour">{{ horse.color.name }}</span>
        </span>
        <span class="stable-grid__condition">
          <span class="visually-hidden">Condition</span>
          <span class="stable-grid__value">{{ horse.condition }}</span>
          <span class="stable-grid__meter" aria-hidden="true">
            <span
              class="stable-grid__meter-fill"
              :style="{ width: conditionShare(horse.condition) }"
            />
          </span>
        </span>
      </li>
    </ul>
  </BasePanel>
</template>

<style scoped lang="scss">
.stable-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;

  &__horse {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
  }

  &__swatch {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgb(19 32 26 / 18%);
  }

  &__text {
    display: grid;
    min-width: 0;
    line-height: 1.25;
  }

  &__name {
    overflow: hidden;
    font-size: var(--font-size-sm);
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__colour {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }

  &__condition {
    display: grid;
    justify-items: end;
    gap: 2px;
  }

  &__value {
    font-size: var(--font-size-sm);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  &__meter {
    width: 2rem;
    height: 0.25rem;
    overflow: hidden;
    border-radius: 1rem;
    background: var(--color-surface-muted);
  }

  &__meter-fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--color-primary);
  }
}
</style>
