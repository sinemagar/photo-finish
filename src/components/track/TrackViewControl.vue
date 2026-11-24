<script setup lang="ts">
import { CAMERA_MODES, type CameraMode } from '@/scene/cameras'
import type { Renderer } from '@/stores/session'

const LABELS: Record<CameraMode, string> = {
  tv: 'TV',
  chase: 'Chase',
  overhead: 'Overhead',
}

const camera = defineModel<CameraMode>('camera', { required: true })
const renderer = defineModel<Renderer>('renderer', { required: true })
</script>

<template>
  <div class="track-view" data-testid="track-view">
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
        {{ LABELS[mode] }}
      </button>
    </div>
    <button
      type="button"
      class="track-view__option track-view__switch"
      data-testid="renderer-toggle"
      :aria-label="renderer === '3d' ? 'Show the 2D track' : 'Show the 3D track'"
      @click="renderer = renderer === '3d' ? '2d' : '3d'"
    >
      {{ renderer === '3d' ? '2D' : '3D' }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.track-view {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);

  &__group {
    display: inline-flex;
    padding: 2px;
    border: 1px solid var(--color-border);
    border-radius: 1rem;
    background: var(--color-surface-muted);
  }

  &__option {
    min-height: 1.75rem;
    padding: 0 var(--space-3);
    border: 0;
    border-radius: 1rem;
    background: none;
    color: var(--color-text-muted);
    font: inherit;
    font-size: var(--font-size-xs);
    font-weight: 700;
    cursor: pointer;

    &[aria-pressed='true'] {
      background: var(--color-text);
      color: var(--color-bg);
    }
  }

  &__switch {
    border: 1px solid var(--color-border);
    background: var(--color-surface-muted);
  }
}
</style>
