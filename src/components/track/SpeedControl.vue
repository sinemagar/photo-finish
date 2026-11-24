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
  margin: 0;
  padding: 2px;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: var(--color-surface-muted);

  &__option {
    position: relative;
    min-width: 2rem;
    padding: 0 var(--space-2);
    border-radius: 1rem;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1.375rem;
    text-align: center;
    cursor: pointer;

    &--selected {
      background: var(--color-text);
      color: var(--color-bg);
    }

    &:has(:focus-visible) {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
  }
}
</style>
