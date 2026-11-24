<script setup lang="ts" generic="Id extends string">
import { nextTick, useTemplateRef } from 'vue'

export interface TabItem<TabId extends string = string> {
  id: TabId
  label: string
  /** Small counter shown after the label, hidden when zero or absent. */
  count?: number
}

const props = defineProps<{
  tabs: TabItem<Id>[]
  /** Prefix shared with the panels: tab `x` controls the element with id `${idPrefix}-panel-x`. */
  idPrefix: string
  label: string
}>()

const selected = defineModel<Id>({ required: true })

const list = useTemplateRef<HTMLElement>('list')

/** Arrow keys move between tabs, as the ARIA tabs pattern asks for. */
async function selectByOffset(offset: number) {
  const index = props.tabs.findIndex((tab) => tab.id === selected.value)
  const next = props.tabs[(index + offset + props.tabs.length) % props.tabs.length]
  if (!next) return

  selected.value = next.id
  await nextTick()
  list.value?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus()
}
</script>

<template>
  <div
    ref="list"
    class="base-tabs"
    role="tablist"
    :aria-label="label"
    @keydown.right.prevent="selectByOffset(1)"
    @keydown.left.prevent="selectByOffset(-1)"
  >
    <button
      v-for="tab in tabs"
      :id="`${idPrefix}-tab-${tab.id}`"
      :key="tab.id"
      type="button"
      role="tab"
      class="base-tabs__tab"
      :aria-selected="tab.id === selected"
      :aria-controls="`${idPrefix}-panel-${tab.id}`"
      :tabindex="tab.id === selected ? 0 : -1"
      :data-testid="`tab-${tab.id}`"
      @click="selected = tab.id"
    >
      {{ tab.label }}
      <span v-if="tab.count" class="base-tabs__count">{{ tab.count }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.base-tabs {
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);

  &__tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: 2.5rem;
    padding: 0 var(--space-2);
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

    &[aria-selected='true'] {
      background: var(--color-surface);
      color: var(--color-text);
      box-shadow: 0 1px 3px rgb(16 32 24 / 14%);
    }
  }

  &__count {
    min-width: 1.25rem;
    padding: 0 var(--space-1);
    border-radius: 1rem;
    background: var(--color-primary);
    color: var(--color-primary-contrast);
    font-size: var(--font-size-xs);
    font-variant-numeric: tabular-nums;
    line-height: 1.25rem;
    text-align: center;
  }
}
</style>
