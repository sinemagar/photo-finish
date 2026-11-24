<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Coat colour as a CSS colour value. */
    color: string
    /** Plays the gallop cycle. Off while the horse is waiting, paused or finished. */
    galloping?: boolean
  }>(),
  { galloping: false },
)
</script>

<template>
  <svg
    class="horse-sprite"
    :class="{ 'horse-sprite--galloping': galloping }"
    :style="{ '--horse-color': color }"
    viewBox="0 0 64 48"
    aria-hidden="true"
  >
    <g class="horse-sprite__figure">
      <path class="horse-sprite__hair" d="M15 21 C9 20 6 25 3 33" />
      <rect
        class="horse-sprite__leg horse-sprite__leg--far"
        x="17"
        y="26"
        width="3.5"
        height="17"
        rx="1.75"
      />
      <rect
        class="horse-sprite__leg horse-sprite__leg--far horse-sprite__leg--front"
        x="39"
        y="26"
        width="3.5"
        height="17"
        rx="1.75"
      />
      <ellipse class="horse-sprite__coat" cx="30" cy="24" rx="16" ry="8" />
      <path class="horse-sprite__coat" d="M40 19 L49 6 L55 9 L46 27 Z" />
      <path
        class="horse-sprite__coat"
        d="M48 5 L49.5 0.5 L52.5 4.5 L59 8 Q63 10.5 60.5 14 L52 13 Z"
      />
      <path class="horse-sprite__hair" d="M40.5 18 L48.5 5.5" />
      <rect class="horse-sprite__leg" x="21.5" y="26" width="3.5" height="17" rx="1.75" />
      <rect
        class="horse-sprite__leg horse-sprite__leg--front"
        x="43"
        y="26"
        width="3.5"
        height="17"
        rx="1.75"
      />
      <circle class="horse-sprite__eye" cx="55.5" cy="9.5" r="0.9" />
    </g>
  </svg>
</template>

<style scoped lang="scss">
$outline: #1c2420;
$stride: 0.36s;

.horse-sprite {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;

  &__coat,
  &__leg {
    fill: var(--horse-color);
    stroke: $outline;
    stroke-width: 1.2;
    stroke-linejoin: round;
  }

  &__leg {
    transform-box: fill-box;
    transform-origin: 50% 0;

    &--far {
      filter: brightness(0.75);
    }
  }

  &__hair {
    fill: none;
    stroke: $outline;
    stroke-width: 3;
    stroke-linecap: round;
  }

  &__eye {
    fill: $outline;
  }

  &--galloping &__figure {
    animation: horse-bob $stride ease-in-out infinite;
  }

  &--galloping &__leg {
    animation: horse-stride $stride ease-in-out infinite alternate;

    // Near and far legs of a pair move in opposite phase, front and back slightly offset.
    &--far {
      animation-delay: -$stride;
    }

    &--front {
      animation-delay: -$stride * 0.5;
    }

    &--far#{&}--front {
      animation-delay: -$stride * 1.5;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &--galloping &__figure,
    &--galloping &__leg {
      animation: none;
    }
  }
}

@keyframes horse-stride {
  from {
    transform: rotate(38deg);
  }

  to {
    transform: rotate(-38deg);
  }
}

@keyframes horse-bob {
  50% {
    transform: translateY(-1.5px);
  }
}
</style>
