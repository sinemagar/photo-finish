<script setup lang="ts">
import HorseBadge from '@/components/shared/HorseBadge.vue'
import type { Horse } from '@/domain'

export interface PodiumEntry {
  position: number
  horse: Horse
  time: string
}

defineProps<{
  /** Number of the round that has just finished. */
  roundNumber: number
  /** The first finishers, best first. */
  podium: PodiumEntry[]
  /** Heading of the round that follows, e.g. "Round 2 · 1400 m". */
  nextHeading?: string
  /** Whole seconds until the next round starts. */
  countdown?: number | null
}>()
</script>

<template>
  <section class="result-banner" aria-label="Round result" data-testid="result-banner">
    <h3 class="result-banner__title">Round {{ roundNumber }} result</h3>
    <ol class="result-banner__podium">
      <li
        v-for="entry in podium"
        :key="entry.position"
        class="result-banner__entry"
        :class="{ 'result-banner__entry--winner': entry.position === 1 }"
      >
        <span class="result-banner__position" :data-position="entry.position">
          {{ entry.position }}
        </span>
        <HorseBadge :horse="entry.horse" />
        <span class="result-banner__time">{{ entry.time }}</span>
      </li>
    </ol>
    <p v-if="nextHeading" class="result-banner__next" data-testid="next-round">
      <span class="result-banner__next-label">Next: {{ nextHeading }}</span>
      <span v-if="countdown" class="result-banner__countdown" data-testid="countdown">
        {{ countdown }}
      </span>
    </p>
  </section>
</template>

<style scoped lang="scss">
.result-banner {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-overlay-border);
  border-radius: var(--radius);
  background: var(--color-overlay);
  backdrop-filter: blur(6px);
  box-shadow: var(--shadow-overlay);

  &__title {
    color: var(--color-primary);
    font-family: var(--font-display);
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  &__podium {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    font-size: var(--font-size-sm);
    list-style: none;
  }

  &__entry {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-2);

    &--winner {
      font-size: 1.0625rem;
      font-weight: 700;
    }
  }

  &__position {
    display: grid;
    place-items: center;
    width: 1.375rem;
    height: 1.375rem;
    border-radius: 50%;
    color: var(--color-podium-contrast);
    font-size: var(--font-size-xs);
    font-weight: 700;

    &[data-position='1'] {
      background: var(--color-gold);
    }

    &[data-position='2'] {
      background: var(--color-silver);
    }

    &[data-position='3'] {
      background: var(--color-bronze);
    }
  }

  &__time {
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
    font-weight: 400;
  }

  &__next-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__next {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding-top: var(--space-2);
    border-top: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  &__countdown {
    display: grid;
    flex: none;
    place-items: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    background: var(--color-primary);
    color: var(--color-primary-contrast);
    font-family: var(--font-display);
    font-size: 1.125rem;
    font-weight: 700;
  }

  // On a phone the track is small: the winner and the countdown are what matter.
  @media (max-width: 40rem) {
    padding: var(--space-2) var(--space-3);

    &__entry:not(&__entry--winner),
    &__time {
      display: none;
    }

    &__entry--winner {
      grid-template-columns: auto 1fr;
      font-size: 1rem;
    }
  }
}
</style>
