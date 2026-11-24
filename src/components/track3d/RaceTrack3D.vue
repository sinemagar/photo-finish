<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import type { CameraMode } from '@/scene/cameras'
import type { RaceScene } from '@/scene/RaceScene'
import type { TrackRunner } from '@/stores/meeting'

/**
 * The 3D renderer. It takes the same props as the 2D `RaceTrack`, plus a camera, and
 * draws them with three.js. three.js and the horse model are only downloaded when this
 * component is first shown.
 */
const props = withDefaults(
  defineProps<{
    runners: TrackRunner[]
    lanes: number
    distance?: number
    racing?: boolean
    speed?: number
    camera?: CameraMode
  }>(),
  { distance: undefined, racing: false, speed: 1, camera: 'tv' },
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

const label = computed(() =>
  props.distance
    ? `3D view of the racecourse, ${props.distance} m round`
    : '3D view of the racecourse',
)

function pushField() {
  scene?.setField({
    runners: props.runners,
    distance: props.distance ?? null,
    racing: props.racing,
    speed: props.speed,
  })
}

onMounted(async () => {
  try {
    const { RaceScene } = await import('@/scene/RaceScene')
    if (!canvas.value || !host.value) return

    scene = await RaceScene.create(canvas.value, MODEL_URL)
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

watch(() => [props.runners, props.distance, props.racing, props.speed], pushField)
watch(
  () => props.camera,
  (mode) => scene?.setCamera(mode),
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  scene?.dispose()
  scene = null
})
</script>

<template>
  <div
    ref="host"
    class="race-track-3d"
    data-testid="race-track"
    data-renderer="3d"
    :data-ready="isReady"
  >
    <canvas ref="canvas" class="race-track-3d__canvas" role="img" :aria-label="label" />
    <p v-if="!isReady" class="race-track-3d__loading" aria-live="polite">Loading the course…</p>
  </div>
</template>

<style scoped lang="scss">
.race-track-3d {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: linear-gradient(#a9cde6, #2b5f33);

  @media (max-width: 40rem) {
    aspect-ratio: 4 / 3;
  }

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
