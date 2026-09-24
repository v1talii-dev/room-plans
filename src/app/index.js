import { createApp } from 'vue'
import './styles/index.css'
import App from './App.vue'

export function mountApp(selector) {
  return createApp(App).mount(selector)
}
