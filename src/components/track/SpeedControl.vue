<script setup lang="ts">
import { useId } from 'vue'

withDefaults(
  defineProps<{
    options?: readonly number[]
  }>(),
  { options: () => [1, 2, 4] },
)

/** Playback speed multiplier. */
const speed = defineModel<number>({ required: true })

const groupName = useId()
</script>

<template>
  <fieldset class="speed-control" data-testid="speed-control">
    <legend class="visually-hidden">Playback speed</legend>
    <label
      v-for="option in options"
      :key="option"
      class="speed-control__option"
      :class="{ 'speed-control__option--selected': option === speed }"
    >
      <!-- Native radios give arrow-key navigation and a single tab stop for free. -->
      <input
        v-model="speed"
        class="visually-hidden"
        type="radio"
        :name="groupName"
        :value="option"
        :data-testid="`speed-${option}`"
      />
      <span aria-hidden="true">{{ option }}×</span>
      <span class="visually-hidden">{{ option }} times</span>
    </label>
  </fieldset>
</template>

<style scoped lang="scss">
.speed-control {
  display: inline-flex;
  gap: 2px;
  margin: 0;
  padding: 3px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);

  &__option {
    position: relative;
    display: inline-grid;
    place-items: center;
    min-width: 2.75rem;
    min-height: 2.25rem;
    padding: 0 var(--space-2);
    border-radius: calc(var(--radius-sm) - 2px);
    color: var(--color-text-muted);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    cursor: pointer;

    &:hover {
      color: var(--color-text);
    }

    &--selected {
      background: var(--color-accent);
      color: var(--color-accent-contrast);
    }

    &:has(:focus-visible) {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
  }
}
</style>
