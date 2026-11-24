<script setup lang="ts">
import type { Horse } from '@/domain'

defineProps<{
  horse: Horse
}>()
</script>

<template>
  <span class="horse-badge">
    <span
      class="horse-badge__swatch"
      :style="{ backgroundColor: horse.color.hex }"
      aria-hidden="true"
    />
    <span class="horse-badge__name">{{ horse.name }}</span>
  </span>
</template>

<style scoped lang="scss">
.horse-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;

  &__swatch {
    flex: none;
    width: 0.75rem;
    height: 0.75rem;
    box-shadow: 0 0 0 1px rgb(255 255 255 / 35%);
    border-radius: 50%;
  }
}
</style>
