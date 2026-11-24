<script setup lang="ts">
import type { MeetingStatus } from '@/domain'

defineProps<{
  status: MeetingStatus
}>()

const LABELS: Record<MeetingStatus, string> = {
  idle: 'No programme',
  ready: 'Ready',
  running: 'Racing',
  paused: 'Paused',
  intermission: 'Next round soon',
  finished: 'Finished',
}
</script>

<template>
  <span class="status-badge" :class="`status-badge--${status}`" data-testid="status-badge">
    <span class="status-badge__dot" aria-hidden="true" />
    {{ LABELS[status] }}
  </span>
</template>

<style scoped lang="scss">
.status-badge {
  --tone: var(--color-text-muted);

  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.125rem var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: var(--color-surface-muted);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;

  &__dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--tone);
  }

  &--ready,
  &--intermission {
    --tone: var(--color-accent);
  }

  &--running {
    --tone: var(--color-primary);
  }

  &--paused {
    --tone: var(--color-danger);
  }

  &--finished {
    --tone: var(--color-text);
  }

  @media (prefers-reduced-motion: no-preference) {
    &--running &__dot {
      animation: status-pulse 1s ease-in-out infinite alternate;
    }
  }
}

@keyframes status-pulse {
  to {
    opacity: 0.35;
  }
}
</style>
