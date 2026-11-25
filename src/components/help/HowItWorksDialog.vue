<script setup lang="ts">
import { computed } from 'vue'

import BaseDialog from '@/components/ui/BaseDialog.vue'
import {
  CONDITION_RANGE,
  ROUND_DISTANCES,
  RUNNERS_PER_ROUND,
  SIMULATION,
  STABLE_SIZE,
} from '@/domain'
import { useSessionStore } from '@/stores/session'
import { formatDistance } from '@/utils/format'

const open = defineModel<boolean>('open', { required: true })

const REPOSITORY_URL = 'https://github.com/sinemagar/photo-finish'

const session = useSessionStore()

// Every figure below is read from the game's configuration, so the text cannot drift
// away from what the game actually does.
const firstDistance = formatDistance(ROUND_DISTANCES[0])
const lastDistance = formatDistance(ROUND_DISTANCES[ROUND_DISTANCES.length - 1] ?? 0)
const formPercent = Math.round(SIMULATION.formSpread * 100)

const replayUrl = computed(() => `?seed=${session.seed}`)
</script>

<template>
  <BaseDialog v-model:open="open" title="How it works" data-testid="help-dialog">
    <div class="how-it-works">
      <section>
        <h3>The meeting</h3>
        <p>
          A stable of {{ STABLE_SIZE }} horses, each with its own colour and a condition score from
          {{ CONDITION_RANGE.min }} to {{ CONDITION_RANGE.max }}. A programme is
          {{ ROUND_DISTANCES.length }} rounds, from {{ firstDistance }} up to {{ lastDistance }},
          and every round draws {{ RUNNERS_PER_ROUND }} horses at random.
        </p>
      </section>

      <section>
        <h3>Playing</h3>
        <ol>
          <li><strong>Generate</strong> draws a new programme.</li>
          <li><strong>Start</strong> runs the rounds one after another; the same button pauses.</li>
          <li>Each <strong>result</strong> appears the moment its round finishes.</li>
        </ol>
      </section>

      <section>
        <h3>What decides a race</h3>
        <ul>
          <li>
            <strong>Condition</strong> sets a horse's cruising speed, between
            {{ SIMULATION.minSpeed }} and {{ SIMULATION.maxSpeed }} metres per second.
          </li>
          <li>
            <strong>Form</strong> is drawn for each horse at the start of a round and moves that
            speed by up to {{ formPercent }}% either way.
          </li>
          <li>
            <strong>Surges</strong> make a horse gain or lose ground during the round, so the order
            keeps changing.
          </li>
        </ul>
        <p>The fittest horse wins most often, but never always.</p>
      </section>

      <section>
        <h3>Replay</h3>
        <p>
          Every random choice comes from one seed. This session runs on seed
          <strong data-testid="session-seed">{{ session.seed }}</strong
          >; opening
          <a :href="replayUrl" data-testid="replay-link">this link</a>
          brings back the same horses, programme and races.
        </p>
      </section>

      <p class="how-it-works__source">
        Built with Vue 3, Pinia and TypeScript.
        <a :href="REPOSITORY_URL" target="_blank" rel="noopener">Source on GitHub</a>
      </p>
    </div>
  </BaseDialog>
</template>

<style scoped lang="scss">
.how-it-works {
  display: grid;
  gap: var(--space-4);
  font-size: var(--font-size-sm);

  h3 {
    margin-bottom: var(--space-1);
    color: var(--color-primary);
    font-family: var(--font-display);
    font-size: 1.125rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  ol,
  ul {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    padding-left: var(--space-6);
  }

  ul + p {
    margin-top: var(--space-2);
  }

  a {
    color: var(--color-primary);
  }

  &__source {
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border);
    color: var(--color-text-muted);
  }
}
</style>
