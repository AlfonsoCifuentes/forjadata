import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { i18n } from './i18n'
import router from './router'
import { useUiStore } from './stores/ui'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)
app.use(router)

app.config.errorHandler = (error, _instance, info) => {
  console.error('[Forjadata UI error]', { error, info })
}

useUiStore(pinia).initialize()
app.mount('#app')
