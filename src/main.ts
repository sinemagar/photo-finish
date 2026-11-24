import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { useSessionStore } from './stores/session'
import { useStableStore } from './stores/stable'
import { readSessionOptions } from './utils/sessionOptions'
import './styles/main.scss'

const pinia = createPinia()

// The stable exists from the first render; the seed, when given, makes the session replayable.
useSessionStore(pinia).configure(readSessionOptions(window.location.search))
useStableStore(pinia).generate()

createApp(App).use(pinia).mount('#app')
