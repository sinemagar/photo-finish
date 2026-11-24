<script setup lang="ts">
import { computed } from 'vue'

import type { TrackRunner } from '@/stores/meeting'
import { formatOrdinal } from '@/utils/format'

import HorseSprite from './HorseSprite.vue'

const props = withDefaults(
  defineProps<{
    lane: number
    /** The runner in this lane; an empty lane is drawn without one. */
    runner?: TrackRunner
    /** Whether the race is moving right now. */
    racing?: boolean
  }>(),
  { runner: undefined, racing: false },
)

/**
 * The mover is as wide as the course minus one sprite, so translating it by the runner's
 * progress puts the horse's nose exactly on the finish line at 100%. Only `transform`
 * changes from frame to frame, which the browser can animate without layout work.
 */
const moverStyle = computed(() => ({
  transform: `translateX(${((props.runner?.progress ?? 0) * 100).toFixed(3)}%)`,
}))

const isGalloping = computed(() => props.racing && props.runner?.position === null)
</script>

<template>
  <li class="track-lane" data-testid="track-lane">
    <span class="track-lane__number"> <span class="visually-hidden">Lane </span>{{ lane }} </span>
    <div class="track-lane__course">
      <template v-if="runner">
        <span class="track-lane__name">{{ runner.horse.name }}</span>
        <div class="track-lane__mover" :style="moverStyle" data-testid="track-runner">
          <div class="track-lane__horse">
            <span
              v-if="runner.position !== null"
              class="track-lane__position"
              data-testid="track-position"
            >
              {{ formatOrdinal(runner.position) }}
            </span>
            <HorseSprite :color="runner.horse.color.hex" :galloping="isGalloping" />
          </div>
        </div>
      </template>
    </div>
  </li>
</template>

<style scoped lang="scss">
.track-lane {
  --sprite-width: calc(var(--lane-height) * 1.2);

  display: grid;
  grid-template-columns: 2rem 1fr;
  height: var(--lane-height);

  &__number {
    display: grid;
    place-items: center;
    background: var(--color-turf-dark);
    color: var(--color-primary-contrast);
    font-size: var(--font-size-sm);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  &__course {
    position: relative;
    min-width: 0;
    border-bottom: 1px dashed rgb(255 255 255 / 45%);
    background: var(--color-turf);
  }

  &:last-child &__course {
    border-bottom: 0;
  }

  &__name {
    position: absolute;
    top: 50%;
    left: calc(var(--sprite-width) + var(--space-2));
    transform: translateY(-50%);
    color: rgb(255 255 255 / 70%);
    font-size: 0.75rem;
    white-space: nowrap;
    pointer-events: none;
  }

  &__mover {
    position: absolute;
    inset: 0 var(--sprite-width) 0 0;
    will-change: transform;
  }

  &__horse {
    position: absolute;
    top: 50%;
    left: 0;
    width: var(--sprite-width);
    height: calc(var(--lane-height) * 0.9);
    transform: translateY(-50%);
  }

  &__position {
    position: absolute;
    top: 50%;
    right: 100%;
    margin-right: var(--space-1);
    padding: 0 var(--space-1);
    transform: translateY(-50%);
    border-radius: var(--space-1);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 0.6875rem;
    font-weight: 700;
    line-height: 1.4;
  }
}
</style>
