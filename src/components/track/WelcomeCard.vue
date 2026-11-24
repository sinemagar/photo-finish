<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'

defineEmits<{
  generate: []
  help: []
}>()

const STEPS = [
  { action: 'Generate', detail: 'a programme of six rounds' },
  { action: 'Start', detail: 'the meeting' },
  { action: 'Watch', detail: 'the results come in' },
] as const
</script>

<template>
  <section class="welcome-card" aria-label="Welcome" data-testid="welcome-card">
    <h3 class="welcome-card__title">Race night</h3>
    <p class="welcome-card__lead" data-testid="track-status">
      Generate a programme to set up the meeting.
    </p>
    <ol class="welcome-card__steps">
      <li v-for="(step, index) in STEPS" :key="step.action" class="welcome-card__step">
        <span class="welcome-card__index" aria-hidden="true">{{ index + 1 }}</span>
        <span>
          <strong>{{ step.action }}</strong> {{ step.detail }}
        </span>
      </li>
    </ol>
    <div class="welcome-card__actions">
      <BaseButton variant="primary" data-testid="welcome-generate" @click="$emit('generate')">
        Generate programme
      </BaseButton>
      <button
        type="button"
        class="welcome-card__link"
        data-testid="welcome-help"
        @click="$emit('help')"
      >
        How it works
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.welcome-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  border: 1px solid var(--color-overlay-border);
  border-radius: var(--radius);
  background: var(--color-overlay);
  backdrop-filter: blur(6px);
  box-shadow: var(--shadow-overlay);

  &__title {
    color: var(--color-primary);
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1.1;
    text-transform: uppercase;
  }

  &__lead {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  &__steps {
    display: grid;
    gap: var(--space-1);
    margin: var(--space-1) 0;
    padding: 0;
    font-size: var(--font-size-sm);
    list-style: none;
  }

  &__step {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__index {
    display: grid;
    flex: none;
    place-items: center;
    width: 1.375rem;
    height: 1.375rem;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 700;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-4);
  }

  &__link {
    padding: var(--space-1) 0;
    border: 0;
    background: none;
    color: var(--color-text);
    font: inherit;
    font-size: var(--font-size-sm);
    text-decoration: underline;
    text-underline-offset: 0.2em;
    cursor: pointer;
  }

  // On a phone the track is short: the steps move to the "How it works" dialog.
  @media (max-width: 40rem) {
    padding: var(--space-3) var(--space-4);

    &__steps {
      display: none;
    }

    &__title {
      font-size: 1.375rem;
    }
  }
}
</style>
