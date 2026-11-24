<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import type { ToggleLabel } from '@/stores/meeting'

defineProps<{
  canGenerate: boolean
  canToggle: boolean
  toggleLabel: ToggleLabel
}>()

defineEmits<{
  generate: []
  toggle: []
  help: []
}>()
</script>

<template>
  <header class="app-header">
    <div class="app-header__brand">
      <svg class="app-header__mark" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M10 25V13a6 6 0 0 1 12 0v12" />
      </svg>
      <div>
        <h1 class="app-header__title">Photo Finish</h1>
        <p class="app-header__tagline">Six rounds. Twenty horses. One finish line.</p>
      </div>
    </div>
    <div class="app-header__actions">
      <button
        type="button"
        class="app-header__help"
        aria-label="How it works"
        data-testid="help-button"
        @click="$emit('help')"
      >
        ?
      </button>
      <BaseButton data-testid="generate-button" :disabled="!canGenerate" @click="$emit('generate')">
        Generate<span class="app-header__wide"> Programme</span>
      </BaseButton>
      <BaseButton
        data-testid="toggle-button"
        variant="primary"
        :disabled="!canToggle"
        @click="$emit('toggle')"
      >
        {{ toggleLabel }}
      </BaseButton>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: rgb(9 18 14 / 80%);
  backdrop-filter: blur(8px);

  &__brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }

  &__mark {
    flex: none;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: var(--radius-sm);
    background: var(--color-surface-muted);
    fill: none;
    stroke: var(--color-accent);
    stroke-width: 4;
    stroke-linecap: round;
  }

  &__title {
    font-family: var(--font-display);
    font-size: 1.625rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1.1;
    text-transform: uppercase;
    white-space: nowrap;
  }

  &__tagline {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }

  &__actions {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--space-2);
  }

  &__help {
    display: grid;
    flex: none;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    border: 1px solid rgb(255 255 255 / 28%);
    border-radius: 50%;
    background: none;
    color: var(--color-text);
    font-family: var(--font-display);
    font-size: 1.125rem;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background: rgb(255 255 255 / 12%);
    }
  }

  // On a narrow screen the brand shrinks so the two actions always fit on one line.
  @media (max-width: 40rem) {
    padding-inline: var(--space-3);

    &__tagline,
    &__wide {
      display: none;
    }

    &__title {
      font-size: 1.25rem;
    }

    // The mark gives its place to the help button; the name alone identifies the game.
    &__mark {
      display: none;
    }

    &__help {
      width: 2rem;
      height: 2rem;
    }

    &__brand {
      gap: var(--space-2);
    }

    :deep(.base-button) {
      min-width: 0;
      padding-inline: var(--space-3);
    }
  }
}
</style>
