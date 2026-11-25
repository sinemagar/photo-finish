<script setup lang="ts">
import { computed } from 'vue'

import { useMeetingStore } from '@/stores/meeting'
import { useStableStore } from '@/stores/stable'
import { formatRaceTime, formatRoundHeading } from '@/utils/format'

import { STATUS_MESSAGES } from '../statusMessages'
import MeetingSummary, { type SummaryEntry } from './MeetingSummary.vue'
import RoundResultBanner, { type PodiumEntry } from './RoundResultBanner.vue'
import WelcomeCard from './WelcomeCard.vue'

/**
 * What is shown over the track, depending on the state of the meeting: the welcome card
 * before a programme exists, a notice while paused, the podium during the break between
 * rounds, and the summary once the meeting is over. Nothing while a round is running.
 */
defineEmits<{
  /** The player asked how the game works. */
  help: []
}>()

const PODIUM_SIZE = 3

const meeting = useMeetingStore()
const stable = useStableStore()

/** The first three of the round that has just finished. */
const podium = computed(() =>
  (meeting.latestResult?.placings ?? []).slice(0, PODIUM_SIZE).flatMap((placing): PodiumEntry[] => {
    const horse = stable.getHorse(placing.horseId)
    return horse ? [{ position: placing.position, horse, time: formatRaceTime(placing.time) }] : []
  }),
)

const nextHeading = computed(() => {
  const round = meeting.nextRound
  return round ? formatRoundHeading(round) : undefined
})

const horsesOfTheDay = computed(() =>
  meeting.standings.slice(0, PODIUM_SIZE).flatMap((record): SummaryEntry[] => {
    const horse = stable.getHorse(record.horseId)
    return horse ? [{ horse, wins: record.wins, podiums: record.podiums }] : []
  }),
)
</script>

<template>
  <WelcomeCard
    v-if="meeting.status === 'idle'"
    class="race-overlay race-overlay--centre race-overlay--welcome"
    @generate="meeting.generateProgramme"
    @help="$emit('help')"
  />
  <p
    v-else-if="meeting.status === 'paused'"
    class="race-overlay race-overlay--centre race-overlay__notice"
    data-testid="track-status"
  >
    {{ STATUS_MESSAGES.paused }}
  </p>
  <RoundResultBanner
    v-else-if="meeting.status === 'intermission' && meeting.latestResult"
    class="race-overlay race-overlay--corner"
    :round-number="meeting.latestResult.roundNumber"
    :podium="podium"
    :next-heading="nextHeading"
    :countdown="meeting.nextRoundCountdown"
  />
  <MeetingSummary
    v-else-if="meeting.status === 'finished'"
    class="race-overlay race-overlay--corner race-overlay--wide"
    :leaders="horsesOfTheDay"
    @restart="meeting.generateProgramme"
  />
</template>

<style scoped lang="scss">
.race-overlay {
  position: absolute;

  &--centre {
    top: 50%;
    left: 50%;
    width: max-content;
    max-width: calc(100% - var(--space-6) * 2);
    transform: translate(-50%, -50%);
  }

  // Tucked into the bottom-left corner, leaving the horses and the finish in view.
  &--corner {
    bottom: var(--space-3);
    left: var(--space-3);
    width: min(19rem, calc(100% - var(--space-6)));
  }

  &--wide {
    width: min(23rem, 70%);
  }

  &--welcome {
    width: min(24rem, calc(100% - var(--space-4) * 2));
    max-width: none;
  }

  &__notice {
    margin: 0;
    padding: var(--space-3) var(--space-6);
    border: 1px solid var(--color-overlay-border);
    border-radius: var(--radius);
    background: var(--color-overlay);
    box-shadow: var(--shadow-overlay);
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 600;
    text-align: center;
  }
}
</style>
