<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Coat colour as a CSS colour value. */
    color: string
    /** Number shown on the saddle cloth, normally the lane. */
    number?: number
    /** Plays the gallop cycle. Off while the horse is waiting, paused or finished. */
    galloping?: boolean
  }>(),
  { number: undefined, galloping: false },
)

/**
 * Each leg is a thigh that swings from the hip and a shin that folds at the knee.
 * `origin` is the hip and `knee` the joint below it, in viewBox units.
 */
const LEGS = [
  { id: 'hind-far', x: 29, origin: '31.5px 39px', knee: '31.5px 52px', far: true },
  { id: 'fore-far', x: 65, origin: '67.5px 38px', knee: '67.5px 52px', far: true },
  { id: 'hind-near', x: 34, origin: '36.5px 40px', knee: '36.5px 52px', far: false },
  { id: 'fore-near', x: 70, origin: '72.5px 38px', knee: '72.5px 52px', far: false },
] as const
</script>

<template>
  <svg
    class="horse-sprite"
    :class="{ 'horse-sprite--galloping': galloping }"
    :style="{ '--horse-color': color }"
    viewBox="0 0 100 70"
    aria-hidden="true"
  >
    <g class="horse-sprite__figure">
      <path class="horse-sprite__hair horse-sprite__tail" d="M24 28 C14 25 10 33 6 45" />

      <template v-for="leg in LEGS" :key="leg.id">
        <g
          v-if="leg.far"
          class="horse-sprite__leg horse-sprite__leg--far"
          :class="`horse-sprite__leg--${leg.id}`"
          :style="{ transformOrigin: leg.origin }"
        >
          <rect class="horse-sprite__coat" :x="leg.x" y="36" width="5" height="17" rx="2.5" />
          <g class="horse-sprite__shin" :style="{ transformOrigin: leg.knee }">
            <rect
              class="horse-sprite__coat"
              :x="leg.x + 0.75"
              y="50"
              width="3.5"
              height="13"
              rx="1.75"
            />
            <rect
              class="horse-sprite__hoof"
              :x="leg.x + 0.25"
              y="61.5"
              width="4.5"
              height="3.5"
              rx="1"
            />
          </g>
        </g>
      </template>

      <path
        class="horse-sprite__coat"
        d="M22 31 C22 23 33 21 45 22 C54 23 60 20 67 21 C76 23 80 31 76 39 C72 46 57 46 47 44 C36 43 25 45 22 37 Z"
      />
      <path
        class="horse-sprite__coat"
        d="M64 23 C67 15 73 9 79 5 L82 1 L84.5 6 C89 8 94 13 96 18 C96.5 21 94 23 91 22 L83 18.5 C81 25 79 31 76 36 Z"
      />
      <path class="horse-sprite__hair" d="M64.5 21.5 C68 14 73 8.5 79.5 4.5" />

      <template v-if="number !== undefined">
        <rect class="horse-sprite__cloth" x="43" y="22" width="14" height="12" rx="2" />
        <text class="horse-sprite__number" x="50" y="31.4">{{ number }}</text>
      </template>

      <template v-for="leg in LEGS" :key="leg.id">
        <g
          v-if="!leg.far"
          class="horse-sprite__leg"
          :class="`horse-sprite__leg--${leg.id}`"
          :style="{ transformOrigin: leg.origin }"
        >
          <rect class="horse-sprite__coat" :x="leg.x" y="36" width="5" height="17" rx="2.5" />
          <g class="horse-sprite__shin" :style="{ transformOrigin: leg.knee }">
            <rect
              class="horse-sprite__coat"
              :x="leg.x + 0.75"
              y="50"
              width="3.5"
              height="13"
              rx="1.75"
            />
            <rect
              class="horse-sprite__hoof"
              :x="leg.x + 0.25"
              y="61.5"
              width="4.5"
              height="3.5"
              rx="1"
            />
          </g>
        </g>
      </template>

      <circle class="horse-sprite__eye" cx="88.5" cy="12.5" r="1.1" />
    </g>
  </svg>
</template>

<style scoped lang="scss">
$outline: #16201b;
$stride: 0.44s;

.horse-sprite {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;

  &__coat {
    fill: var(--horse-color);
    stroke: $outline;
    stroke-width: 1.4;
    stroke-linejoin: round;
  }

  &__leg,
  &__shin,
  &__figure {
    transform-box: view-box;
  }

  &__leg--far {
    filter: brightness(0.72);
  }

  &__figure {
    transform-origin: 50px 40px;
  }

  &__hoof,
  &__eye {
    fill: $outline;
  }

  &__hair {
    fill: none;
    stroke: $outline;
    stroke-width: 3.6;
    stroke-linecap: round;
  }

  &__cloth {
    fill: #ffffff;
    stroke: $outline;
    stroke-width: 1;
  }

  &__number {
    fill: $outline;
    font-size: 9px;
    font-weight: 700;
    text-anchor: middle;
  }

  &--galloping &__figure {
    animation: horse-rock $stride ease-in-out infinite;
  }

  &--galloping &__leg {
    animation: horse-thigh $stride linear infinite;
  }

  &--galloping &__shin {
    animation: horse-shin $stride linear infinite;
  }

  // A rotary gallop: the hind pair lands first, then the fore pair, each pair slightly split.
  @each $leg, $phase in (hind-far: 0, hind-near: 0.12, fore-far: 0.5, fore-near: 0.62) {
    &--galloping &__leg--#{$leg},
    &--galloping &__leg--#{$leg} &__shin {
      animation-delay: -$stride * $phase;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &--galloping &__figure,
    &--galloping &__leg,
    &--galloping &__shin {
      animation: none;
    }
  }
}

// Positive angles swing a leg backwards, negative ones forwards.
@keyframes horse-thigh {
  0% {
    transform: rotate(-42deg);
  }

  45% {
    transform: rotate(38deg);
  }

  100% {
    transform: rotate(-42deg);
  }
}

// The shin stays straight while the hoof is on the ground and folds while it swings forward.
@keyframes horse-shin {
  0%,
  40% {
    transform: rotate(0deg);
  }

  70% {
    transform: rotate(75deg);
  }

  100% {
    transform: rotate(0deg);
  }
}

@keyframes horse-rock {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg);
  }

  50% {
    transform: translateY(-2px) rotate(2deg);
  }
}
</style>
