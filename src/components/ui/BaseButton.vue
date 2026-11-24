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
  font: inherit;
  font-weight: 600;
  line-height: 1.25;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--duration-fast),
    border-color var(--duration-fast);

  &--primary {
    min-width: 6.5rem;
    background: var(--color-accent);
    color: var(--color-accent-contrast);

    &:hover:not(:disabled) {
      background: var(--color-accent-strong);
    }
  }

  &--secondary {
    border-color: rgb(255 255 255 / 55%);
    background: transparent;
    color: var(--color-primary-contrast);

    &:hover:not(:disabled) {
      background: rgb(255 255 255 / 12%);
    }
  }

  &:focus-visible {
    outline-color: var(--color-primary-contrast);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}
</style>
