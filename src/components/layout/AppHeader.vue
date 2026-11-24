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
    <h1 class="app-header__title">Photo Finish</h1>
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
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);

  &__title {
    font-size: 1.25rem;
  }

  &__actions {
    display: flex;
    gap: var(--space-2);
  }
}
</style>
