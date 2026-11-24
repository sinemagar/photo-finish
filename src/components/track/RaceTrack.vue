<script setup lang="ts">
import { computed } from 'vue'

import type { TrackRunner } from '@/stores/meeting'

import TrackLane from './TrackLane.vue'

/**
 * Draws the track. This component is the renderer boundary: it receives the runners and
 * how far each has got, and knows nothing about stores, rules or time. Another renderer
 * that accepts the same props could replace it without touching the rest of the game.
 */
const props = withDefaults(
  defineProps<{
    runners: TrackRunner[]
    /** Number of lanes to draw, including empty ones. */
    lanes: number
    /** Whether the race is moving right now; drives the gallop animation. */
    racing?: boolean
  }>(),
  { racing: false },
)

const laneNumbers = computed(() => Array.from({ length: props.lanes }, (_, index) => index + 1))
const runnersByLane = computed(() => new Map(props.runners.map((runner) => [runner.lane, runner])))
</script>

<template>
  <div class="race-track" data-testid="race-track">
    <ol class="race-track__lanes">
      <TrackLane
        v-for="lane in laneNumbers"
        :key="lane"
        :lane="lane"
        :runner="runnersByLane.get(lane)"
        :racing="racing"
      />
    </ol>
    <span class="race-track__finish" aria-hidden="true">Finish</span>
  </div>
</template>

<style scoped lang="scss">
.race-track {
  --lane-height: 2.75rem;
  --color-turf: #2f7d4a;
  --color-turf-dark: #1f5a34;
  --finish-width: 0.5rem;

  position: relative;
  overflow: hidden;
  border-radius: var(--radius);

  @media (max-width: 30rem) {
    --lane-height: 2.25rem;
  }

  &__lanes {
    margin: 0;
    // Room on the right for the finish line, so a finished horse stops right at it.
    padding: 0 var(--finish-width) 0 0;
    background: var(--color-turf);
    list-style: none;
  }

  &__finish {
    position: absolute;
    inset: 0 0 0 auto;
    width: var(--finish-width);
    overflow: hidden;
    background: repeating-conic-gradient(#1c2420 0% 25%, #ffffff 0% 50%) 0 0 / 0.5rem 0.5rem;
    color: transparent;
    font-size: 0;
  }
}
</style>
