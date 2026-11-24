import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { createStable, type Horse } from '@/domain'

import { useSessionStore } from './session'

export const useStableStore = defineStore('stable', () => {
  const session = useSessionStore()

  const horses = ref<Horse[]>([])

  const horsesById = computed(() => new Map(horses.value.map((horse) => [horse.id, horse])))

  function generate() {
    horses.value = createStable(session.random)
  }

  function getHorse(id: Horse['id']): Horse | undefined {
    return horsesById.value.get(id)
  }

  return { horses, generate, getHorse }
})
