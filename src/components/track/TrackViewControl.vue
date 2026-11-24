<script setup lang="ts">
import { CAMERA_MODES, type CameraMode } from '@/scene/cameras'
import type { Renderer } from '@/stores/session'

const CAMERAS: Record<CameraMode, { label: string; icon: string }> = {
  // Simple line icons, drawn on a 20 × 20 grid.
  tv: { label: 'TV', icon: 'M3 5h14v9H3z M7 17h6' },
  chase: { label: 'Chase', icon: 'M4 14l6-8 6 8 M7 14l3-4 3 4' },
  aerial: { label: 'Aerial', icon: 'M10 3v4 M4 7h12 M6 7l-2 9h12l-2-9' },
}

const RENDERERS: readonly Renderer[] = ['3d', '2d']

const camera = defineModel<CameraMode>('camera', { required: true })
const renderer = defineModel<Renderer>('renderer', { required: true })
</script>

<template>
  <div class="track-view" data-testid="track-view">
    <div class="track-view__group" role="group" aria-label="View">
      <button
        v-for="option in RENDERERS"
        :key="option"
        type="button"
        class="track-view__option"
        :aria-pressed="renderer === option"
        :data-testid="`renderer-${option}`"
        @click="renderer = option"
      >
        {{ option.toUpperCase() }}
      </button>
    </div>
    <div v-if="renderer === '3d'" class="track-view__group" role="group" aria-label="Camera">
      <button
        v-for="mode in CAMERA_MODES"
        :key="mode"
        type="button"
        class="track-view__option"
        :aria-pressed="camera === mode"
        :data-testid="`camera-${mode}`"
        @click="camera = mode"
      >
        <svg class="track-view__icon" viewBox="0 0 20 20" aria-hidden="true">
          <path :d="CAMERAS[mode].icon" />
        </svg>
        <span class="track-view__label">{{ CAMERAS[mode].label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.track-view {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);

  &__group {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface-muted);
  }

  &__option {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-height: 2.25rem;
    padding: 0 var(--space-3);
    border: 0;
    border-radius: calc(var(--radius-sm) - 2px);
    background: none;
    color: var(--color-text-muted);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    cursor: pointer;

    &:hover {
      color: var(--color-text);
    }

    &[aria-pressed='true'] {
      background: var(--color-accent);
      color: var(--color-accent-contrast);
    }
  }

  // On a phone the camera buttons keep their icon and lose their word, so the whole
  // toolbar fits one row; the word stays available to assistive technology.
  @media (max-width: 40rem) {
    &__option {
      padding: 0 var(--space-2);
    }

    &__label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  }

  &__icon {
    width: 1.125rem;
    height: 1.125rem;
    fill: none;
    stroke: currentcolor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}
</style>
