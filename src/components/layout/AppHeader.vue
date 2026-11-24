<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import type { ToggleLabel } from '@/stores/meeting'

defineProps<{
  canGenerate: boolean
  canToggle: boolean
  toggleLabel: ToggleLabel
}>()

defineEmits<{
  generate: []
  toggle: []
}>()
</script>

<template>
  <header class="app-header">
    <div class="app-header__brand">
      <svg class="app-header__mark" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M10 25V13a6 6 0 0 1 12 0v12" />
      </svg>
      <div>
        <h1 class="app-header__title">Photo Finish</h1>
        <p class="app-header__tagline">Six rounds. Twenty horses. One finish line.</p>
      </div>
    </div>
    <div class="app-header__actions">
      <BaseButton data-testid="generate-button" :disabled="!canGenerate" @click="$emit('generate')">
        Generate Programme
      </BaseButton>
      <BaseButton
        data-testid="toggle-button"
        variant="primary"
        :disabled="!canToggle"
        @click="$emit('toggle')"
      >
        {{ toggleLabel }}
      </BaseButton>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(120deg, var(--color-primary-strong), var(--color-primary));
  color: var(--color-primary-contrast);

  &__brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  &__mark {
    flex: none;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: var(--radius-sm);
    background: rgb(255 255 255 / 10%);
    fill: none;
    stroke: var(--color-accent);
    stroke-width: 4;
    stroke-linecap: round;
  }

  &__title {
    font-size: var(--font-size-lg);
    line-height: 1.2;
    letter-spacing: -0.01em;
  }

  &__tagline {
    color: rgb(255 255 255 / 75%);
    font-size: var(--font-size-xs);
  }

  &__actions {
    display: flex;
    gap: var(--space-2);
  }
}
</style>
