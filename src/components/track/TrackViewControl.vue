<script setup lang="ts">
import { computed } from 'vue'

import type { CameraMode } from '@/scene/cameras'
import type { Renderer } from '@/stores/session'

type View = CameraMode | '2d'

/** The three 3D cameras and the flat 2D track, offered as one choice of view. */
const VIEWS: { id: View; label: string; icon: string }[] = [
  // Simple line icons, drawn on a 20 × 20 grid.
  { id: 'tv', label: 'TV', icon: 'M3 5h14v9H3z M7 17h6' },
  { id: 'chase', label: 'Chase', icon: 'M4 14l6-8 6 8 M7 14l3-4 3 4' },
  { id: 'aerial', label: 'Aerial', icon: 'M10 3v4 M4 7h12 M6 7l-2 9h12l-2-9' },
  { id: '2d', label: '2D', icon: 'M3 6h14 M3 10h14 M3 14h14' },
]

const camera = defineModel<CameraMode>('camera', { required: true })
const renderer = defineModel<Renderer>('renderer', { required: true })

const current = computed<View>(() => (renderer.value === '2d' ? '2d' : camera.value))

function choose(view: View) {
  if (view === '2d') {
    renderer.value = '2d'
    return
  }
  renderer.value = '3d'
  camera.value = view
}
</script>

<template>
  <div class="track-view" role="group" aria-label="View" data-testid="track-view">
    <button
      v-for="view in VIEWS"
      :key="view.id"
      type="button"
      class="track-view__option"
      :aria-pressed="current === view.id"
      :data-testid="view.id === '2d' ? 'renderer-2d' : `camera-${view.id}`"
      @click="choose(view.id)"
    >
      <svg class="track-view__icon" viewBox="0 0 20 20" aria-hidden="true">
        <path :d="view.icon" />
      </svg>
      <span class="track-view__label">{{ view.label }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.track-view {
  display: inline-flex;
  flex: none;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);

  &__option {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    min-width: 2.5rem;
    min-height: 2.5rem;
    padding: 0 var(--space-3);
    border: 0;
    border-radius: calc(var(--radius-sm) - 3px);
    background: none;
    color: var(--color-text-muted);
    font: inherit;
    font-size: var(--font-size-sm);
    font-weight: 650;
    cursor: pointer;

    &:hover {
      color: var(--color-text);
    }

    &[aria-pressed='true'] {
      background: var(--color-selected);
      color: var(--color-primary);
      box-shadow: var(--shadow-selected);
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

  // On a phone each view keeps its icon and loses its word, so the toolbar fits one row;
  // the word stays available to assistive technology.
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
}
</style>
