<script setup lang="ts">
import { onMounted, useId, useTemplateRef, watch } from 'vue'

defineProps<{
  title: string
}>()

const open = defineModel<boolean>('open', { required: true })

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = useId()

/**
 * The native `<dialog>` brings the hard parts with it: focus is trapped while it is open,
 * Escape closes it, and focus returns to the element that opened it.
 */
function sync(shouldBeOpen: boolean) {
  const element = dialog.value
  if (!element || element.hasAttribute('open') === shouldBeOpen) return

  // The attribute fallbacks cover environments without modal dialogs, such as jsdom.
  if (shouldBeOpen) {
    if (typeof element.showModal === 'function') element.showModal()
    else element.setAttribute('open', '')
  } else if (typeof element.close === 'function') {
    element.close()
  } else {
    element.removeAttribute('open')
  }
}

watch(open, sync, { flush: 'post' })
onMounted(() => sync(open.value))

/** A click on the backdrop lands on the dialog element itself, not on its content. */
function closeOnBackdrop(event: MouseEvent) {
  if (event.target === dialog.value) open.value = false
}
</script>

<template>
  <dialog
    ref="dialog"
    class="base-dialog"
    :aria-labelledby="titleId"
    @close="open = false"
    @click="closeOnBackdrop"
  >
    <div class="base-dialog__content">
      <header class="base-dialog__header">
        <h2 :id="titleId" class="base-dialog__title">{{ title }}</h2>
        <button
          type="button"
          class="base-dialog__close"
          aria-label="Close"
          data-testid="dialog-close"
          @click="open = false"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
        </button>
      </header>
      <div class="base-dialog__body">
        <slot />
      </div>
    </div>
  </dialog>
</template>

<style scoped lang="scss">
.base-dialog {
  width: min(38rem, calc(100% - var(--space-4) * 2));
  max-height: calc(100% - var(--space-4) * 2);
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow);

  &::backdrop {
    background: rgb(19 32 26 / 45%);
    backdrop-filter: blur(3px);
  }

  &__content {
    display: flex;
    flex-direction: column;
    max-height: inherit;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4) var(--space-3) var(--space-6);
    border-bottom: 1px solid var(--color-border);
  }

  &__title {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  &__close {
    display: grid;
    flex: none;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    border: 0;
    border-radius: 50%;
    background: var(--color-surface-muted);
    color: var(--color-text);
    cursor: pointer;

    svg {
      width: 1rem;
      height: 1rem;
      fill: none;
      stroke: currentcolor;
      stroke-width: 1.75;
      stroke-linecap: round;
    }
  }

  &__body {
    overflow-y: auto;
    padding: var(--space-4) var(--space-6) var(--space-6);
  }
}
</style>
