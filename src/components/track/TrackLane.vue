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
    <div class="track-lane__gate">
      <span class="track-lane__number"> <span class="visually-hidden">Lane </span>{{ lane }} </span>
      <span v-if="runner" class="track-lane__name">{{ runner.horse.name }}</span>
    </div>
    <div class="track-lane__course">
      <div v-if="runner" class="track-lane__mover" :style="moverStyle" data-testid="track-runner">
        <div class="track-lane__horse">
          <span
            v-if="runner.position !== null"
            class="track-lane__position"
            :data-position="runner.position"
            data-testid="track-position"
          >
            {{ formatOrdinal(runner.position) }}
          </span>
          <HorseSprite :color="runner.horse.color.hex" :number="lane" :galloping="isGalloping" />
        </div>
      </div>
    </div>
  </li>
</template>

<style scoped lang="scss">
.track-lane {
  display: grid;
  grid-template-columns: var(--gate-width) 1fr;
  height: var(--lane-height);

  &__gate {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
    padding: 0 var(--space-2);
    border-bottom: 1px solid rgb(255 255 255 / 12%);
    background: var(--color-turf-dark);
    color: var(--color-rail);
  }

  &__number {
    display: grid;
    flex: none;
    place-items: center;
    width: min(1.5rem, calc(var(--lane-height) - 0.375rem));
    height: min(1.5rem, calc(var(--lane-height) - 0.375rem));
    border-radius: var(--radius-sm);
    background: var(--color-rail);
    color: var(--color-turf-dark);
    font-size: var(--font-size-xs);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  &__name {
    overflow: hidden;
    font-size: var(--font-size-xs);
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__course {
    position: relative;
    min-width: 0;
    border-bottom: 1px dashed rgb(255 255 255 / 40%);
    background: var(--color-turf);
  }

  &:nth-child(even) &__course {
    background: var(--color-turf-alt);
  }

  &:last-child &__course,
  &:last-child &__gate {
    border-bottom: 0;
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
    height: calc(var(--sprite-width) * 0.7);
    transform: translateY(-50%);
  }

  &__position {
    position: absolute;
    top: 50%;
    right: 100%;
    margin-right: var(--space-1);
    padding: 0 var(--space-2);
    transform: translateY(-50%);
    border-radius: 1rem;
    background: var(--color-rail);
    color: var(--color-podium-contrast);
    font-size: 0.6875rem;
    font-weight: 700;
    line-height: 1.6;
    white-space: nowrap;

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

  // On a narrow screen the gate shrinks to the lane number; the saddle cloth and the
  // programme still tell the horses apart.
  @media (max-width: 40rem) {
    &__gate {
      justify-content: center;
      padding: 0;
    }

    &__name {
      display: none;
    }
  }
}
</style>
