<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  title: string
}>()

const titleId = useId()
</script>

<template>
  <section class="base-panel" :aria-labelledby="titleId">
    <header class="base-panel__header">
      <h2 :id="titleId" class="base-panel__title">{{ title }}</h2>
      <slot name="actions" />
    </header>
    <div class="base-panel__body">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.base-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  &__title {
    font-size: 1rem;
  }

  &__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: var(--space-3) var(--space-4);
  }
}
</style>
