<script setup lang="ts">
import { computed } from 'vue'

import BasePanel from '@/components/ui/BasePanel.vue'
import { ROUND_DISTANCES, RUNNERS_PER_ROUND, type MeetingStatus } from '@/domain'
import { useMeetingStore } from '@/stores/meeting'
import { useSessionStore } from '@/stores/session'
import { useStableStore } from '@/stores/stable'
import { formatDistance, formatRaceTime } from '@/utils/format'

import LiveLeaders from './LiveLeaders.vue'
import MeetingStatusBadge from './MeetingStatusBadge.vue'
import MeetingSummary, { type SummaryEntry } from './MeetingSummary.vue'
import RaceTrack from './RaceTrack.vue'
import RoundResultBanner, { type PodiumEntry } from './RoundResultBanner.vue'
import RoundStepper from './RoundStepper.vue'
import SpeedControl from './SpeedControl.vue'
import WelcomeCard from './WelcomeCard.vue'

const STATUS_MESSAGES: Record<MeetingStatus, string> = {
  idle: 'Generate a programme to set up the meeting.',
  ready: 'The field is at the start. Press Start to begin.',
  running: 'The race is on.',
  paused: 'Paused.',
  intermission: 'Round finished. The next round starts shortly.',
  finished: 'The meeting is over.',
}

/** States in which something is shown over the track instead of a line below it. */
const SPOTLIGHT: readonly MeetingStatus[] = ['idle', 'paused']

defineEmits<{
  /** The player asked how the game works. */
  help: []
}>()

const PODIUM_SIZE = 3

const meeting = useMeetingStore()
const session = useSessionStore()
const stable = useStableStore()

const title = computed(() => {
  const round = meeting.currentRound
  return round ? `Round ${round.number} · ${formatDistance(round.distance)}` : 'Track'
})

const speed = computed({
  get: () => session.speed,
  set: (value) => session.setSpeed(value),
})

const roundOnTrack = computed(() =>
  meeting.status === 'idle' || meeting.status === 'finished'
    ? null
    : (meeting.currentRound?.number ?? null),
)

/** The first three of the round that has just finished, shown during the break. */
const podium = computed(() =>
  (meeting.latestResult?.placings ?? []).slice(0, PODIUM_SIZE).flatMap((placing): PodiumEntry[] => {
    const horse = stable.getHorse(placing.horseId)
    return horse ? [{ position: placing.position, horse, time: formatRaceTime(placing.time) }] : []
  }),
)

const nextHeading = computed(() => {
  const round = meeting.nextRound
  return round ? `Round ${round.number} · ${formatDistance(round.distance)}` : undefined
})

const horsesOfTheDay = computed(() =>
  meeting.standings.slice(0, PODIUM_SIZE).flatMap((record): SummaryEntry[] => {
    const horse = stable.getHorse(record.horseId)
    return horse ? [{ horse, wins: record.wins, podiums: record.podiums }] : []
  }),
)
</script>

<template>
  <BasePanel :title="title" data-testid="track-panel">
    <template #actions>
      <div class="track-panel__actions">
        <SpeedControl v-model="speed" />
        <MeetingStatusBadge :status="meeting.status" />
      </div>
    </template>
    <div class="track-panel__stage">
      <RaceTrack
        :runners="meeting.trackRunners"
        :lanes="RUNNERS_PER_ROUND"
        :distance="meeting.currentRound?.distance"
        :racing="meeting.status === 'running'"
      />
      <WelcomeCard
        v-if="meeting.status === 'idle'"
        class="track-panel__overlay track-panel__overlay--welcome"
        @generate="meeting.generateProgramme"
        @help="$emit('help')"
      />
      <p
        v-else-if="meeting.status === 'paused'"
        class="track-panel__overlay track-panel__spotlight"
        data-testid="track-status"
      >
        {{ STATUS_MESSAGES[meeting.status] }}
      </p>
      <RoundResultBanner
        v-else-if="meeting.status === 'intermission' && meeting.latestResult"
        class="track-panel__overlay track-panel__overlay--aside"
        :round-number="meeting.latestResult.roundNumber"
        :podium="podium"
        :next-heading="nextHeading"
        :countdown="meeting.nextRoundCountdown"
      />
      <MeetingSummary
        v-else-if="meeting.status === 'finished'"
        class="track-panel__overlay track-panel__overlay--aside track-panel__overlay--wide"
        :leaders="horsesOfTheDay"
        @restart="meeting.generateProgramme"
      />
    </div>
    <div class="track-panel__footer">
      <RoundStepper
        :total="ROUND_DISTANCES.length"
        :completed="meeting.results.length"
        :current="roundOnTrack"
      />
      <LiveLeaders v-if="meeting.status === 'running'" :runners="meeting.trackRunners" />
      <p
        v-if="!SPOTLIGHT.includes(meeting.status)"
        class="track-panel__status"
        :class="{ 'visually-hidden': meeting.status === 'running' }"
        data-testid="track-status"
      >
        {{ STATUS_MESSAGES[meeting.status] }}
      </p>
    </div>
  </BasePanel>
</template>

<style scoped lang="scss">
.track-panel {
  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__stage {
    position: relative;
  }

  // On a phone the header has room for the title and the speed control only; the footer
  // and the main button already say what state the meeting is in.
  @media (max-width: 40rem) {
    &__actions :deep(.status-badge) {
      display: none;
    }
  }

  &__overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    width: max-content;
    max-width: calc(100% - var(--space-6) * 2);
    transform: translate(-50%, -50%);

    // Sits over the empty part of the track, leaving the finish line and the horses on
    // it in view.
    &--aside {
      left: 42%;
      width: min(19rem, 64%);
    }

    &--wide {
      width: min(23rem, 70%);
    }

    &--welcome {
      width: min(24rem, calc(100% - var(--space-4) * 2));
      max-width: none;
    }
  }

  &__spotlight {
    padding: var(--space-3) var(--space-6);
    border: 1px solid rgb(255 255 255 / 12%);
    border-radius: var(--radius);
    background: rgb(6 14 10 / 86%);
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 600;
    text-align: center;
  }

  &__footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-4);
    min-height: 1.75rem;
    margin-top: var(--space-3);
  }

  &__status {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
}
</style>
