<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary'
    disabled?: boolean
  }>(),
  { variant: 'secondary', disabled: false },
)
</script>

<template>
  <button type="button" class="base-button" :class="`base-button--${variant}`" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped lang="scss">
.base-button {
  padding: var(--space-2) var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  min-height: 2.5rem;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 650;
  line-height: 1.25;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--duration-fast),
    border-color var(--duration-fast);

  &--primary {
    min-width: 6.25rem;
    background: var(--color-primary);
    color: var(--color-primary-contrast);

    &:hover:not(:disabled) {
      background: var(--color-primary-strong);
    }
  }

  &--secondary {
    border-color: var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);

    &:hover:not(:disabled) {
      background: var(--color-surface-muted);
    }
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}
</style>
