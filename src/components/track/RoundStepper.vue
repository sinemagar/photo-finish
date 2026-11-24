<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Number of rounds in the meeting. */
  total: number
  /** How many rounds have been run. */
  completed: number
  /** The round on the track right now, if a meeting is under way. */
  current: number | null
}>()

type StepState = 'done' | 'current' | 'upcoming'

const LABELS: Record<StepState, string> = {
  done: 'finished',
  current: 'on the track',
  upcoming: 'to come',
}

const steps = computed(() =>
  Array.from({ length: props.total }, (_, index) => {
    const round = index + 1
    const state: StepState =
      round <= props.completed ? 'done' : round === props.current ? 'current' : 'upcoming'

    return { round, state, label: `Round ${round}, ${LABELS[state]}` }
  }),
)
</script>

<template>
  <ol class="round-stepper" aria-label="Rounds of the meeting" data-testid="round-stepper">
    <li
      v-for="step in steps"
      :key="step.round"
      class="round-stepper__step"
      :class="`round-stepper__step--${step.state}`"
      :aria-current="step.state === 'current' ? 'step' : undefined"
    >
      <span aria-hidden="true">{{ step.round }}</span>
      <span class="visually-hidden">{{ step.label }}</span>
    </li>
  </ol>
</template>

<style scoped lang="scss">
.round-stepper {
  display: flex;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;

  &__step {
    display: grid;
    place-items: center;
    width: 1.625rem;
    height: 1.625rem;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 700;
    font-variant-numeric: tabular-nums;

    &--done {
      border-color: transparent;
      background: var(--color-surface-muted);
      color: var(--color-text);
    }

    &--current {
      border-color: var(--color-primary);
      background: var(--color-primary);
      color: var(--color-primary-contrast);
    }
  }
}
</style>
