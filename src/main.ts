import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { useSessionStore } from './stores/session'
import { useStableStore } from './stores/stable'
import { chooseRenderer, supportsWebGL } from './renderers/choice'
import { readSessionOptions } from './utils/sessionOptions'
import './styles/main.scss'

const pinia = createPinia()
const options = readSessionOptions(window.location.search)

// The stable exists from the first render; the seed, when given, makes the session replayable.
useSessionStore(pinia).configure({
  ...options,
  // Creating a WebGL context costs time, so it is only probed when 3D might be used.
  renderer:
    options.renderer === '2d'
      ? '2d'
      : chooseRenderer(options.renderer, {
          webgl: supportsWebGL(),
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        }),
})
useStableStore(pinia).generate()

createApp(App).use(pinia).mount('#app')
