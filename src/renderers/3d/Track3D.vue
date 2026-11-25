<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import type { CameraMode } from '@/renderers/3d/geometry/cameras'
import type { RaceScene } from '@/renderers/3d/scene/RaceScene'
import type { TrackRendererProps } from '@/renderers/types'

/**
 * The 3D renderer: the race on an oval racecourse, drawn with three.js. It takes the same
 * runners as the 2D track, plus a camera. three.js and the horse model are downloaded
 * only when this component is first shown; all drawing is done by `3d/scene/RaceScene.ts`.
 */
const props = withDefaults(
  defineProps<
    TrackRendererProps & {
      /** Freezes every horse where it stands. */
      paused?: boolean
      camera?: CameraMode
    }
  >(),
  { distance: undefined, paused: false, camera: 'tv' },
)

const emit = defineEmits<{
  /** The scene could not be created, for instance because WebGL is unavailable. */
  error: [reason: unknown]
}>()

const MODEL_URL = `${import.meta.env.BASE_URL}models/horse.glb`

const host = useTemplateRef<HTMLDivElement>('host')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const isReady = ref(false)
let scene: RaceScene | null = null
let resizeObserver: ResizeObserver | null = null
// The scene is created asynchronously; the component may be gone by the time it is ready.
let isUnmounted = false

const label = computed(() =>
  props.distance
    ? `3D view of the racecourse, ${props.distance} m round`
    : '3D view of the racecourse',
)

function pushField() {
  scene?.setField({
    runners: props.runners,
    distance: props.distance ?? null,
    paused: props.paused,
  })
}

onMounted(async () => {
  try {
    const { RaceScene } = await import('@/renderers/3d/scene/RaceScene')
    if (isUnmounted || !canvas.value || !host.value) return

    const created = await RaceScene.create(canvas.value, MODEL_URL)
    if (isUnmounted) {
      created.dispose()
      return
    }
    scene = created
    scene.setCamera(props.camera)
    pushField()

    resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) scene?.resize(entry.contentRect.width, entry.contentRect.height)
    })
    resizeObserver.observe(host.value)
    isReady.value = true
  } catch (reason) {
    emit('error', reason)
  }
})

watch([() => props.runners, () => props.distance, () => props.paused], pushField)
watch(
  () => props.camera,
  (mode) => scene?.setCamera(mode),
)

onBeforeUnmount(() => {
  isUnmounted = true
  resizeObserver?.disconnect()
  scene?.dispose()
  scene = null
})
</script>

<template>
  <div
    ref="host"
    class="track-3d"
    data-testid="race-track"
    data-renderer="3d"
    :data-ready="isReady"
  >
    <canvas ref="canvas" class="track-3d__canvas" role="img" :aria-label="label" />
    <p v-if="!isReady" class="track-3d__loading" aria-live="polite">Loading the course…</p>
  </div>
</template>

<style scoped lang="scss">
.track-3d {
  // The space is held by the stage around it, so the page does not jump while this loads.
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: var(--radius-sm);

  &__canvas {
    display: block;
    width: 100%;
    height: 100%;
  }

  &__loading {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--color-text);
    font-family: var(--font-display);
    font-size: 1.125rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
}
</style>
