<script setup lang="ts">
import { computed } from 'vue'

import type { TrackRunner } from '@/stores/meeting'
import { formatDistance } from '@/utils/format'

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
    /** Round distance in metres; labels the distance markers when given. */
    distance?: number
    /** Whether the race is moving right now; drives the gallop animation. */
    racing?: boolean
  }>(),
  { distance: undefined, racing: false },
)

const MARKER_SHARES = [0, 0.25, 0.5, 0.75] as const

const laneNumbers = computed(() => Array.from({ length: props.lanes }, (_, index) => index + 1))
const runnersByLane = computed(() => new Map(props.runners.map((runner) => [runner.lane, runner])))

/** Start line and quarter markers, placed on the same scale the horses move along. */
const markers = computed(() =>
  MARKER_SHARES.map((share) => ({
    share,
    // The start is recognisable by its heavier line; the quarters carry their distance.
    label: share > 0 && props.distance ? formatDistance(Math.round(props.distance * share)) : '',
  })),
)
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
    <div class="race-track__ruler" aria-hidden="true">
      <span class="race-track__finish-label">Finish</span>
    </div>
    <div class="race-track__markers" aria-hidden="true">
      <span
        v-for="marker in markers"
        :key="marker.share"
        class="race-track__marker"
        :class="{ 'race-track__marker--start': marker.share === 0 }"
        :style="{ '--share': marker.share }"
      >
        <span class="race-track__marker-label">{{ marker.label }}</span>
      </span>
    </div>
    <span class="race-track__finish" aria-hidden="true" />
  </div>
</template>

<style scoped lang="scss">
.race-track {
  --lane-height: clamp(2.25rem, 5.2vh, 3.5rem);
  --sprite-width: calc(var(--lane-height) * 1.36);
  --gate-width: 10rem;
  --ruler-height: 1.5rem;
  --finish-width: 0.5rem;

  position: relative;
  overflow: hidden;
  border: 2px solid var(--color-rail);
  border-radius: var(--radius-sm);
  background: var(--color-turf-dark);

  // Phones: lanes scale with the height of the screen so the whole track always fits
  // above the tabs; the gate shrinks to the lane number.
  @media (max-width: 40rem) {
    --lane-height: clamp(1.5rem, 3.6dvh, 2.25rem);
    --gate-width: 2rem;
    --ruler-height: 1.125rem;
  }

  &__lanes {
    margin: 0;
    // Room on the right for the finish line, so a finished horse stops right at it.
    padding: 0 var(--finish-width) 0 0;
    list-style: none;
  }

  // Floodlights: brighter in the middle of the track, falling off towards the corners.
  &::after {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 55% 40%, rgb(255 255 255 / 9%), transparent 60%),
      linear-gradient(rgb(0 0 0 / 0%) 55%, rgb(0 0 0 / 22%));
    content: '';
    pointer-events: none;
  }

  &__ruler {
    position: relative;
    height: var(--ruler-height);
  }

  &__finish-label,
  &__marker-label {
    position: absolute;
    bottom: 0;
    color: rgb(255 255 255 / 85%);
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: var(--ruler-height);
    white-space: nowrap;
  }

  &__finish-label {
    right: calc(var(--finish-width) + var(--space-2));
  }

  // Spans the course only, so that a share of its width is a share of the distance.
  &__markers {
    position: absolute;
    inset: 0 var(--finish-width) 0 var(--gate-width);
    pointer-events: none;
  }

  &__marker {
    position: absolute;
    top: 0;
    bottom: 0;
    // The same mapping the horses use: their nose starts one sprite into the course.
    left: calc(var(--sprite-width) + var(--share) * (100% - var(--sprite-width)));
    border-left: 1px solid rgb(255 255 255 / 22%);

    &--start {
      border-left: 2px solid rgb(255 255 255 / 70%);
    }
  }

  // Labels sit to the left of their line, which keeps the last one clear of "Finish".
  &__marker-label {
    right: var(--space-1);
  }

  &__finish {
    position: absolute;
    inset: 0 0 var(--ruler-height) auto;
    width: var(--finish-width);
    background: repeating-conic-gradient(#16201b 0% 25%, #ffffff 0% 50%) 0 0 / 0.5rem 0.5rem;
  }
}
</style>
