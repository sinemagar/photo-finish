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
  border: 1px solid var(--color-primary);
  border-radius: var(--radius);
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &--primary {
    background: var(--color-primary);
    color: var(--color-primary-contrast);
  }

  &--secondary {
    background: var(--color-surface);
    color: var(--color-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
