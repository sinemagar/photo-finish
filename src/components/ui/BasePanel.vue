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
    <!-- Focusable so that keyboard users can scroll a panel whose content overflows. -->
    <div class="base-panel__body" tabindex="0" role="group" :aria-labelledby="titleId">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.base-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  box-shadow: var(--shadow);

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    min-height: 3rem;
    padding: var(--space-2) var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  &__title {
    font-family: var(--font-display);
    font-size: var(--font-size-lg);
    font-weight: 700;
    letter-spacing: 0.01em;
    line-height: 1.2;
    text-transform: uppercase;
  }

  &__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: var(--space-3) var(--space-4) var(--space-4);
    scrollbar-color: var(--color-border) transparent;
    scrollbar-width: thin;

    &:focus-visible {
      outline-offset: -2px;
    }
  }
}
</style>
