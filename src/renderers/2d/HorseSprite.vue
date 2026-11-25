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
 * `x` is the left edge of the thigh; the hip sits at its top centre and the knee where the
 * two parts meet, all in viewBox units.
 */
const LEGS = [
  { id: 'hind-far', x: 37, far: true },
  { id: 'fore-far', x: 80, far: true },
  { id: 'hind-near', x: 43, far: false },
  { id: 'fore-near', x: 86, far: false },
] as const

const HIP_Y = 49
const KNEE_Y = 65

const hip = (x: number) => `${x + 3}px ${HIP_Y}px`
const knee = (x: number) => `${x + 3}px ${KNEE_Y}px`
</script>

<template>
  <svg
    class="horse-sprite"
    :class="{ 'horse-sprite--galloping': galloping }"
    :style="{ '--horse-color': color }"
    viewBox="0 0 120 84"
    aria-hidden="true"
  >
    <ellipse class="horse-sprite__shadow" cx="62" cy="81.5" rx="36" ry="2.5" />

    <g class="horse-sprite__figure">
      <path class="horse-sprite__tail" d="M32 33 C19 28 10 37 5 55 C12 49 19 46 29 46 Z" />

      <template v-for="leg in LEGS" :key="leg.id">
        <g
          v-if="leg.far"
          class="horse-sprite__leg horse-sprite__leg--far"
          :class="`horse-sprite__leg--${leg.id}`"
          :style="{ transformOrigin: hip(leg.x) }"
        >
          <rect class="horse-sprite__limb" :x="leg.x" y="46" width="6" height="21" rx="3" />
          <g class="horse-sprite__shin" :style="{ transformOrigin: knee(leg.x) }">
            <rect class="horse-sprite__limb" :x="leg.x + 1" y="63" width="4" height="16" rx="2" />
            <rect
              class="horse-sprite__hoof"
              :x="leg.x + 0.25"
              y="77.5"
              width="5.5"
              height="4"
              rx="1.2"
            />
          </g>
        </g>
      </template>

      <!-- Torso, then neck and head, then the lighter back that gives the coat some form. -->
      <path
        class="horse-sprite__coat"
        d="M30 41 C28 31 38 26 50 27 C61 28 70 26.5 80 27.5 C91 29 97 36 95 45 C93 53 83 55.5 70 54.5 C58 54 46 56.5 38 53.5 C32 51.5 30.5 46.5 30 41 Z"
      />
      <path
        class="horse-sprite__coat"
        d="M78 31 C83 22 90 14 97 9 L100 3.5 L103 9.5 C108 12 112.5 17 116 22.5 C117.5 26 115.5 29 112 28.5 C108.5 28 105 26 101.5 24 C99 31.5 96 38.5 91.5 45 Z"
      />
      <path class="horse-sprite__sheen" d="M38 33 C46 28.5 60 29.5 70 30 C62 32.5 48 33 38 33 Z" />
      <path
        class="horse-sprite__mane"
        d="M79.5 29 C84 20.5 90 13 97.5 7.5 L99.5 11 C93 16 88 23 84.5 31 Z"
      />

      <!-- Tack and rider -->
      <path class="horse-sprite__rein" d="M83 22 L112 25" />
      <template v-if="number !== undefined">
        <rect class="horse-sprite__cloth" x="50" y="29" width="15" height="12.5" rx="2" />
        <text class="horse-sprite__number" x="57.5" y="38.8">{{ number }}</text>
      </template>
      <g class="horse-sprite__rider">
        <path class="horse-sprite__boot" d="M64 25 L70.5 37 L75 36" />
        <path
          class="horse-sprite__silks"
          d="M57 26.5 C57.5 16 66 9.5 76 11.5 L79.5 17.5 C72 18.5 67.5 23 66 28.5 Z"
        />
        <path class="horse-sprite__arm" d="M74 15.5 L83 22" />
        <circle class="horse-sprite__face" cx="80.5" cy="8" r="3.8" />
        <path class="horse-sprite__cap" d="M76.4 7.8 C76.4 2 84.6 2 84.6 7.8 L88 8.8 L84.6 8.8 Z" />
      </g>

      <template v-for="leg in LEGS" :key="leg.id">
        <g
          v-if="!leg.far"
          class="horse-sprite__leg"
          :class="`horse-sprite__leg--${leg.id}`"
          :style="{ transformOrigin: hip(leg.x) }"
        >
          <rect class="horse-sprite__limb" :x="leg.x" y="46" width="6" height="21" rx="3" />
          <g class="horse-sprite__shin" :style="{ transformOrigin: knee(leg.x) }">
            <rect class="horse-sprite__limb" :x="leg.x + 1" y="63" width="4" height="16" rx="2" />
            <rect
              class="horse-sprite__hoof"
              :x="leg.x + 0.25"
              y="77.5"
              width="5.5"
              height="4"
              rx="1.2"
            />
          </g>
        </g>
      </template>

      <circle class="horse-sprite__eye" cx="106.5" cy="16" r="1.2" />
    </g>
  </svg>
</template>

<style scoped lang="scss">
$outline: #101814;
$stride: 0.44s;

.horse-sprite {
  // Shades are derived from the one colour a horse is given.
  --coat-dark: color-mix(in srgb, var(--horse-color) 58%, #{$outline});
  --coat-light: color-mix(in srgb, var(--horse-color) 62%, #ffffff);

  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;

  &__shadow {
    fill: rgb(0 0 0 / 28%);
  }

  &__coat,
  &__limb {
    fill: var(--horse-color);
    stroke: $outline;
    stroke-width: 1.5;
    stroke-linejoin: round;
  }

  &__sheen {
    fill: var(--coat-light);
    opacity: 0.55;
  }

  &__tail,
  &__mane {
    fill: var(--coat-dark);
    stroke: $outline;
    stroke-width: 1.2;
    stroke-linejoin: round;
  }

  &__leg,
  &__shin,
  &__figure,
  &__tail {
    transform-box: view-box;
  }

  &__leg--far &__limb {
    fill: var(--coat-dark);
  }

  &__figure {
    transform-origin: 60px 48px;
  }

  &__tail {
    transform-origin: 32px 34px;
  }

  &__hoof,
  &__eye,
  &__cap {
    fill: $outline;
  }

  &__rein {
    fill: none;
    stroke: $outline;
    stroke-width: 0.9;
  }

  &__cloth {
    fill: #ffffff;
    stroke: $outline;
    stroke-width: 1;
  }

  &__number {
    fill: $outline;
    font-size: 9.5px;
    font-weight: 700;
    text-anchor: middle;
  }

  &__silks {
    fill: #f6f7f2;
    stroke: $outline;
    stroke-width: 1.2;
    stroke-linejoin: round;
  }

  &__arm,
  &__boot {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &__arm {
    stroke: #f6f7f2;
    stroke-width: 3;
    paint-order: stroke;
  }

  &__boot {
    stroke: $outline;
    stroke-width: 3;
  }

  &__face {
    fill: #e9b998;
    stroke: $outline;
    stroke-width: 0.8;
  }

  &--galloping &__figure {
    animation: horse-rock $stride ease-in-out infinite;
  }

  &--galloping &__tail {
    animation: horse-tail $stride ease-in-out infinite alternate;
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
    &--galloping &__tail,
    &--galloping &__leg,
    &--galloping &__shin {
      animation: none;
    }
  }
}

// Positive angles swing a leg backwards, negative ones forwards.
@keyframes horse-thigh {
  0% {
    transform: rotate(-40deg);
  }

  45% {
    transform: rotate(36deg);
  }

  100% {
    transform: rotate(-40deg);
  }
}

// The shin stays straight while the hoof is on the ground and folds while it swings forward.
@keyframes horse-shin {
  0%,
  40% {
    transform: rotate(0deg);
  }

  70% {
    transform: rotate(78deg);
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
    transform: translateY(-2.5px) rotate(2deg);
  }
}

@keyframes horse-tail {
  from {
    transform: rotate(-6deg);
  }

  to {
    transform: rotate(10deg);
  }
}
</style>
