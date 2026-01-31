import '@/assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

import App from './App.vue'
import router from './router'

import services from './services'
import { primeVueConfig } from './primevue-config'

import 'primeicons/primeicons.css'

const app = createApp(App)

app.use(createPinia())
app.use(VueQueryPlugin)
app.use(router)
app.use(PrimeVue, primeVueConfig)
app.use(ToastService)
app.use(ConfirmationService)
app.provide('services', services)

app.mount('#app')
