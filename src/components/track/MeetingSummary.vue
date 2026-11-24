<script setup lang="ts">
import HorseBadge from '@/components/shared/HorseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { Horse } from '@/domain'

export interface SummaryEntry {
  horse: Horse
  wins: number
  podiums: number
}

defineProps<{
  /** The best horses of the meeting, best first. */
  leaders: SummaryEntry[]
}>()

defineEmits<{
  restart: []
}>()

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`
</script>

<template>
  <section class="meeting-summary" aria-label="Meeting summary" data-testid="meeting-summary">
    <h3 class="meeting-summary__title">Meeting complete</h3>
    <p class="meeting-summary__lead">Horses of the day</p>
    <ol class="meeting-summary__list">
      <li v-for="(entry, index) in leaders" :key="entry.horse.id" class="meeting-summary__entry">
        <span class="meeting-summary__position" :data-position="index + 1">{{ index + 1 }}</span>
        <HorseBadge :horse="entry.horse" />
        <span class="meeting-summary__record">
          {{ plural(entry.wins, 'win')
          }}<span class="meeting-summary__podiums">, {{ plural(entry.podiums, 'podium') }}</span>
        </span>
      </li>
    </ol>
    <BaseButton variant="primary" data-testid="restart-button" @click="$emit('restart')">
      New programme
    </BaseButton>
  </section>
</template>

<style scoped lang="scss">
.meeting-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: var(--radius);
  background: rgb(6 14 10 / 90%);
  box-shadow: var(--shadow);

  &__title {
    color: var(--color-accent);
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  &__lead {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  &__list {
    display: grid;
    gap: var(--space-1);
    margin: 0 0 var(--space-2);
    padding: 0;
    font-size: var(--font-size-sm);
    list-style: none;
  }

  &__entry {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-2);
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

  &__record {
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  @media (max-width: 40rem) {
    padding: var(--space-2) var(--space-3);

    &__lead,
    &__podiums {
      display: none;
    }

    &__list {
      margin-bottom: var(--space-1);
    }
  }
}
</style>
